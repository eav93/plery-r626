<template>
  <div class="page-form">

    <ul class="flex list-none m-0 p-0">
      <li v-for="r in radios" :key="r.id"
          class="flex-1 text-center leading-9 cursor-pointer text-white border-r border-r-[rgba(255,255,255,0.25)] text-[14px] select-none last:border-r-0"
          :class="activeRadio === r.id ? 'bg-[#ed6c00]' : 'bg-[#ed994d] hover:bg-[#e08540]'"
          @click="activeRadio = r.id">{{ r.label }}</li>
    </ul>

    <template v-for="r in radios" :key="r.id">
      <div v-show="activeRadio === r.id">
        <div class="box">
          <div class="section-title">{{ r.label }}</div>

          <FormField :label="t('ssid') || 'SSID'">
            <input v-model="r.form.ssid" type="text" maxlength="32" />
          </FormField>

          <FormField :label="t('wifi_passwd') || 'Password'">
            <input v-model="r.form.key"
                   :type="showPwd[r.id] ? 'text' : 'password'"
                   maxlength="63" />
            <button class="px-2 h-[30px] border border-[#9eb9c2] rounded-[2px] bg-white cursor-pointer text-[14px] leading-none shrink-0" @click="showPwd[r.id] = !showPwd[r.id]">
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
interface Radio {
  id: string; label: string
  radioKey: string  // wireless.radio0 / wireless.radio1 — wifi-device section
  ifaceKey: string  // wireless.@wifi-iface[N] — primary AP section (ssid/enc/key/hidden/disabled)
  channels: number[]
  form: RadioForm
}

const defaultForm = (): RadioForm => ({
  ssid: '', key: '', encryption: 'psk2', channel: 'auto', hidden: false, enabled: true,
})

const radios: Radio[] = reactive([
  {
    id: '24g', label: '2.4 GHz',
    radioKey:  'wireless.radio0',
    ifaceKey:  'wireless.@wifi-iface[0]',  // ra0 — primary 2.4G AP
    channels: [1,2,3,4,5,6,7,8,9,10,11,12,13],
    form: defaultForm(),
  },
  {
    id: '5g', label: '5 GHz',
    radioKey:  'wireless.radio1',
    ifaceKey:  'wireless.@wifi-iface[8]',  // rai0 — primary 5G AP
    channels: [36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,149,153,157,161,165],
    form: defaultForm(),
  },
])

const activeRadio = ref('24g')
const showPwd = reactive<Record<string, boolean>>({ '24g': false, '5g': false })

onMounted(async () => {
  try {
    const data = await uciGet(radios.flatMap(r => [
      `${r.radioKey}.channel`,
      `${r.radioKey}.disabled`,
      `${r.ifaceKey}.ssid`,
      `${r.ifaceKey}.encryption`,
      `${r.ifaceKey}.key`,
      `${r.ifaceKey}.hidden`,
      `${r.ifaceKey}.disabled`,
    ]))
    for (const r of radios) {
      r.form.channel    = data[`${r.radioKey}.channel`]     || 'auto'
      r.form.ssid       = data[`${r.ifaceKey}.ssid`]        || ''
      r.form.key        = data[`${r.ifaceKey}.key`]         || ''
      r.form.encryption = data[`${r.ifaceKey}.encryption`]  || 'psk2'
      r.form.hidden     = data[`${r.ifaceKey}.hidden`]      === '1'
      r.form.enabled    = data[`${r.ifaceKey}.disabled`]    !== '1'
        && data[`${r.radioKey}.disabled`] !== '1'
    }
  } catch { /* ignore */ }
})

async function save(r: Radio) {
  if (saving.value) return
  saving.value = true
  try {
    await uciSet({
      [`${r.ifaceKey}.ssid`]:        r.form.ssid,
      [`${r.ifaceKey}.encryption`]:  r.form.encryption,
      [`${r.ifaceKey}.key`]:         r.form.key,
      [`${r.ifaceKey}.hidden`]:      r.form.hidden ? '1' : '0',
      [`${r.ifaceKey}.disabled`]:    r.form.enabled ? '0' : '1',
      [`${r.radioKey}.channel`]:     r.form.channel,
      [`${r.radioKey}.disabled`]:    r.form.enabled ? '0' : '1',
    })
    await apiAction('apply', { service: 'wireless' })
    success(t('set_ok') || 'Saved')
  } catch { error(t('set_err') || 'Error') }
  finally { saving.value = false }
}
</script>
