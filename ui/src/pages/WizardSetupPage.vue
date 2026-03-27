<template>
  <div class="page-form">

    <!-- Step progress bar -->
    <div class="box">
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
    <WanSettings v-show="steps[currentStep]?.key === 'wan'" ref="wanRef" />

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

    <!-- Step: WiFi -->
    <WifiSettings v-if="steps[currentStep]?.key === 'wifi'" ref="wifiRef" />

    <!-- Step: Confirm -->
    <div v-if="steps[currentStep]?.key === 'confirm'" class="box">
      <div class="section-title">{{ t('confirm') || 'Confirm' }}</div>

      <!-- WAN summary (router only) -->
      <template v-if="mode === 'router'">
        <div class="section-title" style="font-size:13px;margin-top:8px">{{ t('wan') || 'WAN' }}</div>
        <div class="form-row">
          <label class="form-row__label">{{ t('wan_type') || 'Тип' }}</label>
          <div class="form-row__value">{{ wanProtoLabel }}</div>
        </div>
        <template v-if="wanRef?.form?.proto === 'pppoe'">
          <div class="form-row">
            <label class="form-row__label">{{ t('pppoe_name') || 'Username' }}</label>
            <div class="form-row__value">{{ wanRef?.form?.username || '—' }}</div>
          </div>
          <div class="form-row">
            <label class="form-row__label">MTU</label>
            <div class="form-row__value">{{ wanRef?.form?.mtu }}</div>
          </div>
        </template>
        <template v-if="wanRef?.form?.proto === 'static'">
          <div class="form-row">
            <label class="form-row__label">{{ t('ip_addr') || 'IP' }}</label>
            <div class="form-row__value">{{ wanRef?.form?.ipaddr || '—' }}</div>
          </div>
          <div class="form-row">
            <label class="form-row__label">{{ t('subnet_mask') || 'Netmask' }}</label>
            <div class="form-row__value">{{ wanRef?.form?.netmask }}</div>
          </div>
          <div class="form-row">
            <label class="form-row__label">{{ t('gateway') || 'Gateway' }}</label>
            <div class="form-row__value">{{ wanRef?.form?.gateway || '—' }}</div>
          </div>
          <div class="form-row">
            <label class="form-row__label">DNS</label>
            <div class="form-row__value">{{ wanRef?.form?.dns || '—' }}</div>
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
        <label class="form-row__label">{{ t('wireless') || 'WiFi' }}</label>
        <div class="form-row__value text-sm text-[#888]">{{ t('applying') || 'настроено' }}</div>
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
import WifiSettings from '@/components/WifiSettings.vue'
import WanSettings from '@/components/WanSettings.vue'

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
const wifiRef = ref<InstanceType<typeof WifiSettings>>()
const wanRef  = ref<InstanceType<typeof WanSettings>>()

const netmaskOptions = [
  '255.255.255.0', '255.255.254.0', '255.255.252.0',
  '255.255.248.0', '255.255.240.0', '255.255.0.0',
  '255.254.0.0',   '255.252.0.0',   '255.248.0.0',
  '255.240.0.0',   '255.0.0.0',
]

const wanProtos = [
  { value: 'qmi',    label: '4G/LTE' },
  { value: 'pppoe',  label: 'PPPoE' },
  { value: 'static', label: t('staAddress') || 'Статический' },
  { value: 'dhcp',   label: 'DHCP' },
]

const form = reactive({
  lan: { ipaddr: '192.168.0.1', netmask: '255.255.255.0' },
})

const wanProtoLabel = computed(() => {
  const proto = wanRef.value?.form?.proto ?? ''
  return wanProtos.find(p => p.value === proto)?.label ?? proto
})

onMounted(async () => {
  try {
    const data = await uciGet(['network.lan.ipaddr', 'network.lan.netmask'])
    form.lan.ipaddr  = data['network.lan.ipaddr']  || '192.168.0.1'
    form.lan.netmask = data['network.lan.netmask'] || '255.255.255.0'
    // WAN and WiFi are loaded by their own components
  } catch { /* ignore */ }
})

function applySettings() {
  if (applying.value) return
  applying.value = true

  const obj: Record<string, string> = {}

  if (mode.value === 'router' && wanRef.value) {
    Object.assign(obj, wanRef.value.getUci())
  }

  obj['network.lan.ipaddr']  = form.lan.ipaddr
  obj['network.lan.netmask'] = form.lan.netmask

  // Merge wifi UCI from WifiSettings component
  if (wifiRef.value) Object.assign(obj, wifiRef.value.getUci())

  obj['network.workmode'] = mode.value

  // Write UCI, then trigger apply — all fire-and-forget.
  // Network service reload drops the connection, so we must not await.

  uciSet(obj)
    .then(() => {
      apiAction('apply', { service: 'network' }).catch(() => {})
      apiAction('reload_config', { package: 'wireless' }).catch(() => {})
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


