<template>
  <div class="page-form">

    <div class="card">
      <div class="section-title">{{ t('reboot') }}</div>
      <p style="font-size:13px;color:var(--color-text-muted)">
        {{ t('reboot_tip') || 'The device will restart. Connection will be lost for ~30 seconds.' }}
      </p>
      <div class="form-actions">
        <button class="btn btn-primary" :disabled="rebooting" @click="doReboot">
          <AppIcon name="restart_alt" :size="16" />
          {{ rebooting ? (t('tip') || 'Rebooting…') : t('reboot') }}
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="countdown > 0" class="reboot-overlay">
        <div class="reboot-card">
          <AppIcon name="restart_alt" :size="48" style="color:var(--color-primary)" />
          <p>{{ t('tip') || 'Rebooting…' }}</p>
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
import AppIcon from '@/components/AppIcon.vue'

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
  background: var(--color-surface); border-radius: 12px; padding: 40px 48px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,.2); font-size: 15px; font-weight: 500;
}
.countdown { font-size: 48px; font-weight: 700; color: var(--color-primary); line-height: 1; }
</style>
