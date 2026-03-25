<template>
  <div class="page-form">

    <ul class="wire-tabs">
      <li v-for="r in radios" :key="r.id"
          :class="{ active: activeRadio === r.id }"
          @click="activeRadio = r.id">{{ r.label }}</li>
    </ul>

    <template v-for="r in radios" :key="r.id">
      <div v-show="activeRadio === r.id">
        <div class="card">
          <div class="section-title">{{ r.label }}</div>

          <FormField :label="t('ssid') || 'SSID'">
            <input v-model="r.form.ssid" type="text" maxlength="32" />
          </FormField>

          <FormField :label="t('wifi_passwd') || 'Password'">
            <input v-model="r.form.key"
                   :type="showPwd[r.id] ? 'text' : 'password'"
                   maxlength="63" />
            <button class="btn-eye" @click="showPwd[r.id] = !showPwd[r.id]">
              {{ showPwd[r.id] ? '🙈' : '👁' }}
            </button>
          </FormField>

          <FormField :label="t('encrypt') || 'Encryption'">
            <select v-model="r.form.encryption">
              <option value="psk2">WPA2-PSK</option>
              <option value="psk-mixed">WPA/WPA2-PSK</option>
              <option value="psk">WPA-PSK</option>
              <option value="none">{{ t('none') || 'None (open)' }}</option>
            </select>
          </FormField>

          <FormField :label="t('channels') || 'Channel'">
            <select v-model="r.form.channel">
              <option value="auto">{{ t('auto') || 'Auto' }}</option>
              <option v-for="ch in r.channels" :key="ch" :value="String(ch)">{{ ch }}</option>
            </select>
          </FormField>

          <FormField :label="t('hidden') || 'Hidden SSID'">
            <label class="toggle">
              <input type="checkbox" v-model="r.form.hidden" />
              <span class="toggle__track"><span class="toggle__thumb"></span></span>
              <span>{{ r.form.hidden ? (t('enable') || 'On') : (t('disable') || 'Off') }}</span>
            </label>
          </FormField>

          <FormField :label="t('wifi_enable') || 'Radio'">
            <label class="toggle">
              <input type="checkbox" v-model="r.form.enabled" />
              <span class="toggle__track"><span class="toggle__thumb"></span></span>
              <span>{{ r.form.enabled ? (t('enable') || 'Enabled') : (t('disable') || 'Disabled') }}</span>
            </label>
          </FormField>
        </div>

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
      r.form.channel    = data[`${r.radioKey}.channel`]   || 'auto'
      r.form.ssid       = data[`${r.wifiKey}.ssid`]       || ''
      r.form.key        = data[`${r.wifiKey}.key`]        || ''
      r.form.encryption = data[`${r.wifiKey}.encryption`] || 'psk2'
      r.form.hidden     = data[`${r.wifiKey}.hidden`]     === '1'
      r.form.enabled    = data[`${r.wifiKey}.disabled`]   !== '1'
        && data[`${r.radioKey}.disabled`] !== '1'
    }
  } catch { /* ignore */ }
})

async function save(r: Radio) {
  if (saving.value) return
  saving.value = true
  try {
    await uciSet({
      [`${r.radioKey}.channel`]:   r.form.channel,
      [`${r.radioKey}.disabled`]:  r.form.enabled ? '0' : '1',
      [`${r.wifiKey}.ssid`]:       r.form.ssid,
      [`${r.wifiKey}.key`]:        r.form.key,
      [`${r.wifiKey}.encryption`]: r.form.encryption,
      [`${r.wifiKey}.hidden`]:     r.form.hidden ? '1' : '0',
      [`${r.wifiKey}.disabled`]:   r.form.enabled ? '0' : '1',
    })
    await apiAction('apply', { service: 'wireless' })
    success(t('set_ok') || 'Saved')
  } catch { error(t('set_err') || 'Error') }
  finally { saving.value = false }
}
</script>

<style scoped>
.wire-tabs {
  display: flex;
  list-style: none;
  margin: 0 0 0 0;
  padding: 0;
}
.wire-tabs li {
  flex: 1;
  text-align: center;
  line-height: 36px;
  cursor: pointer;
  color: #fff;
  background: #ed994d;
  border-right: 1px solid rgba(255,255,255,.25);
  font-size: 14px;
  user-select: none;
}
.wire-tabs li:last-child { border-right: none; }
.wire-tabs li.active     { background: #ed6c00; }
.wire-tabs li:hover:not(.active) { background: #e08540; }

.btn-eye {
  padding: 0 8px;
  height: 30px;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  background: var(--color-surface);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}
</style>
