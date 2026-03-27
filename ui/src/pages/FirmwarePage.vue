<template>
  <div class="page-form">

    <!-- Online Update -->
    <div class="box">
      <div class="section-title">{{ t('onlineupg') }}</div>

      <div class="form-row">
        <label class="form-row__label">{{ t('current_ver') }}</label>
        <div class="form-row__value font-mono text-sm">{{ currentVersion || '—' }}</div>
      </div>

      <div v-if="status.new_version" class="form-row">
        <label class="form-row__label">{{ t('BestNewVersion') }}</label>
        <div class="form-row__value font-mono text-sm flex items-center gap-1.5">
          <span v-if="isNewer" :title="t('newer')" class="text-[#ed6c00]">▲</span>
          <span v-else-if="isUpToDate" :title="t('AlreadyNewVersion')" class="text-[#5cb85c]">✓</span>
          <span>{{ status.new_version }}</span>
        </div>
      </div>

      <!-- Progress bar (downloading) -->
      <div v-if="state === 'downloading'" class="form-row">
        <label class="form-row__label">{{ t('DownloadNote1') }}</label>
        <div class="form-row__value flex items-center gap-3">
          <div class="flex-1 bg-[#eee] rounded h-2 overflow-hidden">
            <div class="h-full bg-[#ed6c00] transition-all" :style="{ width: status.download_pct + '%' }" />
          </div>
          <span class="text-sm text-[#ed6c00] font-semibold shrink-0">{{ status.download_pct }}%</span>
        </div>
      </div>

      <!-- Status message -->
      <div v-if="onlineStatusMsg" class="form-row">
        <label class="form-row__label"></label>
        <div class="form-row__value text-sm" :class="state === 'error' ? 'text-[#d9534f]' : 'text-[#888]'">
          {{ onlineStatusMsg }}
        </div>
      </div>

      <!-- Keep settings checkbox -->
      <div class="form-row">
        <label class="form-row__label">{{ t('keep_settings') }}</label>
        <div class="form-row__value">
          <label class="toggle">
            <input type="checkbox" v-model="onlineKeep" />
            <span class="toggle__track"><span class="toggle__thumb" /></span>
          </label>
        </div>
      </div>
    </div>

    <!-- Online buttons -->
    <div class="form-actions">
      <button v-if="state !== 'downloading'"
              class="btn btn-primary" :disabled="busy || state === 'checking'" @click="checkUpdate">
        <svg v-if="busy || state === 'checking'" class="animate-spin inline-block mr-1 w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        {{ t('ManualCheck') }}
      </button>
      <button v-if="state === 'checked'" class="btn btn-primary" @click="startUpdate">
        {{ t('update') }}
      </button>
      <button v-if="state === 'downloading'" class="btn btn-ghost" @click="cancelDownload">
        {{ t('CancelDown') }}
      </button>
    </div>

    <!-- Manual Update -->
    <div class="box mt-4">
      <div class="section-title">{{ t('upgrade') }}</div>

      <div class="form-row">
        <label class="form-row__label">{{ t('select_file') }}</label>
        <div class="form-row__value">
          <input ref="fileInput" type="file" accept=".bin" class="hidden" @change="onFileChange" />
          <button class="btn btn-ghost" @click="fileInput?.click()">
            {{ selectedFile ? selectedFile.name : t('select_file') + ' (.bin)' }}
          </button>
        </div>
      </div>

      <!-- Upload progress -->
      <div v-if="uploadPct > 0 && uploadPct < 100" class="form-row">
        <label class="form-row__label"></label>
        <div class="form-row__value flex items-center gap-3">
          <div class="flex-1 bg-[#eee] rounded h-2 overflow-hidden">
            <div class="h-full bg-[#1d1e1f] transition-all" :style="{ width: uploadPct + '%' }" />
          </div>
          <span class="text-sm font-semibold shrink-0">{{ uploadPct }}%</span>
        </div>
      </div>

      <div class="form-row">
        <label class="form-row__label">{{ t('keep_settings') }}</label>
        <div class="form-row__value">
          <label class="toggle">
            <input type="checkbox" v-model="manualKeep" />
            <span class="toggle__track"><span class="toggle__thumb" /></span>
          </label>
        </div>
      </div>

      <div class="form-row">
        <label class="form-row__label"></label>
        <div class="form-row__value text-xs text-[#888]">{{ t('upgrade_tip') }}</div>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn btn-primary" :disabled="!selectedFile || uploading" @click="uploadFirmware">
        {{ uploading ? t('tip') : t('upload_sys') }}
      </button>
    </div>

    <!-- Applying overlay -->
    <Teleport to="body">
      <div v-if="applying" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
        <div class="bg-white border border-[#9eb9c2] rounded px-14 py-10 flex flex-col items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <p class="text-[16px] font-medium">{{ t('tip') }}</p>
          <p class="text-[52px] font-bold text-[#ed6c00] leading-none">{{ countdown }}s</p>
          <p class="text-[12px] text-[#888]">Страница перезагрузится автоматически</p>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi'
