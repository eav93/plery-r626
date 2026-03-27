<template>
  <div class="page-form">

    <!-- Step progress bar -->
    <div class="box mb-4">
      <div class="flex items-stretch">
        <div
          v-for="(step, idx) in steps"
          :key="step.key"
          class="flex-1 flex items-center justify-center gap-2 py-3 text-[13px] select-none border-r border-r-[#d6e4e8] last:border-r-0"
          :class="idx === currentStep
            ? 'bg-[#ed6c00] text-white font-semibold'
            : idx < currentStep
              ? 'bg-[#f5f5f5] text-[#ed6c00]'
              : 'bg-white text-[#aaa]'"
        >
          <span
            class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold shrink-0"
            :class="idx === currentStep
              ? 'bg-white text-[#ed6c00]'
              : idx < currentStep
                ? 'bg-[#ed6c00] text-white'
                : 'bg-[#ddd] text-white'"
          >{{ idx + 1 }}</span>
          <span>{{ t(step.label) || step.label }}</span>
        </div>
      </div>
    </div>

    <!-- Step: WAN -->
    <div v-if="steps[currentStep]?.key === 'wan'" class="box">
      <div class="section-title">{{ t('wan_set') || 'WAN' }}</div>

      <!-- Proto tabs -->
      <div class="form-row">
        <label class="form-row__label">{{ t('wan') || 'Connection' }}</label>
        <div class="form-row__value">
          <ul class="flex list-none m-0 p-0">
            <li
              v-for="p in wanProtos"
              :key="p.value"
              class="cursor-pointer px-4 leading-8 text-white border-r border-r-[rgba(255,255,255,0.3)] text-[13px] select-none first:rounded-l last:rounded-r last:border-r-0"
              :class="form.wan.proto === p.value ? 'bg-[#ed6c00]' : 'bg-[#ed994d] hover:bg-[#e08540]'"
              @click="form.wan.proto = p.value"
            >{{ p.label }}</li>
          </ul>
        </div>
      </div>

      <template v-if="form.wan.proto === 'qmi'">
        <div class="form-row">
          <label class="form-row__label">{{ t('apninfo') }}</label>
          <div class="form-row__value">
            <select v-model="form.wan.apnMode">
              <option value="auto">{{ t('apn_auto') }}</option>
              <option value="manual">{{ t('apn_nanual') }}</option>
            </select>
          </div>
        </div>
        <template v-if="form.wan.apnMode === 'manual'">
          <div class="form-row">
            <label class="form-row__label">{{ t('apnauth') }}</label>
            <div class="form-row__value">
              <select v-model="form.wan.apnAuth">
                <option value="0">{{ t('auth_none') }}</option>
                <option value="1">{{ t('auth_pap') }}</option>
                <option value="2">{{ t('auth_chap') }}</option>
                <option value="3">{{ t('auth_pap_chap') }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <label class="form-row__label">{{ t('apn') }}</label>
            <div class="form-row__value">
              <input v-model="form.wan.apn" type="text" placeholder="internet" />
            </div>
          </div>
          <div class="form-row">
            <label class="form-row__label">{{ t('apn_user') }}</label>
            <div class="form-row__value">
              <input v-model="form.wan.apnUser" type="text" autocomplete="username" />
            </div>
          </div>
          <div class="form-row">
            <label class="form-row__label">{{ t('apn_psd') }}</label>
            <div class="form-row__value">
              <input v-model="form.wan.apnPassword" type="password" autocomplete="current-password" />
            </div>
          </div>
        </template>
      </template>

      <p v-if="form.wan.proto === 'dhcp'"
         class="form-row field-hint" style="padding:8px 0 4px">
        {{ t('auto_ip_hint') }}
      </p>

      <template v-if="form.wan.proto === 'pppoe'">
        <div class="form-row">
          <label class="form-row__label">{{ t('pppoe_name') || 'Username' }}</label>
          <div class="form-row__value">
            <input v-model="form.wan.username" type="text" autocomplete="username" />
          </div>
        </div>
        <div class="form-row">
          <label class="form-row__label">{{ t('pppoe_psd') || 'Password' }}</label>
          <div class="form-row__value">
            <input v-model="form.wan.password" type="password" autocomplete="current-password" />
          </div>
        </div>
        <div class="form-row">
          <label class="form-row__label">MTU</label>
          <div class="form-row__value">
            <input v-model="form.wan.mtu" type="number" min="576" max="1500" />
          </div>
        </div>
      </template>

      <template v-if="form.wan.proto === 'static'">
        <div class="form-row">
          <label class="form-row__label">{{ t('ip_addr') || 'IP Address' }}</label>
          <div class="form-row__value">
            <input v-model="form.wan.ipaddr" type="text" placeholder="0.0.0.0" />
          </div>
        </div>
        <div class="form-row">
          <label class="form-row__label">{{ t('netmask') || 'Netmask' }}</label>
          <div class="form-row__value">
            <select v-model="form.wan.netmask">
              <option v-for="m in netmaskOptions" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <label class="form-row__label">{{ t('gateway') || 'Gateway' }}</label>
          <div class="form-row__value">
            <input v-model="form.wan.gateway" type="text" placeholder="0.0.0.0" />
          </div>
        </div>
        <div class="form-row">
          <label class="form-row__label">{{ t('dns') || 'DNS' }}</label>
          <div class="form-row__value">
            <input v-model="form.wan.dns" type="text" placeholder="8.8.8.8" />
          </div>
        </div>
      </template>
    </div>

    <!-- Step: LAN -->
    <div v-if="steps[currentStep]?.key === 'lan'" class="box">
      <div class="section-title">{{ t('lan_set') || 'LAN' }}</div>

      <div class="form-row">
        <label class="form-row__label">{{ t('ip_addr') || 'IP Address' }}</label>
        <div class="form-row__value">
          <input v-model="form.lan.ipaddr" type="text" placeholder="192.168.0.1" />
        </div>
      </div>
      <div class="form-row">
        <label class="form-row__label">{{ t('netmask') || 'Netmask' }}</label>
        <div class="form-row__value">
          <select v-model="form.lan.netmask">
            <option v-for="m in netmaskOptions" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Step: WiFi — 2.4G -->
    <div v-if="steps[currentStep]?.key === 'wifi'" class="box">
      <div class="section-title">{{ t('wifi24g') }}</div>
      <div class="form-row">
        <label class="form-row__label">{{ t('ssid') }}</label>
        <div class="form-row__value">
          <input v-model="form.wifi24.ssid" type="text" maxlength="32" />
        </div>
      </div>
      <div class="form-row">
        <label class="form-row__label">{{ t('encrypt') }}</label>
        <div class="form-row__value">
          <select v-model="form.wifi24.encryption">
            <option value="none">{{ t('none') }}</option>
            <option value="psk2">WPA2-PSK</option>
            <option value="psk-mixed">WPA/WPA2-PSK</option>
          </select>
        </div>
      </div>
      <div v-if="form.wifi24.encryption !== 'none'" class="form-row">
        <label class="form-row__label">{{ t('ssid_pwd') }}</label>
        <div class="form-row__value">
          <input v-model="form.wifi24.key" type="text" maxlength="63" />
        </div>
      </div>
      <div class="form-row">
        <label class="form-row__label">{{ t('hidden') }}</label>
        <div class="form-row__value">
          <label class="toggle"><input type="checkbox" v-model="form.wifi24.hidden" /><span></span></label>
        </div>
      </div>
    </div>

    <!-- Step: WiFi — 5G -->
    <div v-if="steps[currentStep]?.key === 'wifi'" class="box mt-4">
      <div class="section-title">{{ t('wifi58g') }}</div>
      <div class="form-row">
        <label class="form-row__label">{{ t('ssid') }}</label>
        <div class="form-row__value">
          <input v-model="form.wifi5g.ssid" type="text" maxlength="32" />
        </div>
      </div>
      <div class="form-row">
        <label class="form-row__label">{{ t('encrypt') }}</label>
        <div class="form-row__value">
          <select v-model="form.wifi5g.encryption">
            <option value="none">{{ t('none') }}</option>
            <option value="psk2">WPA2-PSK</option>
            <option value="psk-mixed">WPA/WPA2-PSK</option>
          </select>
        </div>
      </div>
      <div v-if="form.wifi5g.encryption !== 'none'" class="form-row">
        <label class="form-row__label">{{ t('ssid_pwd') }}</label>
        <div class="form-row__value">
          <input v-model="form.wifi5g.key" type="text" maxlength="63" />
        </div>
      </div>
      <div class="form-row">
        <label class="form-row__label">{{ t('hidden') }}</label>
        <div class="form-row__value">
          <label class="toggle"><input type="checkbox" v-model="form.wifi5g.hidden" /><span></span></label>
        </div>
      </div>
    </div>

    <!-- Step: Confirm -->
    <div v-if="steps[currentStep]?.key === 'confirm'" class="box">
      <div class="section-title">{{ t('confirm') || 'Confirm' }}</div>

      <!-- WAN summary (router only) -->
      <template v-if="mode === 'router'">
        <div class="section-title" style="font-size:13px;margin-top:8px">{{ t('wan') || 'WAN' }}</div>
        <div class="form-row">
          <label class="form-row__label">{{ t('wan') || 'Type' }}</label>
          <div class="form-row__value">{{ wanProtoLabel }}</div>
        </div>
        <template v-if="form.wan.proto === 'pppoe'">
          <div class="form-row">
            <label class="form-row__label">{{ t('pppoe_name') || 'Username' }}</label>
            <div class="form-row__value">{{ form.wan.username || '—' }}</div>
          </div>
          <div class="form-row">
            <label class="form-row__label">MTU</label>
            <div class="form-row__value">{{ form.wan.mtu }}</div>
          </div>
        </template>
        <template v-if="form.wan.proto === 'static'">
          <div class="form-row">
            <label class="form-row__label">{{ t('ip_addr') || 'IP' }}</label>
            <div class="form-row__value">{{ form.wan.ipaddr || '—' }}</div>
          </div>
          <div class="form-row">
            <label class="form-row__label">{{ t('netmask') || 'Netmask' }}</label>
            <div class="form-row__value">{{ form.wan.netmask }}</div>
          </div>
          <div class="form-row">
            <label class="form-row__label">{{ t('gateway') || 'Gateway' }}</label>
            <div class="form-row__value">{{ form.wan.gateway || '—' }}</div>
          </div>
          <div class="form-row">
            <label class="form-row__label">{{ t('dns') || 'DNS' }}</label>
            <div class="form-row__value">{{ form.wan.dns || '—' }}</div>
          </div>
        </template>
      </template>

      <!-- LAN summary -->
      <div class="section-title" style="font-size:13px;margin-top:8px">{{ t('lan') || 'LAN' }}</div>
      <div class="form-row">
        <label class="form-row__label">{{ t('ip_addr') || 'IP' }}</label>
        <div class="form-row__value">{{ form.lan.ipaddr }}</div>
      </div>
      <div class="form-row">
        <label class="form-row__label">{{ t('netmask') || 'Netmask' }}</label>
        <div class="form-row__value">{{ form.lan.netmask }}</div>
      </div>

      <!-- WiFi summary -->
      <div class="section-title" style="font-size:13px;margin-top:8px">{{ t('wireless') || 'WiFi' }}</div>
      <div class="form-row">
        <label class="form-row__label">{{ t('ssid_name_24g') || '2.4G SSID' }}</label>
        <div class="form-row__value">{{ form.wifi24.ssid || '—' }}</div>
      </div>
      <div class="form-row">
        <label class="form-row__label">{{ t('ssid_name_58g') || '5G SSID' }}</label>
        <div class="form-row__value">{{ form.wifi5g.ssid || '—' }}</div>
      </div>
    </div>

    <!-- Navigation buttons -->
    <div class="flex items-center gap-3 mt-4">
      <button
        v-if="currentStep > 0"
        class="btn btn-ghost"
        :disabled="applying"
        @click="currentStep--"
      >{{ t('prev') || 'Back' }}</button>

      <button
        v-if="currentStep < steps.length - 1"
        class="btn btn-primary"
        @click="currentStep++"
      >{{ t('next') || 'Next' }}</button>

      <button
        v-if="steps[currentStep]?.key === 'confirm'"
        class="btn btn-primary"
        :disabled="applying"
        @click="applySettings"
      >{{ applying ? (t('applying') || 'Applying…') : (t('finish') || 'Apply') }}</button>
    </div>

    <!-- Reboot countdown overlay -->
    <Teleport to="body">
      <div v-if="countdown > 0" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
        <div class="bg-white border border-[#9eb9c2] rounded px-14 py-10 flex flex-col items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <p class="text-[16px] font-medium">{{ t('reboot_tip') || 'Applying settings…' }}</p>
          <p class="text-[52px] font-bold text-[#ed6c00] leading-none">{{ countdown }}s</p>
          <p class="text-[12px] text-[#888]">{{ t('wizard') || 'Please wait, redirecting…' }}</p>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { uciGet, uciSet, apiAction } = useApi()

const mode = computed(() => (route.params.mode as string) || 'router')

const allSteps = [
  { key: 'wan',     label: 'wan' },
  { key: 'lan',     label: 'lan' },
  { key: 'wifi',    label: 'wireless' },
  { key: 'confirm', label: 'confirm' },
]

const steps = computed(() =>
  mode.value === 'router' ? allSteps : allSteps.filter(s => s.key !== 'wan')
)

const currentStep = ref(0)
const applying = ref(false)
const countdown = ref(0)

const netmaskOptions = [
  '255.255.255.0',
  '255.255.254.0',
  '255.255.252.0',
  '255.255.248.0',
  '255.255.240.0',
  '255.255.0.0',
  '255.254.0.0',
  '255.252.0.0',
  '255.248.0.0',
  '255.240.0.0',
  '255.0.0.0',
]

const wanProtos = [
  { value: 'qmi',    label: '4G/LTE' },
  { value: 'pppoe',  label: 'PPPoE' },
  { value: 'static', label: 'Static' },
  { value: 'dhcp',   label: 'DHCP' },
]

const form = reactive({
  wan: {
    proto: 'qmi',
    apnMode: 'auto',
    apn: '',
    apnAuth: '0',
    apnUser: '',
    apnPassword: '',
    username: '',
    password: '',
    mtu: '1492',
    ipaddr: '',
    netmask: '255.255.255.0',
    gateway: '',
    dns: '',
  },
  lan: {
    ipaddr: '192.168.0.1',
    netmask: '255.255.255.0',
  },
  wifi24: {
    ssid: '',
    key: '',
    encryption: 'psk2',
    hidden: false,
  },
  wifi5g: {
    ssid: '',
    key: '',
    encryption: 'psk2',
    hidden: false,
  },
})

const wanProtoLabel = computed(() =>
  wanProtos.find(p => p.value === form.wan.proto)?.label ?? form.wan.proto
)

onMounted(async () => {
  try {
    const data = await uciGet([
      'network.wan', 'network.lan',
      'wireless.@wifi-iface[0].ssid',
      'wireless.@wifi-iface[0].key', 'wireless.@wifi-iface[0].encryption', 'wireless.@wifi-iface[0].hidden',
      'wireless.@wifi-iface[8].ssid',
      'wireless.@wifi-iface[8].key', 'wireless.@wifi-iface[8].encryption', 'wireless.@wifi-iface[8].hidden',
    ])

    form.wan.proto       = data['network.wan.proto']    || 'qmi'
    form.wan.apn         = data['network.wan.apn']      || ''
    form.wan.apnAuth     = data['network.wan.apn_auth'] || '0'
    form.wan.apnUser     = data['network.wan.apn_user'] || ''
    form.wan.apnPassword = data['network.wan.apn_psd']  || ''
    form.wan.apnMode     = form.wan.apn ? 'manual' : 'auto'
    form.wan.username    = data['network.wan.username'] || ''
    form.wan.password = data['network.wan.password'] || ''
    form.wan.mtu      = data['network.wan.mtu']      || '1492'
    form.wan.ipaddr   = data['network.wan.ipaddr']   || ''
    form.wan.netmask  = data['network.wan.netmask']  || '255.255.255.0'
    form.wan.gateway  = data['network.wan.gateway']  || ''
    form.wan.dns      = data['network.wan.dns']      || ''

    form.lan.ipaddr  = data['network.lan.ipaddr']  || '192.168.0.1'
    form.lan.netmask = data['network.lan.netmask'] || '255.255.255.0'

    form.wifi24.ssid       = data['wireless.@wifi-iface[0].ssid']        || ''
    form.wifi24.key        = data['wireless.@wifi-iface[0].key']        || ''
    form.wifi24.encryption = data['wireless.@wifi-iface[0].encryption'] || 'psk2'
    form.wifi24.hidden     = data['wireless.@wifi-iface[0].hidden']     === '1'

    form.wifi5g.ssid       = data['wireless.@wifi-iface[8].ssid']        || ''
    form.wifi5g.key        = data['wireless.@wifi-iface[8].key']        || ''
    form.wifi5g.encryption = data['wireless.@wifi-iface[8].encryption'] || 'psk2'
    form.wifi5g.hidden     = data['wireless.@wifi-iface[8].hidden']     === '1'
  } catch { /* ignore */ }
})

function applySettings() {
  if (applying.value) return
  applying.value = true

  const obj: Record<string, string> = {}

  if (mode.value === 'router') {
    obj['network.wan.proto'] = form.wan.proto
    if (form.wan.proto === 'qmi') {
      if (form.wan.apnMode === 'manual') {
        obj['network.wan.apn']      = form.wan.apn
        obj['network.wan.apn_auth'] = form.wan.apnAuth
        obj['network.wan.apn_user'] = form.wan.apnUser
        obj['network.wan.apn_psd']  = form.wan.apnPassword
      }
    } else if (form.wan.proto === 'pppoe') {
      obj['network.wan.username'] = form.wan.username
      obj['network.wan.password'] = form.wan.password
      obj['network.wan.mtu']      = form.wan.mtu
    } else if (form.wan.proto === 'static') {
      obj['network.wan.ipaddr']   = form.wan.ipaddr
      obj['network.wan.netmask']  = form.wan.netmask
      obj['network.wan.gateway']  = form.wan.gateway
      obj['network.wan.dns']      = form.wan.dns
    }
  }

  obj['network.lan.ipaddr']  = form.lan.ipaddr
  obj['network.lan.netmask'] = form.lan.netmask

  obj['wireless.@wifi-iface[0].ssid']        = form.wifi24.ssid
  obj['wireless.@wifi-iface[0].encryption'] = form.wifi24.encryption
  obj['wireless.@wifi-iface[0].key']        = form.wifi24.key
  obj['wireless.@wifi-iface[0].hidden']     = form.wifi24.hidden ? '1' : '0'

  obj['wireless.@wifi-iface[8].ssid']        = form.wifi5g.ssid
  obj['wireless.@wifi-iface[8].encryption'] = form.wifi5g.encryption
  obj['wireless.@wifi-iface[8].key']        = form.wifi5g.key
  obj['wireless.@wifi-iface[8].hidden']     = form.wifi5g.hidden ? '1' : '0'

  obj['network.workmode'] = mode.value

  // Write UCI, then trigger apply — all fire-and-forget.
  // Network service reload drops the connection, so we must not await.

  uciSet(obj)
    .then(() => {
      apiAction('apply', { service: 'network' }).catch(() => {})
      apiAction('apply', { service: 'wireless' }).catch(() => {})
    })
    .catch(() => {})

  // Start countdown immediately regardless of API responses
  countdown.value = 30
  const timer = setInterval(() => {
    if (--countdown.value <= 0) {
      clearInterval(timer)
      router.push('/dashboard')
    }
  }, 1000)
}
</script>
