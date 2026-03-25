<template>
  <div class="page-form">

    <div class="card">
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
      <div v-if="countdown > 0" class="reboot-overlay">
        <div class="reboot-card">
          <p style="font-size:16px;font-weight:500">{{ t('tip') || 'Rebooting…' }}</p>
          <p class="countdown">{{ countdown }}s</p>
          <p style="font-size:12px;color:var(--color-text-muted)">Page will reload automatically</p>
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

<style scoped>
.reboot-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.reboot-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 40px 56px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,.2);
}
.countdown { font-size: 52px; font-weight: 700; color: #ed6c00; line-height: 1; }
</style>
