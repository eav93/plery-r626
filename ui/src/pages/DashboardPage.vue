<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

    <!-- Текущее состояние -->
    <div class="box">
      <div class="section-title">{{ t('current_state') }}</div>
      <div class="flex flex-col items-center py-2 gap-2">
        <img :src="modeImg" class="h-40 object-contain"/>
        <p class="text-sm text-[#16191c]">{{ modeName }}</p>
      </div>
    </div>
    <!-- Состояние интерфейсов -->
    <div class="box flex flex-col">
      <div class="section-title">{{ t('intertface') }}</div>
      <ul class="flex flex-wrap justify-center items-center gap-4 flex-1 py-2">
        <template v-if="portList.length">
          <li v-for="(p, i) in portList" :key="i"
              :class="['flex flex-col items-center gap-1',
                p.up ? (p.wan_enable ? 'text-[#0068ff]' : 'text-[#ff6f08]') : 'text-[#adadad]']">
            <AppIcon name="wangkou" :size="32"/>
            <span class="text-[11px] text-[#16191c]">{{
                p.wan_enable ? 'WAN' : ('LAN' + (lanIdx(i) > 1 ? lanIdx(i) : ''))
              }}</span>
          </li>
        </template>
      </ul>
    </div>

    <!-- 4 статистики -->
    <div class="col-span-1 sm:col-span-2 grid grid-cols-2 gap-4">
      <div class="box">
        <div class="section-title">{{ t('totalup') }}</div>
        <div class="flex items-center">
          <span
              class="flex items-center justify-center w-[60px] h-[60px] rounded-full text-white shrink-0 bg-[#9b59b6]"><AppIcon
              name="faarrowup" :size="30"/></span>
          <span class="flex-1 text-center text-xl font-bold text-[#9b59b6] leading-[60px]">{{ txStr }}</span>
        </div>
      </div>
      <div class="box">
        <div class="section-title">{{ t('totaldown') }}</div>
        <div class="flex items-center">
          <span
              class="flex items-center justify-center w-[60px] h-[60px] rounded-full text-white shrink-0 bg-[#2ecc71]"><AppIcon
              name="faarrowdown" :size="30"/></span>
          <span class="flex-1 text-center text-xl font-bold text-[#2ecc71] leading-[60px]">{{ rxStr }}</span>
        </div>
      </div>
      <div class="box">
        <div class="section-title">{{ t('totallink') }}</div>
        <div class="flex items-center">
          <span
              class="flex items-center justify-center w-[60px] h-[60px] rounded-full text-white shrink-0 bg-[#f1c40f]"><AppIcon
              name="linknum" :size="30"/></span>
          <span class="flex-1 text-center text-xl font-bold text-[#f1c40f] leading-[60px]">{{ conntrack }}</span>
        </div>
      </div>
      <div class="box">
        <div class="section-title">{{ t('usernum') }}</div>
        <div class="flex items-center">
          <span
              class="flex items-center justify-center w-[60px] h-[60px] rounded-full text-white shrink-0 bg-[#e74c3c]"><AppIcon
              name="yonghuzu" :size="30"/></span>
          <span class="flex-1 text-center text-xl font-bold text-[#e74c3c] leading-[60px]">{{ userCount }}</span>
        </div>
      </div>
    </div>

    <!-- Информация об устройстве -->
    <div class="box col-span-1 sm:col-span-2">
      <div class="section-title">{{ t('deviceinfo') }}</div>
      <ul>
        <li class="info-row"><label class="info-label">MAC</label><span class="font-mono">{{
            version?.macaddr ?? '—'
          }}</span></li>
        <li v-if="version?.model" class="info-row"><label class="info-label">{{
            t('unit_type')
          }}</label><span>{{ version.model }}</span></li>
        <li class="info-row"><label class="info-label">{{ t('version') }}</label><span>{{
            version?.version ?? '—'
          }}</span></li>
        <li class="info-row"><label class="info-label">{{ t('hostname') }}</label><span>{{
            version?.hostname ?? '—'
          }}</span></li>
      </ul>
    </div>

    <!-- Загрузка CPU -->
    <div class="box">
      <div class="section-title">{{ t('cpu_usage') }}</div>
      <div class="gauge-wrap">
        <svg viewBox="0 0 36 36" class="gauge-svg">
          <path class="gauge-bg" d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32"/>
          <path class="gauge-arc" :stroke-dasharray="`${cpuPct} 100`" d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32"/>
        </svg>
        <span class="gauge-num">{{ cpuPct }}<small>%</small></span>
      </div>
    </div>

    <!-- Память -->
    <div class="box">
      <div class="section-title">{{ t('memory_usage') }}</div>
      <div class="gauge-wrap">
        <svg viewBox="0 0 36 36" class="gauge-svg">
          <path class="gauge-bg" d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32"/>
          <path class="gauge-arc gauge-arc--mem" :stroke-dasharray="`${memPct} 100`"
                d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32"/>
        </svg>
        <span class="gauge-num">{{ memPct }}<small>%</small></span>
      </div>
      <p class="text-center text-xs text-[#888] mt-1">{{ memTotalMB }} MB</p>
    </div>


    <!-- Информация о WAN -->
    <div class="box col-span-1 sm:col-span-2">
      <div class="section-title">{{ t('waninfo') }}</div>
      <ul>
        <li class="info-row"><label class="info-label">{{ t('access') }}</label><span>{{ wanProtoName }}</span></li>
        <li class="info-row"><label class="info-label">{{ t('ip_addr') }}</label><span>{{ wanIp || '—' }}</span></li>
        <li class="info-row"><label class="info-label">LAN IP</label><span>{{ lanIp || '—' }}</span></li>
        <li class="info-row"><label class="info-label">{{ t('uptime') }}</label><span>{{ uptimeStr }}</span></li>
      </ul>
    </div>

    <!-- WiFi -->
    <div class="box col-span-1 sm:col-span-2">
      <div class="section-title">{{ t('wifiinfo') }}</div>
      <ul>
        <li v-if="wifiSsid" class="info-row"><label class="info-label">{{ t('ssid_name_24g') }}</label><span>{{
            wifiSsid
          }}</span></li>
        <li v-if="wifi5gSsid" class="info-row"><label class="info-label">{{
            t('ssid_name_58g')
          }}</label><span>{{ wifi5gSsid }}</span></li>
        <li v-if="!wifiSsid && !wifi5gSsid" class="info-row"><label class="info-label">SSID</label><span>—</span></li>
      </ul>
    </div>

    <!-- Мониторинг трафика -->
    <div class="box col-span-1 sm:col-span-2 lg:col-span-4">
      <div class="section-title">{{ t('traffic_bytes') }}</div>
      <div class="flex gap-5 text-xs mb-1.5 px-1">
        <span class="text-[#9b59b6]">▲ {{ t('totalup') }}: {{ txSpeedStr }}</span>
        <span class="text-[#2ecc71]">▼ {{ t('totaldown') }}: {{ rxSpeedStr }}</span>
      </div>
      <svg class="traffic-chart" viewBox="0 0 600 120" preserveAspectRatio="none">
        <line x1="0" y1="30" x2="600" y2="30" class="chart-grid"/>
        <line x1="0" y1="60" x2="600" y2="60" class="chart-grid"/>
        <line x1="0" y1="90" x2="600" y2="90" class="chart-grid"/>
        <polyline v-if="txPoints" :points="txPoints" class="chart-line chart-line--tx"/>
        <polyline v-if="rxPoints" :points="rxPoints" class="chart-line chart-line--rx"/>
      </svg>
      <div class="text-right text-xs text-[#888] mt-0.5">{{ chartYMaxStr }}</div>
    </div>

  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useSystemStore} from '@/stores/system'
