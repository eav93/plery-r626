<template>
  <div class="page-form">

    <!-- Band Steering toggle -->
    <div class="box mb-4">
      <div class="form-row">
        <label class="form-row__label">{{ t('band_steering') }}</label>
        <div class="form-row__value flex items-center gap-3">
          <label class="toggle">
            <input type="checkbox" v-model="bandSteering" />
            <span class="toggle__track"><span class="toggle__thumb"></span></span>
          </label>
          <span class="text-xs text-[#888]">
            {{ bandSteering ? t('band_steering_on_hint') : t('band_steering_off_hint') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Band Steering ON: shared network settings + per-radio grid -->
    <template v-if="bandSteering">
      <div class="box mb-4">
        <div class="section-title">{{ t('wifi_network') }}</div>

        <FormField :label="t('ssid') || 'SSID'">
          <input v-model="shared.ssid" type="text" maxlength="32" />
        </FormField>

        <FormField :label="t('wifi_passwd') || 'Пароль'">
          <input v-model="shared.key" :type="showSharedPwd ? 'text' : 'password'" maxlength="63" />
          <button class="pwd-toggle" @click="showSharedPwd = !showSharedPwd">{{ showSharedPwd ? '🙈' : '👁' }}</button>
        </FormField>

        <FormField :label="t('encrypt') || 'Шифрование'">
          <select v-model="shared.encryption">
            <option value="psk2">WPA2-PSK</option>
            <option value="psk-mixed">WPA/WPA2-PSK</option>
            <option value="psk">WPA-PSK</option>
            <option value="none">{{ t('none') || 'Открытая' }}</option>
          </select>
        </FormField>

        <FormField :label="t('hidden') || 'Скрыть SSID'">
          <label class="toggle">
            <input type="checkbox" v-model="shared.hidden" />
            <span class="toggle__track"><span class="toggle__thumb"></span></span>
          </label>
        </FormField>
      </div>

      <!-- Per-radio: channel + enable -->
      <div class="radio-grid mb-4">
        <div v-for="r in radios" :key="r.id" class="box">
          <div class="section-title">{{ r.label }}</div>

          <FormField :label="t('channels') || 'Канал'">
            <select v-model="r.form.channel">
              <option value="auto">{{ t('auto') || 'Авто' }}</option>
              <option v-for="ch in r.channels" :key="ch" :value="String(ch)">{{ ch }}</option>
            </select>
          </FormField>

          <FormField :label="t('wifi_enable') || 'Радио'">
            <label class="toggle">
              <input type="checkbox" v-model="r.form.enabled" />
              <span class="toggle__track"><span class="toggle__thumb"></span></span>
              <span class="ml-2 text-sm">{{ r.form.enabled ? (t('enable') || 'Вкл') : (t('disable') || 'Выкл') }}</span>
            </label>
          </FormField>
        </div>
      </div>
    </template>

    <!-- Band Steering OFF: two independent columns -->
    <template v-else>
      <div class="radio-grid mb-4">
        <div v-for="r in radios" :key="r.id" class="box">
          <div class="section-title">{{ r.label }}</div>

          <FormField :label="t('ssid') || 'SSID'">
            <input v-model="r.form.ssid" type="text" maxlength="32" />
          </FormField>

          <FormField :label="t('wifi_passwd') || 'Пароль'">
            <input v-model="r.form.key" :type="showPwd[r.id] ? 'text' : 'password'" maxlength="63" />
            <button class="pwd-toggle" @click="showPwd[r.id] = !showPwd[r.id]">{{ showPwd[r.id] ? '🙈' : '👁' }}</button>
          </FormField>

          <FormField :label="t('encrypt') || 'Шифрование'">
            <select v-model="r.form.encryption">
              <option value="psk2">WPA2-PSK</option>
              <option value="psk-mixed">WPA/WPA2-PSK</option>
              <option value="psk">WPA-PSK</option>
              <option value="none">{{ t('none') || 'Открытая' }}</option>
            </select>
          </FormField>

          <FormField :label="t('channels') || 'Канал'">
            <select v-model="r.form.channel">
              <option value="auto">{{ t('auto') || 'Авто' }}</option>
              <option v-for="ch in r.channels" :key="ch" :value="String(ch)">{{ ch }}</option>
            </select>
          </FormField>

          <FormField :label="t('hidden') || 'Скрыть SSID'">
            <label class="toggle">
              <input type="checkbox" v-model="r.form.hidden" />
              <span class="toggle__track"><span class="toggle__thumb"></span></span>
            </label>
          </FormField>

          <FormField :label="t('wifi_enable') || 'Радио'">
            <label class="toggle">
              <input type="checkbox" v-model="r.form.enabled" />
              <span class="toggle__track"><span class="toggle__thumb"></span></span>
              <span class="ml-2 text-sm">{{ r.form.enabled ? (t('enable') || 'Вкл') : (t('disable') || 'Выкл') }}</span>
            </label>
          </FormField>
        </div>
      </div>
    </template>

    <div class="form-actions">
      <button class="btn btn-primary" :disabled="saving" @click="saveAll">
        {{ saving ? '…' : (t('save') || 'Сохранить') }}
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

interface RadioForm {
  ssid: string; key: string; encryption: string
  channel: string; hidden: boolean; enabled: boolean
}
interface Radio {
  id: string; label: string
  radioKey: string; ifaceKey: string
  channels: number[]
  form: RadioForm
}

const defaultForm = (): RadioForm => ({
  ssid: '', key: '', encryption: 'psk2', channel: 'auto', hidden: false, enabled: true,
})

const radios: Radio[] = reactive([
  {
    id: '24g', label: '2.4 GHz',
    radioKey: 'wireless.radio0', ifaceKey: 'wireless.@wifi-iface[0]',
    channels: [1,2,3,4,5,6,7,8,9,10,11,12,13],
    form: defaultForm(),
  },
  {
    id: '5g', label: '5 GHz',
    radioKey: 'wireless.radio1', ifaceKey: 'wireless.@wifi-iface[8]',
    channels: [36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,149,153,157,161,165],
    form: defaultForm(),
  },
])

const bandSteering = ref(false)
const shared = reactive({ ssid: '', key: '', encryption: 'psk2', hidden: false })
const showSharedPwd = ref(false)
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
      r.form.channel    = data[`${r.radioKey}.channel`]    || 'auto'
      r.form.ssid       = data[`${r.ifaceKey}.ssid`]       || ''
      r.form.key        = data[`${r.ifaceKey}.key`]        || ''
      r.form.encryption = data[`${r.ifaceKey}.encryption`] || 'psk2'
      r.form.hidden     = data[`${r.ifaceKey}.hidden`]     === '1'
      r.form.enabled    = data[`${r.ifaceKey}.disabled`]   !== '1'
        && data[`${r.radioKey}.disabled`] !== '1'
    }

    // Auto-detect band steering: both bands have same SSID and password
    const [a, b] = radios
    if (a.form.ssid && a.form.ssid === b.form.ssid && a.form.key === b.form.key) {
      bandSteering.value = true
      shared.ssid       = a.form.ssid
      shared.key        = a.form.key
      shared.encryption = a.form.encryption
      shared.hidden     = a.form.hidden
    }
  } catch { /* ignore */ }
})

