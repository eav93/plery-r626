<template>
  <div class="dash">

    <!-- Row 1: mode + 4 stats -->
    <div class="dash-row">

      <!-- Mode picture -->
      <div class="shbox col-half">
        <div class="section-title">{{ t('current_state') }}</div>
        <div class="mode-box">
          <img :src="modeImg" class="mode-pic" />
          <p class="mode-text">{{ modeName }}</p>
        </div>
      </div>

      <!-- 4 stat boxes -->
      <div class="col-half">
        <div class="stats-grid">
          <div class="shbox stat-box">
            <div class="section-title">{{ t('totalup') }}</div>
            <div class="stat-inner">
              <span class="stat-icon bg-up"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M4 14l8-8 8 8H4z"/></svg></span>
              <span class="stat-num f-up">{{ txStr }}</span>
            </div>
          </div>
          <div class="shbox stat-box">
            <div class="section-title">{{ t('totaldown') }}</div>
            <div class="stat-inner">
              <span class="stat-icon bg-down"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M4 10l8 8 8-8H4z"/></svg></span>
              <span class="stat-num f-down">{{ rxStr }}</span>
            </div>
          </div>
          <div class="shbox stat-box">
            <div class="section-title">{{ t('uptime') }}</div>
            <div class="stat-inner">
              <span class="stat-icon bg-link"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 14.93V17h-2v-.07A8 8 0 0 1 4 9h2a6 6 0 0 0 6 5.93zM12 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-4h-2V7h2v2z"/></svg></span>
              <span class="stat-num f-link">{{ uptimeStr }}</span>
            </div>
          </div>
          <div class="shbox stat-box">
            <div class="section-title">{{ t('totallink') }}</div>
            <div class="stat-inner">
              <span class="stat-icon bg-conn"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg></span>
              <span class="stat-num f-conn">{{ conntrack }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 2: WAN/LAN info + CPU gauge + Mem gauge -->
    <div class="dash-row">

      <div class="shbox col-half">
        <div class="section-title">{{ t('waninfo') }}</div>
        <ul class="info-list">
          <li class="list-row">
            <label>{{ t('access') }}</label>
            <span>{{ wanProtoName }}</span>
          </li>
          <li class="list-row">
            <label>{{ t('ip_addr') }}</label>
            <span>{{ wanIp || '—' }}</span>
          </li>
          <li class="list-row">
            <label>LAN IP</label>
            <span>{{ lanIp || '—' }}</span>
          </li>
        </ul>
      </div>

      <div class="shbox col-quarter">
        <div class="section-title">{{ t('cpu_usage') }}</div>
        <div class="gauge-wrap">
          <svg viewBox="0 0 36 36" class="gauge-svg">
            <path class="gauge-bg"  d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32" />
            <path class="gauge-arc" :stroke-dasharray="`${cpuPct} 100`"
                  d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32" />
          </svg>
          <span class="gauge-num">{{ cpuPct }}<small>%</small></span>
        </div>
      </div>

      <div class="shbox col-quarter">
        <div class="section-title">{{ t('memory_usage') }}</div>
        <div class="gauge-wrap">
          <svg viewBox="0 0 36 36" class="gauge-svg">
            <path class="gauge-bg"  d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32" />
            <path class="gauge-arc gauge-arc--mem" :stroke-dasharray="`${memPct} 100`"
                  d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32" />
          </svg>
          <span class="gauge-num">{{ memPct }}<small>%</small></span>
        </div>
        <p class="gauge-sub">{{ memTotalMB }} MB</p>
      </div>

    </div>

    <!-- Row 3: port status (compact) -->
    <div v-if="portList.length" class="dash-row">
      <div class="shbox col-full">
        <div class="section-title">{{ t('intertface') }}</div>
        <ul class="iface-list">
          <li v-for="(p, i) in portList" :key="i"
              :class="['iface-item', p.up ? (p.wan_enable ? 'iface-link-wan' : 'iface-link-lan') : 'iface-unlink']">
            <i class="iconfont port-icon"></i>
            <p class="iface-label">{{ p.wan_enable ? 'WAN' : ('LAN' + (lanIdx(i) > 1 ? lanIdx(i) : '')) }}</p>
          </li>
        </ul>
      </div>
    </div>

    <!-- Row 4: device info + WiFi info -->
    <div class="dash-row">
      <div class="shbox col-half">
        <div class="section-title">{{ t('deviceinfo') }}</div>
        <ul class="info-list">
          <li class="list-row">
            <label>MAC</label>
            <span class="mono">{{ version?.macaddr ?? '—' }}</span>
          </li>
          <li v-if="version?.model" class="list-row">
            <label>{{ t('unit_type') }}</label>
            <span>{{ version.model }}</span>
          </li>
          <li class="list-row">
            <label>{{ t('version') }}</label>
            <span>{{ version?.version ?? '—' }}</span>
          </li>
          <li class="list-row">
            <label>{{ t('hostname') }}</label>
            <span>{{ version?.hostname ?? '—' }}</span>
          </li>
        </ul>
      </div>

      <div class="shbox col-half">
        <div class="section-title">{{ t('wifiinfo') }}</div>
        <ul class="info-list">
          <li v-if="wifiSsid" class="list-row">
            <label>{{ t('ssid_name_24g') }}</label>
            <span>{{ wifiSsid }}</span>
          </li>
          <li v-if="wifi5gSsid" class="list-row">
            <label>{{ t('ssid_name_58g') }}</label>
            <span>{{ wifi5gSsid }}</span>
          </li>
          <li v-if="!wifiSsid && !wifi5gSsid" class="list-row">
            <label>SSID</label>
            <span>—</span>
          </li>
        </ul>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSystemStore } from '@/stores/system'
