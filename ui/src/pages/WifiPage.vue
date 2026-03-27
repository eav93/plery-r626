<template>
  <div class="page-form">
    <WifiSettings v-model="wifi" />

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
import WifiSettings, { type WifiSettingsValue } from '@/components/WifiSettings.vue'

const { t } = useI18n()
const { uciGet, uciSet, apiAction } = useApi()
const { success, error } = useNotify()
const saving = ref(false)

const IFACE0 = 'wireless.@wifi-iface[0]'
const IFACE8 = 'wireless.@wifi-iface[8]'

const wifi = reactive<WifiSettingsValue>({
  bandSteering: false,
  shared: { ssid: '', key: '', encryption: 'psk2', hidden: false },
  radios: [
    {
      id: '24g', label: '2.4 GHz',
      channels: [1,2,3,4,5,6,7,8,9,10,11,12,13],
      ssid: '', key: '', encryption: 'psk2', hidden: false, channel: 'auto', enabled: true,
    },
    {
      id: '5g', label: '5 GHz',
      channels: [36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,149,153,157,161,165],
      ssid: '', key: '', encryption: 'psk2', hidden: false, channel: 'auto', enabled: true,
    },
  ],
})

onMounted(async () => {
  try {
    const data = await uciGet([
      'wireless.radio0.channel', 'wireless.radio0.disabled',
      'wireless.radio1.channel', 'wireless.radio1.disabled',
      `${IFACE0}.ssid`, `${IFACE0}.key`, `${IFACE0}.encryption`,
      `${IFACE0}.hidden`, `${IFACE0}.disabled`,
      `${IFACE8}.ssid`, `${IFACE8}.key`, `${IFACE8}.encryption`,
      `${IFACE8}.hidden`, `${IFACE8}.disabled`,
    ])

    const [r24, r5] = wifi.radios
    r24.ssid       = data[`${IFACE0}.ssid`]       || ''
    r24.key        = data[`${IFACE0}.key`]         || ''
    r24.encryption = data[`${IFACE0}.encryption`]  || 'psk2'
    r24.hidden     = data[`${IFACE0}.hidden`]      === '1'
    r24.channel    = data['wireless.radio0.channel'] || 'auto'
    r24.enabled    = data[`${IFACE0}.disabled`]    !== '1'
                  && data['wireless.radio0.disabled'] !== '1'

    r5.ssid        = data[`${IFACE8}.ssid`]        || ''
    r5.key         = data[`${IFACE8}.key`]          || ''
    r5.encryption  = data[`${IFACE8}.encryption`]   || 'psk2'
    r5.hidden      = data[`${IFACE8}.hidden`]       === '1'
    r5.channel     = data['wireless.radio1.channel'] || 'auto'
    r5.enabled     = data[`${IFACE8}.disabled`]     !== '1'
                  && data['wireless.radio1.disabled'] !== '1'

    // Auto-detect band steering
    if (r24.ssid && r24.ssid === r5.ssid && r24.key === r5.key) {
      wifi.bandSteering     = true
      wifi.shared.ssid       = r24.ssid
      wifi.shared.key        = r24.key
      wifi.shared.encryption = r24.encryption
      wifi.shared.hidden     = r24.hidden
    }
  } catch { /* ignore */ }
})

async function saveAll() {
  if (saving.value) return
  saving.value = true
  try {
    const uci: Record<string, string> = {}
    const ifaces = [
      { iface: IFACE0, radio: 'wireless.radio0', r: wifi.radios[0] },
      { iface: IFACE8, radio: 'wireless.radio1', r: wifi.radios[1] },
    ]
    for (const { iface, radio, r } of ifaces) {
      const ssid       = wifi.bandSteering ? wifi.shared.ssid       : r.ssid
      const key        = wifi.bandSteering ? wifi.shared.key        : r.key
      const encryption = wifi.bandSteering ? wifi.shared.encryption : r.encryption
      const hidden     = wifi.bandSteering ? wifi.shared.hidden     : r.hidden

      uci[`${iface}.ssid`]       = ssid
      uci[`${iface}.encryption`] = encryption
      uci[`${iface}.key`]        = encryption === 'none' ? '' : key
      uci[`${iface}.hidden`]     = hidden ? '1' : '0'
      uci[`${iface}.disabled`]   = r.enabled ? '0' : '1'
      uci[`${radio}.channel`]    = r.channel
      uci[`${radio}.disabled`]   = r.enabled ? '0' : '1'
    }

    await uciSet(uci)
    await apiAction('apply', { service: 'wireless' })
    success(t('set_ok') || 'Сохранено')
  } catch { error(t('set_err') || 'Ошибка') }
  finally { saving.value = false }
}
</script>
