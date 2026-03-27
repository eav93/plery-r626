<template>
  <div class="page-form">
    <WanSettings ref="wanRef" />

    <div class="form-actions">
      <button class="btn btn-primary" :disabled="saving" @click="save">
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
import WanSettings from '@/components/WanSettings.vue'

const { t } = useI18n()
const { uciSet, apiAction } = useApi()
const { success, error } = useNotify()
const saving = ref(false)
const wanRef = ref<InstanceType<typeof WanSettings>>()

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    await uciSet(wanRef.value!.getUci())
    await apiAction('apply', { service: 'network' })
    success(t('set_ok') || 'Сохранено')
  } catch { error(t('set_err') || 'Ошибка') }
  finally { saving.value = false }
}
</script>