async function saveAll() {
  if (saving.value) return
  saving.value = true
  try {
    const uci: Record<string, string> = {}

    for (const r of radios) {
      // When band steering, sync shared fields to both radios
      const ssid       = bandSteering.value ? shared.ssid       : r.form.ssid
      const key        = bandSteering.value ? shared.key        : r.form.key
      const encryption = bandSteering.value ? shared.encryption : r.form.encryption
      const hidden     = bandSteering.value ? shared.hidden     : r.form.hidden

      uci[`${r.ifaceKey}.ssid`]       = ssid
      uci[`${r.ifaceKey}.encryption`] = encryption
      uci[`${r.ifaceKey}.key`]        = key
      uci[`${r.ifaceKey}.hidden`]     = hidden ? '1' : '0'
      uci[`${r.ifaceKey}.disabled`]   = r.form.enabled ? '0' : '1'
      uci[`${r.radioKey}.channel`]    = r.form.channel
      uci[`${r.radioKey}.disabled`]   = r.form.enabled ? '0' : '1'
    }

    await uciSet(uci)
    await apiAction('apply', { service: 'wireless' })
    success(t('set_ok') || 'Сохранено')
  } catch { error(t('set_err') || 'Ошибка') }
  finally { saving.value = false }
}
</script>

<style scoped>
.radio-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (max-width: 600px) {
  .radio-grid { grid-template-columns: 1fr; }
}
.pwd-toggle {
  padding: 0 8px;
  height: 30px;
  border: 1px solid #9eb9c2;
  border-radius: 2px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}
</style>
