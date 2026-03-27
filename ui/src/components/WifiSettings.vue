<template>
  <!-- Band Steering toggle -->
  <div class="box">
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

  <!-- Band Steering ON: shared settings + per-radio grid -->
  <template v-if="bandSteering">
    <div class="box">
      <div class="section-title">{{ t('wifi_network') }}</div>

      <FormField :label="t('ssid') || 'SSID'">
        <input v-model="shared.ssid" type="text" maxlength="32" />
      </FormField>

      <FormField :label="t('encrypt') || 'Шифрование'">
        <select v-model="shared.encryption">
          <option value="psk2">WPA2-PSK</option>
          <option value="psk-mixed">WPA/WPA2-PSK</option>
          <option value="psk">WPA-PSK</option>
          <option value="none">{{ t('none') || 'Открытая' }}</option>
        </select>
      </FormField>

      <FormField v-if="shared.encryption !== 'none'" :label="t('wifi_passwd') || 'Пароль'">
        <input v-model="shared.key" :type="showSharedPwd ? 'text' : 'password'" maxlength="63" />
        <button class="pwd-toggle" @click="showSharedPwd = !showSharedPwd">{{ showSharedPwd ? '🙈' : '👁' }}</button>
      </FormField>

      <FormField :label="t('hidden') || 'Скрыть SSID'">
        <label class="toggle">
          <input type="checkbox" v-model="shared.hidden" />
          <span class="toggle__track"><span class="toggle__thumb"></span></span>
        </label>
      </FormField>
    </div>

    <div class="radio-grid">
      <div v-for="r in radios" :key="r.id" class="box">
        <div class="section-title">{{ r.label }}</div>

        <FormField :label="t('channels') || 'Канал'">
          <select v-model="r.channel">
            <option value="auto">{{ t('auto') || 'Авто' }}</option>
            <option v-for="ch in r.channels" :key="ch" :value="String(ch)">{{ ch }}</option>
          </select>
        </FormField>

        <FormField :label="t('wifi_enable') || 'Радио'">
          <label class="toggle">
            <input type="checkbox" v-model="r.enabled" />
            <span class="toggle__track"><span class="toggle__thumb"></span></span>
            <span class="ml-2 text-sm">{{ r.enabled ? (t('enable') || 'Вкл') : (t('disable') || 'Выкл') }}</span>
          </label>
        </FormField>
      </div>
    </div>
  </template>

  <!-- Band Steering OFF: two independent columns -->
  <div v-else class="radio-grid">
    <div v-for="r in radios" :key="r.id" class="box">
      <div class="section-title">{{ r.label }}</div>

      <FormField :label="t('ssid') || 'SSID'">
        <input v-model="r.ssid" type="text" maxlength="32" />
      </FormField>

      <FormField :label="t('encrypt') || 'Шифрование'">
        <select v-model="r.encryption">
          <option value="psk2">WPA2-PSK</option>
          <option value="psk-mixed">WPA/WPA2-PSK</option>
          <option value="psk">WPA-PSK</option>
          <option value="none">{{ t('none') || 'Открытая' }}</option>
        </select>
      </FormField>

      <FormField v-if="r.encryption !== 'none'" :label="t('wifi_passwd') || 'Пароль'">
        <input v-model="r.key" :type="showPwd[r.id] ? 'text' : 'password'" maxlength="63" />
        <button class="pwd-toggle" @click="showPwd[r.id] = !showPwd[r.id]">{{ showPwd[r.id] ? '🙈' : '👁' }}</button>
      </FormField>

      <FormField :label="t('channels') || 'Канал'">
        <select v-model="r.channel">
          <option value="auto">{{ t('auto') || 'Авто' }}</option>
          <option v-for="ch in r.channels" :key="ch" :value="String(ch)">{{ ch }}</option>
        </select>
      </FormField>

      <FormField :label="t('hidden') || 'Скрыть SSID'">
        <label class="toggle">
          <input type="checkbox" v-model="r.hidden" />
          <span class="toggle__track"><span class="toggle__thumb"></span></span>
        </label>
      </FormField>

      <FormField :label="t('wifi_enable') || 'Радио'">
        <label class="toggle">
          <input type="checkbox" v-model="r.enabled" />
          <span class="toggle__track"><span class="toggle__thumb"></span></span>
          <span class="ml-2 text-sm">{{ r.enabled ? (t('enable') || 'Вкл') : (t('disable') || 'Выкл') }}</span>
        </label>
      </FormField>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi'
