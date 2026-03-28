<template>
  <div class="page-form">
    <div class="box">
      <div class="section-title">{{ t('dns') || 'DNS' }}</div>

      <FormField :label="t('dns_mode') || 'Режим DNS'">
        <label class="toggle">
          <input type="checkbox" v-model="manual" />
          <span class="toggle__track"><span class="toggle__thumb"></span></span>
          <span class="ml-2 text-sm">{{ manual ? (t('manual') || 'Вручную') : (t('auto') || 'Авто') }}</span>
        </label>
      </FormField>

      <template v-if="manual">
        <FormField :label="t('mdns') || 'Основной DNS'">
          <input v-model="form.dns1" type="text" placeholder="8.8.8.8" />
        </FormField>

        <FormField :label="t('adns') || 'Резервный DNS'">
          <input v-model="form.dns2" type="text" placeholder="8.8.4.4" />
        </FormField>
      </template>
    </div>

    <div class="form-actions">
      <button class="btn btn-primary" :disabled="saving" @click="save">
        {{ saving ? '…' : (t('save') || 'Save') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi'
import { useNotify } from '@/composables/useNotify'
import FormField from '@/components/FormField.vue'

const { t } = useI18n()
const { uciGet, uciSet, apiAction } = useApi()
const { success, error } = useNotify()

const saving = ref(false)
const manual = ref(false)

const form = reactive({ dns1: '', dns2: '' })

onMounted(async () => {
  try {
    const data = await uciGet(['network.wan.dns', 'network.wan.peerdns'])
    // peerdns=0 means manual DNS is set
    manual.value = data['network.wan.peerdns'] === '0'
    const parts = (data['network.wan.dns'] || '').split(' ').filter(Boolean)
    form.dns1 = parts[0] || ''
    form.dns2 = parts[1] || ''
  } catch { /* ignore */ }
})

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    const dns = [form.dns1, form.dns2].filter(Boolean).join(' ')
    await uciSet({
      'network.wan.peerdns': manual.value ? '0' : '1',
      'network.wan.dns':     manual.value ? dns : '',
    })
    await apiAction('apply', { service: 'network' })
    success(t('set_ok') || 'Saved')
  } catch { error(t('set_err') || 'Error') }
  finally { saving.value = false }
}
</script>