import { useApi } from '@/composables/useApi'

import imgRouter   from '@/assets/m_router.png'
import imgAp       from '@/assets/m_ap.png'
import imgRepeater from '@/assets/m_repeater.png'
import imgBridge   from '@/assets/m_bridge.png'
import imgMesh     from '@/assets/m_mesh.png'

const { t } = useI18n()
const store = useSystemStore()
const { uciGet, get } = useApi()

const version    = computed(() => store.version)
const stats      = computed(() => store.stats)
const cpuPct     = computed(() => stats.value?.cpu_pct ?? 0)
const memPct     = computed(() => stats.value?.mem_pct ?? 0)
const memTotalMB = computed(() => stats.value ? Math.round(stats.value.mem_total / 1024) : 0)
const conntrack  = computed(() => stats.value?.conntrack ?? 0)

const uptimeStr = computed(() => {
  const s = stats.value?.uptime ?? 0
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return d ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`
})

function fmtBytes(b: number) {
  if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB'
  if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB'
  if (b >= 1e3) return (b / 1e3).toFixed(0) + ' KB'
  return b + ' B'
}
const rxStr = computed(() => fmtBytes(stats.value?.rx_bytes ?? 0))
const txStr = computed(() => fmtBytes(stats.value?.tx_bytes ?? 0))

// UCI data
const workmode  = ref('router')
const wanProto  = ref('dhcp')
const wanIp     = ref('')
const lanIp     = ref('')
const wifiSsid  = ref('')
const wifi5gSsid = ref('')

const modeImgMap: Record<string, string> = {
  router: imgRouter, ap: imgAp, wisp: imgRepeater,
  wisp_c: imgRepeater, wds: imgBridge, wds_c: imgBridge, mesh: imgMesh,
}
const modeImg  = computed(() => modeImgMap[workmode.value] ?? imgRouter)

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
      'mbox.workmode.workmode',
      'network.wan.proto', 'network.wan.ipaddr',
      'network.lan.ipaddr',
      'wireless.mbox.ssid',
      'wireless.mbox5g.ssid',
    ])
    workmode.value  = d['mbox.workmode.workmode']  || 'router'
    wanProto.value  = d['network.wan.proto']       || 'dhcp'
    wanIp.value     = d['network.wan.ipaddr']      || ''
    lanIp.value     = d['network.lan.ipaddr']      || ''
    wifiSsid.value  = d['wireless.mbox.ssid']      || ''
    wifi5gSsid.value = d['wireless.mbox5g.ssid']   || ''
  } catch { /* ignore */ }
}

interface PortEntry { up: number; wan_enable: number }
const portList = ref<PortEntry[]>([])

async function loadPorts() {
  try {
    const d = await get<{ errCode: number; port_list: PortEntry[] }>('/api/system/ports')
    if (d.errCode === 0) portList.value = d.port_list
  } catch { /* ignore */ }
}

function lanIdx(portIndex: number) {
  let cnt = 0
  for (let i = 0; i <= portIndex; i++) {
    if (!portList.value[i]?.wan_enable) cnt++
  }
  return cnt
}

let timer: ReturnType<typeof setInterval>
let portsTimer: ReturnType<typeof setInterval>
onMounted(async () => {
  await Promise.all([store.fetchVersion(), store.fetchStats(), loadUci(), loadPorts()])
  timer = setInterval(store.fetchStats, 5000)
  portsTimer = setInterval(loadPorts, 10000)
})
onUnmounted(() => { clearInterval(timer); clearInterval(portsTimer) })
</script>

<style scoped>
.dash { padding: 8px 16px 32px; }

/* ── Grid rows ───────────────────────────────────────────────────────────── */
.dash-row {
  display: flex;
  gap: 0;
  margin-bottom: 0;
}

.shbox {
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  margin: 12px 12px 0 0;
  padding: 20px 12px 12px;
  box-sizing: border-box;
}
.shbox:last-child { margin-right: 0; }

.col-half    { flex: 0 0 50%; max-width: 50%; }
.col-quarter { flex: 0 0 25%; max-width: 25%; }
.col-full    { flex: 0 0 100%; max-width: 100%; }

/* ── Mode box ────────────────────────────────────────────────────────────── */
.mode-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 4px;
  gap: 8px;
}
.mode-pic  { height: 130px; width: auto; object-fit: contain; }
.mode-text { font-size: 14px; color: var(--color-text-muted); }

/* ── Stats grid (2×2) ────────────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}
.stats-grid .shbox {
  margin: 12px 0 0 12px;
}

.stat-box { display: flex; flex-direction: column; gap: 6px; }
.stat-inner { display: flex; align-items: center; gap: 10px; padding: 4px 0; }

.stat-icon {
  display: flex; align-items: center; justify-content: center;
  width: 44px; height: 44px;
  border-radius: 50%;
  color: #fff;
  flex-shrink: 0;
}
.bg-up   { background: #9b59b6; }
.bg-down { background: #2ecc71; }
.bg-link { background: #f1c40f; }
.bg-conn { background: #e74c3c; }

.stat-num { font-size: 18px; font-weight: 600; line-height: 1.2; }
.f-up   { color: #9b59b6; }
.f-down { color: #2ecc71; }
.f-link { color: #f1c40f; }
.f-conn { color: #e74c3c; }

/* ── Info list ───────────────────────────────────────────────────────────── */
.info-list { margin: 4px 0; }
.list-row {
  display: flex;
  align-items: center;
  min-height: 32px;
  border-top: 1px solid #f0f0f0;
}
.list-row:first-child { border-top: none; }
.list-row label {
  width: 40%;
  text-align: right;
  padding-right: 16px;
  flex-shrink: 0;
  color: var(--color-text);
  font-size: 13px;
}
.list-row span { font-size: 13px; }
.mono { font-family: monospace; }

/* ── Gauge ───────────────────────────────────────────────────────────────── */
.gauge-wrap {
  position: relative;
  width: 100px; height: 100px;
  margin: 4px auto 0;
}
.gauge-svg  { width: 100%; height: 100%; transform: rotate(-90deg); }
.gauge-bg   { fill: none; stroke: #e0e0e0; stroke-width: 3; }
.gauge-arc  {
  fill: none; stroke: #ed6c00; stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray .4s ease;
}
.gauge-arc--mem { stroke: #9b59b6; }
.gauge-num {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 600;
}
.gauge-num small { font-size: 12px; font-weight: 400; margin-top: 4px; }
.gauge-sub { text-align: center; font-size: 12px; color: var(--color-text-muted); margin-top: 4px; }

/* ── Port status ─────────────────────────────────────────────────────────── */
.iface-list {
  display: flex;
  gap: 0;
  padding: 6px 4px 2px;
}
.iface-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-left: 20px;
}
.iface-item:first-child { margin-left: 0; }
.port-icon {
  font-size: 30px;
  line-height: 1;
}
.port-icon::before { content: "\e62c"; }
.iface-label { font-size: 11px; color: var(--color-text-muted); }
/* WAN linked = blue, LAN linked = orange, unlinked = gray */
.iface-link-wan .port-icon { color: #0068ff; }
.iface-link-lan .port-icon { color: #ff6f08; }
.iface-unlink   .port-icon { color: #adadad; }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .dash-row { flex-direction: column; }
  .col-half, .col-quarter, .col-full { flex: 0 0 100%; max-width: 100%; }
  .stats-grid { grid-template-columns: 1fr 1fr; gap: 0; }
  .stats-grid .shbox { margin: 8px 0 0 8px; }
  .stats-grid .shbox:nth-child(odd) { margin-left: 0; }
  .shbox { margin-right: 0 !important; }
  .gauge-wrap { width: 80px; height: 80px; }
  .gauge-num { font-size: 18px; }
  .stat-icon { width: 36px; height: 36px; }
  .stat-num { font-size: 15px; }
}
</style>