import {useApi} from '@/composables/useApi'
import AppIcon from '@/components/AppIcon.vue'

import imgRouter from '@/assets/m_router.png'
import imgAp from '@/assets/m_ap.png'
import imgRepeater from '@/assets/m_repeater.png'
import imgBridge from '@/assets/m_bridge.png'
import imgMesh from '@/assets/m_mesh.png'

const {t} = useI18n()
const store = useSystemStore()
const {uciGet, get} = useApi()

const version = computed(() => store.version)
const stats = computed(() => store.stats)
const cpuPct = computed(() => stats.value?.cpu_pct ?? 0)
const memPct = computed(() => stats.value?.mem_pct ?? 0)
const memTotalMB = computed(() => stats.value ? Math.round(stats.value.mem_total / 1024) : 0)
const conntrack = computed(() => stats.value?.conntrack ?? 0)
const userCount = computed(() => stats.value?.user_count ?? 0)

const uptimeStr = computed(() => {
  const s = stats.value?.uptime ?? 0
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return d
      ? `${d}${t('uptime_d')} ${h}${t('uptime_h')} ${m}${t('uptime_m')}`
      : `${h}${t('uptime_h')} ${m}${t('uptime_m')}`
})

function fmtBytes(b: number) {
  if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB'
  if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB'
  if (b >= 1e3) return (b / 1e3).toFixed(1) + ' KB'
  return Math.round(b) + ' B'
}

