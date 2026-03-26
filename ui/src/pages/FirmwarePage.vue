<template>
  <div class="w-full md:w-1/2 mx-auto">

    <!-- Online Update -->
    <div class="box">
      <div class="section-title">{{ t('onlineupg') }}</div>

      <div v-if="status.new_version && status.new_version !== currentVersion" class="form-row">
        <label class="form-row__label">{{ t('BestNewVersion') }}</label>
        <div class="form-row__value font-mono text-sm text-[#ed6c00] font-semibold">{{ status.new_version }}</div>
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
      <button v-if="state === 'idle' || state === 'up_to_date' || state === 'error'"
              class="btn btn-primary" :disabled="busy" @click="checkUpdate">
        {{ t('ManualCheck') }}
      </button>
      <button v-if="state === 'checking'" class="btn btn-ghost" disabled>
        {{ t('CheckVersion') }}
      </button>
      <button v-if="state === 'ready'" class="btn btn-primary" @click="applyOnline">
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
import { useSystemStore } from '@/stores/system'

const { t } = useI18n()
const { post } = useApi()
const { error } = useNotify()
const store = useSystemStore()

interface FwStatus {
  state: string
  new_version: string
  download_pct: number
}

const status = ref<FwStatus>({
  state: 'idle', new_version: '', download_pct: 0,
})

const currentVersion = computed(() => store.version?.version ?? '')
const state = computed(() => status.value.state)

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
  const interval = ACTIVE_STATES.has(state.value) ? 2000 : 10000
  pollTimer = setTimeout(async () => { await fetchStatus(); schedulePoll() }, interval)
}

function startCountdown(sec: number) {
  countdown.value = sec
  const t = setInterval(() => {
    if (--countdown.value <= 0) { clearInterval(t); window.location.reload() }
  }, 1000)
}

async function checkUpdate() {
  busy.value = true
  try { await post('/api/firmware/check') } catch { /* ignore */ }
  await fetchStatus()
  schedulePoll()
  busy.value = false
}

async function cancelDownload() {
  await post('/api/firmware/cancel').catch(() => {})
  await fetchStatus()
}

async function applyOnline() {
  const keep = onlineKeep.value ? 1 : 0
  applying.value = true
  try { await post(`/api/firmware/apply?keep=${keep}`) } catch { /* ignore */ }
  startCountdown(90)
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
    case 'up_to_date':  return t('AlreadyNewVersion')
    case 'downloading': return t('CheckNewVersion')
    case 'ready':       return t('NewVersionOK')
    case 'error':       return t('NetworkError')
    default:            return ''
  }
})

onMounted(async () => {
  await fetchStatus()
  schedulePoll()
})
onUnmounted(() => { if (pollTimer) clearTimeout(pollTimer) })
</script>
