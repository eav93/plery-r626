<template>
  <div class="page-form">
    <LanSettings ref="lanRef" />
    <div class="form-actions">
      <button class="btn btn-primary" :disabled="saving" @click="save">
        {{ saving ? '…' : (t('save') || 'Save') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi'
import { useNotify } from '@/composables/useNotify'
import LanSettings from '@/components/LanSettings.vue'

const { t } = useI18n()
const { uciSet, apiAction } = useApi()
const { success, error } = useNotify()

const saving = ref(false)
const lanRef = ref<InstanceType<typeof LanSettings>>()

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    await uciSet(lanRef.value!.getUci())
    await apiAction('apply', { service: 'network' })
    success(t('set_ok') || 'Saved')
  } catch { error(t('set_err') || 'Error') }
  finally { saving.value = false }
}
</script>