const rxStr = computed(() => fmtBytes(stats.value?.rx_bytes ?? 0))
const txStr = computed(() => fmtBytes(stats.value?.tx_bytes ?? 0))

// ── Traffic chart ─────────────────────────────────────────────────────────
const CHART_POINTS = 60
const CHART_H = 120
const CHART_W = 600
const POLL_MS = 2000

interface SpeedPoint {
  t: number;
  tx: number;
  rx: number
}

const speedHistory = ref<SpeedPoint[]>([])
let prevBytes: { tx: number; rx: number; t: number } | null = null

function recordSpeed() {
  const s = stats.value
  if (!s) return
  const now = Date.now()
  if (prevBytes) {
    const dt = (now - prevBytes.t) / 1000
    const txSpeed = Math.max(0, (s.tx_bytes - prevBytes.tx) / dt)
    const rxSpeed = Math.max(0, (s.rx_bytes - prevBytes.rx) / dt)
    speedHistory.value.push({t: now, tx: txSpeed, rx: rxSpeed})
    if (speedHistory.value.length > CHART_POINTS) speedHistory.value.shift()
  }
  prevBytes = {tx: s.tx_bytes, rx: s.rx_bytes, t: now}
}

const chartYMax = computed(() => {
  const vals = speedHistory.value.flatMap(p => [p.tx, p.rx])
  return Math.max(1024, ...vals)
})

