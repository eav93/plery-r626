<template>
  <div class="page-form">
    <WifiSettings ref="wifiRef" />

    <div class="form-actions">
      <button class="btn btn-primary" :disabled="saving" @click="saveAll">
        {{ saving ? '…' : (t('save') || 'Сохранить') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi'
import { useNotify } from '@/composables/useNotify'
import WifiSettings from '@/components/WifiSettings.vue'

const { t } = useI18n()
const { uciSet, apiAction } = useApi()
const { success, error } = useNotify()
const saving  = ref(false)
const wifiRef = ref<InstanceType<typeof WifiSettings>>()

async function saveAll() {
  if (saving.value) return
  saving.value = true
  try {
    await uciSet(wifiRef.value!.getUci())
    await apiAction('reload_config', { package: 'wireless' })
    success(t('set_ok') || 'Сохранено')
  } catch { error(t('set_err') || 'Ошибка') }
  finally { saving.value = false }
}
</script>
