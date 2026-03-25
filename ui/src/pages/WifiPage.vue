<template>
  <div class="page-form">

    <!-- Radio tabs (2.4 GHz / 5 GHz) -->
    <div class="radio-tabs">
      <button
        v-for="r in radios" :key="r.id"
        class="radio-tab"
        :class="{ 'is-active': activeRadio === r.id }"
        @click="activeRadio = r.id"
      >{{ r.label }}</button>
    </div>

    <template v-for="r in radios" :key="r.id">
      <div v-show="activeRadio === r.id" class="card">
        <div class="section-title">{{ r.label }}</div>

        <FormField :label="t('ssid') || 'SSID'">
          <input v-model="r.form.ssid" type="text" maxlength="32" />
        </FormField>

        <FormField :label="t('wifi_passwd') || 'Password'">
          <div style="display:flex;gap:6px">
            <input
              v-model="r.form.key"
              :type="showPwd[r.id] ? 'text' : 'password'"
              maxlength="63"
              style="flex:1"
            />
            <button class="btn btn-ghost" style="width:36px;padding:0" @click="showPwd[r.id] = !showPwd[r.id]">
              {{ showPwd[r.id] ? '🙈' : '👁' }}
            </button>
          </div>
        </FormField>

        <FormField :label="t('encrypt') || 'Encryption'">
          <select v-model="r.form.encryption">
            <option value="psk2">WPA2-PSK (recommended)</option>
            <option value="psk-mixed">WPA/WPA2-PSK</option>
            <option value="psk">WPA-PSK</option>
            <option value="none">{{ t('none') || 'None (open)' }}</option>
          </select>
        </FormField>

        <FormField :label="t('channel') || 'Channel'">
          <select v-model="r.form.channel">
            <option value="auto">{{ t('auto') || 'Auto' }}</option>
            <option v-for="ch in r.channels" :key="ch" :value="String(ch)">{{ ch }}</option>
          </select>
        </FormField>

        <FormField :label="t('hidden') || 'Hidden SSID'">
          <label class="toggle">
            <input type="checkbox" v-model="r.form.hidden" />
            <span class="toggle__track"><span class="toggle__thumb"></span></span>
            <span>{{ r.form.hidden ? (t('enable') || 'Yes') : (t('disable') || 'No') }}</span>
          </label>
        </FormField>

        <FormField :label="t('wifi_enable') || 'Radio'">
          <label class="toggle">
            <input type="checkbox" v-model="r.form.enabled" />
            <span class="toggle__track"><span class="toggle__thumb"></span></span>
            <span>{{ r.form.enabled ? (t('enable') || 'Enabled') : (t('disable') || 'Disabled') }}</span>
          </label>
        </FormField>

        <div class="form-actions">
          <button class="btn btn-primary" :disabled="saving" @click="save(r)">
            {{ saving ? '…' : (t('save') || 'Save') }}
          </button>
        </div>
      </div>
    </template>

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

interface RadioForm { ssid: string; key: string; encryption: string; channel: string; hidden: boolean; enabled: boolean }
interface Radio { id: string; label: string; radioKey: string; wifiKey: string; channels: number[]; form: RadioForm }

const defaultForm = (): RadioForm => ({
  ssid: '', key: '', encryption: 'psk2', channel: 'auto', hidden: false, enabled: true,
})

const radios: Radio[] = reactive([
  {
    id: '24g', label: '2.4 GHz', radioKey: 'wireless.radio0', wifiKey: 'wireless.mbox',
    channels: [1,2,3,4,5,6,7,8,9,10,11,12,13],
    form: defaultForm(),
  },
  {
    id: '5g', label: '5 GHz', radioKey: 'wireless.radio1', wifiKey: 'wireless.mbox5g',
    channels: [36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,149,153,157,161,165],
    form: defaultForm(),
  },
])

const activeRadio = ref('24g')
const showPwd = reactive<Record<string, boolean>>({ '24g': false, '5g': false })

onMounted(async () => {
  try {
    const keys: string[] = []
    for (const r of radios) {
      keys.push(
        `${r.radioKey}.channel`, `${r.radioKey}.disabled`,
        `${r.wifiKey}.ssid`, `${r.wifiKey}.key`,
        `${r.wifiKey}.encryption`, `${r.wifiKey}.hidden`, `${r.wifiKey}.disabled`,
      )
    }
    const data = await uciGet(keys)
    for (const r of radios) {
      r.form.channel    = data[`${r.radioKey}.channel`]    || 'auto'
      r.form.ssid       = data[`${r.wifiKey}.ssid`]        || ''
      r.form.key        = data[`${r.wifiKey}.key`]         || ''
      r.form.encryption = data[`${r.wifiKey}.encryption`]  || 'psk2'
      r.form.hidden     = data[`${r.wifiKey}.hidden`]      === '1'
      r.form.enabled    = data[`${r.wifiKey}.disabled`]    !== '1'
        && data[`${r.radioKey}.disabled`] !== '1'
    }
  } catch { /* ignore */ }
})

async function save(r: Radio) {
  if (saving.value) return
  saving.value = true
  try {
    await uciSet({
      [`${r.radioKey}.channel`]:    r.form.channel,
      [`${r.radioKey}.disabled`]:   r.form.enabled ? '0' : '1',
      [`${r.wifiKey}.ssid`]:        r.form.ssid,
      [`${r.wifiKey}.key`]:         r.form.key,
      [`${r.wifiKey}.encryption`]:  r.form.encryption,
      [`${r.wifiKey}.hidden`]:      r.form.hidden ? '1' : '0',
      [`${r.wifiKey}.disabled`]:    r.form.enabled ? '0' : '1',
    })
    await apiAction('apply', { service: 'wireless' })
    success(t('set_ok') || 'Saved')
  } catch { error(t('set_err') || 'Error') }
  finally { saving.value = false }
}
</script>

<style scoped>
.radio-tabs { display: flex; gap: 4px; }
.radio-tab {
  padding: 8px 20px; border-radius: var(--radius);
  border: 1px solid var(--color-border); font-size: 13px;
  font-weight: 500; cursor: pointer; background: var(--color-surface);
  transition: all .15s;
}
.radio-tab.is-active {
  background: var(--color-primary); color: #fff; border-color: var(--color-primary);
}
</style>