function toPoints(values: number[]): string {
  if (!values.length) return ''
  const step = CHART_W / (CHART_POINTS - 1)
  const xOffset = (CHART_POINTS - values.length) * step
  return values.map((v, i) => {
    const x = xOffset + i * step
    const y = CHART_H - (v / chartYMax.value) * (CHART_H - 4)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

const txPoints = computed(() => toPoints(speedHistory.value.map(p => p.tx)))
const rxPoints = computed(() => toPoints(speedHistory.value.map(p => p.rx)))

const lastSpeed = computed(() => speedHistory.value[speedHistory.value.length - 1])
const txSpeedStr = computed(() => lastSpeed.value ? fmtBytes(lastSpeed.value.tx) + '/s' : '—')
const rxSpeedStr = computed(() => lastSpeed.value ? fmtBytes(lastSpeed.value.rx) + '/s' : '—')
const chartYMaxStr = computed(() => fmtBytes(chartYMax.value) + '/s')

// UCI data
const workmode = ref('router')
const wanProto = ref('dhcp')
const wanIp = ref('')
const lanIp = ref('')
const wifiSsid = ref('')
const wifi5gSsid = ref('')

const modeImgMap: Record<string, string> = {
  router: imgRouter, ap: imgAp, wisp: imgRepeater,
  wisp_c: imgRepeater, wds: imgBridge, wds_c: imgBridge, mesh: imgMesh,
}
const modeImg = computed(() => modeImgMap[workmode.value] ?? imgRouter)

const modeNameMap: Record<string, string> = {
  router: 'router', ap: 'ap', wisp: 'repeater',
  wisp_c: 'repeater_c', wds: 'bridge', wds_c: 'bridge_c', mesh: 'mesh',
}
const modeName = computed(() => t(modeNameMap[workmode.value] ?? 'router') || workmode.value)

const protoNames: Record<string, string> = {
  dhcp: 'DHCP', pppoe: 'PPPoE', static: 'Static', qmi: '4G/LTE', ppp_quectel: '4G/LTE',
}
const wanProtoName = computed(() => protoNames[wanProto.value] ?? wanProto.value)

async function loadUci() {
  try {
    const d = await uciGet([
      'network.workmode',
      'network.wan.proto', 'network.wan.ipaddr',
      'network.lan.ipaddr',
      'wireless.@wifi-iface[0].ssid',
      'wireless.@wifi-iface[8].ssid',
    ])
    workmode.value = d['network.workmode'] || 'router'
    wanProto.value = d['network.wan.proto'] || 'dhcp'
    wanIp.value = d['network.wan.ipaddr'] || ''
    lanIp.value = d['network.lan.ipaddr'] || ''
    wifiSsid.value = d['wireless.@wifi-iface[0].ssid'] || ''
    wifi5gSsid.value = d['wireless.@wifi-iface[8].ssid'] || ''
  } catch { /* ignore */ }
}

interface PortEntry {
  up: number;
  wan_enable: number
}

const portList = ref<PortEntry[]>([])

async function loadPorts() {
  try {
    const d = await get<{ errCode: number; port_list: PortEntry[] }>('/api/system/ports')
    if (d.errCode === 0) portList.value = d.port_list
  } catch { /* ignore */
  }
}

function lanIdx(portIndex: number) {
  let cnt = 0
  for (let i = 0; i <= portIndex; i++) {
    if (!portList.value[i]?.wan_enable) cnt++
  }
  return cnt
}

let statsTimer: ReturnType<typeof setInterval>
let chartTimer: ReturnType<typeof setInterval>
let portsTimer: ReturnType<typeof setInterval>
onMounted(async () => {
  await Promise.all([store.fetchVersion(), store.fetchStats(), loadUci(), loadPorts()])
  recordSpeed()
  statsTimer = setInterval(store.fetchStats, 5000)
  chartTimer = setInterval(async () => {
    await store.fetchStats();
    recordSpeed()
  }, POLL_MS)
  portsTimer = setInterval(loadPorts, 10000)
})
onUnmounted(() => {
  clearInterval(statsTimer);
  clearInterval(chartTimer);
  clearInterval(portsTimer)
})
</script>

<style scoped>
/* ── Info rows ───────────────────────────────────────────────────────────── */
.info-row {
  display: flex;
  align-items: center;
  min-height: 32px;
  border-top: 1px solid #f0f0f0;
  font-size: 13px;
}

.info-row:first-child {
  border-top: none;
}

.info-label {
  width: 40%;
  flex-shrink: 0;
  text-align: right;
  padding-right: 16px;
}

/* ── Gauge ───────────────────────────────────────────────────────────────── */
.gauge-wrap {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 4px auto 0;
}

.gauge-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.gauge-bg {
  fill: none;
  stroke: #e0e0e0;
  stroke-width: 3;
}

.gauge-arc {
  fill: none;
  stroke: #ed6c00;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray .4s ease;
}

.gauge-arc--mem {
  stroke: #9b59b6;
}

.gauge-num {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
}

.gauge-num small {
  font-size: 12px;
  font-weight: 400;
  margin-top: 4px;
}

/* ── Traffic chart ───────────────────────────────────────────────────────── */
.traffic-chart {
  width: 100%;
  height: 120px;
  display: block;
  background: #f8f8f8;
  border: 1px solid #e8e8e8;
  border-radius: 2px;
}

.chart-grid {
  stroke: #e0e0e0;
  stroke-width: 0.5;
  vector-effect: non-scaling-stroke;
}

.chart-line {
  fill: none;
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.chart-line--tx {
  stroke: #9b59b6;
}

.chart-line--rx {
  stroke: #2ecc71;
}

@media (max-width: 767px) {
  .gauge-wrap {
    width: 80px;
    height: 80px;
  }

  .gauge-num {
    font-size: 18px;
  }
}
</style>