import FormField from '@/components/FormField.vue'

const { t } = useI18n()
const { uciGet } = useApi()

// ── Static config ─────────────────────────────────────────────────────────────

interface RadioConfig {
  id: string; label: string; channels: number[]
  iface: string; radio: string
  // form state
  ssid: string; key: string; encryption: string
  hidden: boolean; channel: string; enabled: boolean
}

const radios = reactive<RadioConfig[]>([
  {
    id: '24g', label: '2.4 GHz',
    channels: [1,2,3,4,5,6,7,8,9,10,11,12,13],
    iface: 'wireless.@wifi-iface[0]', radio: 'wireless.radio0',
    ssid: '', key: '', encryption: 'psk2', hidden: false, channel: 'auto', enabled: true,
  },
  {
    id: '5g', label: '5 GHz',
    channels: [36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,149,153,157,161,165],
    iface: 'wireless.@wifi-iface[8]', radio: 'wireless.radio1',
    ssid: '', key: '', encryption: 'psk2', hidden: false, channel: 'auto', enabled: true,
  },
])

const bandSteering  = ref(false)
const shared        = reactive({ ssid: '', key: '', encryption: 'psk2', hidden: false })
const showSharedPwd = ref(false)
const showPwd       = reactive<Record<string, boolean>>({ '24g': false, '5g': false })

// ── Load from UCI ─────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const keys = radios.flatMap(r => [
      `${r.iface}.ssid`, `${r.iface}.key`, `${r.iface}.encryption`,
      `${r.iface}.hidden`, `${r.iface}.disabled`,
      `${r.radio}.channel`, `${r.radio}.disabled`,
    ])
    const data = await uciGet(keys)

    for (const r of radios) {
      r.ssid       = data[`${r.iface}.ssid`]       || ''
      r.key        = data[`${r.iface}.key`]         || ''
      r.encryption = data[`${r.iface}.encryption`]  || 'psk2'
      r.hidden     = data[`${r.iface}.hidden`]      === '1'
      r.channel    = data[`${r.radio}.channel`]     || 'auto'
      r.enabled    = data[`${r.iface}.disabled`]    !== '1'
                  && data[`${r.radio}.disabled`]    !== '1'
    }

    // Auto-detect band steering: same SSID + key on both bands
    const [a, b] = radios
    if (a.ssid && a.ssid === b.ssid && a.key === b.key) {
      bandSteering.value  = true
      shared.ssid         = a.ssid
      shared.key          = a.key
      shared.encryption   = a.encryption
      shared.hidden       = a.hidden
    }
  } catch { /* ignore */ }
})

// ── Band steering switch: pre-fill per-radio fields from shared ───────────────

watch(bandSteering, (on) => {
  if (!on) {
    for (const r of radios) {
      if (!r.ssid) r.ssid = shared.ssid
      if (r.id === '5g' && r.ssid && !/5G$/i.test(r.ssid)) r.ssid += ' 5G'
      r.key        = shared.key
      r.encryption = shared.encryption
      r.hidden     = shared.hidden
    }
  }
})

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns a flat UCI object ready for uciSet() */
function getUci(): Record<string, string> {
  const uci: Record<string, string> = {}
  for (const r of radios) {
    const ssid       = bandSteering.value ? shared.ssid       : r.ssid
    const key        = bandSteering.value ? shared.key        : r.key
    const encryption = bandSteering.value ? shared.encryption : r.encryption
    const hidden     = bandSteering.value ? shared.hidden     : r.hidden

    uci[`${r.iface}.ssid`]       = ssid
    uci[`${r.iface}.encryption`] = encryption
    uci[`${r.iface}.key`]        = encryption === 'none' ? '' : key
    uci[`${r.iface}.hidden`]     = hidden ? '1' : '0'
    uci[`${r.iface}.disabled`]   = r.enabled ? '0' : '1'
    uci[`${r.radio}.channel`]    = r.channel
    uci[`${r.radio}.disabled`]   = r.enabled ? '0' : '1'
  }
  return uci
}

defineExpose({ getUci })
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
