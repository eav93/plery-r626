<template>
  <div class="page-form">

    <div class="box">
      <div class="section-title">{{ t('reboot') }}</div>
      <div class="form-row">
        <label class="form-row__label"></label>
        <div class="form-row__value" style="padding: 4px 0">
          <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:12px">
            {{ t('reboot_tip') || 'The device will restart. Connection will be lost for ~30 seconds.' }}
          </p>
          <button class="btn btn-primary" :disabled="rebooting" @click="doReboot">
            {{ rebooting ? (t('tip') || 'Rebooting…') : t('reboot') }}
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="countdown > 0" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
        <div class="bg-white border border-[#9eb9c2] rounded px-14 py-10 flex flex-col items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <p class="text-[16px] font-medium">{{ t('tip') || 'Rebooting…' }}</p>
          <p class="text-[52px] font-bold text-[#ed6c00] leading-none">{{ countdown }}s</p>
          <p class="text-[12px] text-[#888]">Page will reload automatically</p>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi'

const { t } = useI18n()
const { apiAction } = useApi()
const rebooting = ref(false)
const countdown = ref(0)

async function doReboot() {
  if (rebooting.value) return
  if (!confirm(t('reboot') + '?')) return
  rebooting.value = true
  try { await apiAction('reboot') } catch { /* connection drops — expected */ }
  countdown.value = 40
  const timer = setInterval(() => {
    if (--countdown.value <= 0) { clearInterval(timer); window.location.reload() }
  }, 1000)
}
</script>