import { useNotify } from '@/composables/useNotify'

const { t } = useI18n()
const { post } = useApi()
const { error } = useNotify()

interface FwStatus {
  state: string
  new_version: string
  download_pct: number
  current_version?: string
  err_msg?: string
}

const status = ref<FwStatus>({
  state: 'idle', new_version: '', download_pct: 0, current_version: '', err_msg: '',
})

const currentVersion = computed(() => status.value.current_version ?? '')
const state = computed(() => status.value.state)

const DATE_RE = /(\d{8}-\d{4,6})$/
function extractDate(v: string) { return v.match(DATE_RE)?.[1] ?? '' }
const isNewer = computed(() => {
  const cur = extractDate(currentVersion.value)
  const nv  = extractDate(status.value.new_version)
  return cur.length > 0 && nv.length > 0 && nv > cur
})
const isUpToDate = computed(() =>
  !!status.value.new_version && status.value.new_version === currentVersion.value
)

const onlineKeep = ref(true)
const manualKeep = ref(true)
const busy       = ref(false)
const uploading  = ref(false)
const uploadPct  = ref(0)
const applying   = ref(false)
const countdown  = ref(0)

const fileInput   = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)

let pollTimer: ReturnType<typeof setTimeout> | null = null

const ACTIVE_STATES = new Set(['checking', 'downloading', 'applying'])

async function fetchStatus() {
  try {
    const r = await fetch('/api/firmware/status', { cache: 'no-store' })
    const d: FwStatus & { errCode?: number } = await r.json()
    if (d.errCode === 0) status.value = d
    if (d.state === 'applying') {
      applying.value = true
      startCountdown(90)
    }
  } catch { /* ignore */ }
}

function schedulePoll() {
  if (pollTimer) clearTimeout(pollTimer)
  if (!ACTIVE_STATES.has(state.value)) return
  pollTimer = setTimeout(async () => { await fetchStatus(); schedulePoll() }, 2000)
}

function startCountdown(sec: number) {
  countdown.value = sec
  const t = setInterval(() => {
    if (--countdown.value <= 0) { clearInterval(t); window.location.reload() }
  }, 1000)
}

async function checkUpdate() {
  busy.value = true
  status.value = { ...status.value, state: 'idle', new_version: '', download_pct: 0, err_msg: '' }
  try {
    await post('/api/firmware/check')
  } catch {
    error(t('NetworkError'))
    busy.value = false
    return
  }
  status.value = { ...status.value, state: 'checking' }
  schedulePoll()
  busy.value = false
}

async function cancelDownload() {
  await post('/api/firmware/cancel').catch(() => {})
  await fetchStatus()
}

async function startUpdate() {
  const keep = onlineKeep.value ? 1 : 0
  try {
    await post(`/api/firmware/update?keep=${keep}`)
  } catch {
    error(t('set_err'))
    return
  }
  await fetchStatus()
  schedulePoll()
}

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files && files[0]) selectedFile.value = files[0]
}

async function uploadFirmware() {
  if (!selectedFile.value) return
  if (!selectedFile.value.name.match(/\.bin$/i)) {
    error('Файл должен иметь расширение .bin')
    return
  }
  uploading.value = true
  uploadPct.value = 0

  const fd = new FormData()
  fd.append('file', selectedFile.value)

  const keep = manualKeep.value ? 1 : 0
  try {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/api/firmware/upload?keep=${keep}`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) uploadPct.value = Math.round(e.loaded * 100 / e.total)
      }
      xhr.onload = () => {
        if (xhr.status === 200) resolve()
        else reject(new Error(xhr.statusText))
      }
      xhr.onerror = () => reject(new Error('Upload error'))
      xhr.send(fd)
    })
    applying.value = true
    startCountdown(90)
  } catch (e) {
    error(t('set_err'))
    uploading.value = false
    uploadPct.value = 0
  }
}

const onlineStatusMsg = computed(() => {
  switch (state.value) {
    case 'checking':    return t('CheckVersion')
    case 'checked':     return ''
    case 'downloading': return t('CheckNewVersion')
    case 'error':       return status.value.err_msg || t('NetworkError')
    default:            return ''
  }
})

onMounted(async () => {
  await fetchStatus()
  if (state.value === 'idle') checkUpdate()
  else schedulePoll()
})
onUnmounted(() => { if (pollTimer) clearTimeout(pollTimer) })
</script>
