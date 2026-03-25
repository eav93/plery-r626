<template>
  <div class="dashboard">

    <!-- Version / device info -->
    <div class="cards-row">
      <div class="card info-card">
        <div class="info-card__label">{{ t('hostname') || 'Hostname' }}</div>
        <div class="info-card__value">{{ version?.hostname ?? '—' }}</div>
      </div>
      <div class="card info-card">
        <div class="info-card__label">{{ t('firmware_version') || 'Firmware' }}</div>
        <div class="info-card__value version-str">{{ version?.version ?? '—' }}</div>
      </div>
      <div class="card info-card">
        <div class="info-card__label">MAC</div>
        <div class="info-card__value mono">{{ version?.macaddr ?? '—' }}</div>
      </div>
    </div>

    <!-- Stats gauges -->
    <div class="cards-row">
      <div class="card stat-card">
        <div class="stat-card__title">CPU</div>
        <div class="stat-card__gauge">
          <svg viewBox="0 0 36 36" class="gauge-svg">
            <path class="gauge-bg"
              d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32" />
            <path class="gauge-fill"
              :stroke-dasharray="`${cpuPct} 100`"
              d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32" />
          </svg>
          <span class="gauge-label">{{ cpuPct }}%</span>
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-card__title">{{ t('mem_usage') || 'Memory' }}</div>
        <div class="stat-card__gauge">
          <svg viewBox="0 0 36 36" class="gauge-svg">
            <path class="gauge-bg"
              d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32" />
            <path class="gauge-fill"
              :stroke-dasharray="`${memPct} 100`"
              d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32" />
          </svg>
          <span class="gauge-label">{{ memPct }}%</span>
        </div>
        <div class="stat-card__sub">{{ memTotalMB }} MB total</div>
      </div>

      <div class="card stat-card">
        <div class="stat-card__title">{{ t('uptime') || 'Uptime' }}</div>
        <div class="stat-card__big">{{ uptimeStr }}</div>
      </div>
    </div>

    <!-- Traffic -->
    <div class="cards-row">
      <div class="card traffic-card">
        <div class="traffic-card__title">↓ RX</div>
        <div class="traffic-card__value">{{ rxStr }}</div>
      </div>
      <div class="card traffic-card">
        <div class="traffic-card__title">↑ TX</div>
        <div class="traffic-card__value">{{ txStr }}</div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSystemStore } from '@/stores/system'

const { t } = useI18n()
const store = useSystemStore()

const version  = computed(() => store.version)
const stats    = computed(() => store.stats)
const cpuPct   = computed(() => stats.value?.cpu_pct  ?? 0)
const memPct   = computed(() => stats.value?.mem_pct  ?? 0)
const memTotalMB = computed(() => stats.value ? Math.round(stats.value.mem_total / 1024) : 0)

const uptimeStr = computed(() => {
  const s = stats.value?.uptime ?? 0
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return d ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`
})

function fmtBytes(b: number): string {
  if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB'
  if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB'
  if (b >= 1e3) return (b / 1e3).toFixed(0) + ' KB'
  return b + ' B'
}
const rxStr = computed(() => fmtBytes(stats.value?.rx_bytes ?? 0))
const txStr = computed(() => fmtBytes(stats.value?.tx_bytes ?? 0))

// Poll stats every 5 seconds
let timer: ReturnType<typeof setInterval>
onMounted(async () => {
  await Promise.all([store.fetchVersion(), store.fetchStats()])
  timer = setInterval(store.fetchStats, 5000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 16px; }

.cards-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

/* Info cards */
.info-card { padding: 14px 16px; }
.info-card__label { font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .5px; }
.info-card__value { font-size: 16px; font-weight: 600; margin-top: 4px; }
.version-str { font-size: 12px; word-break: break-all; }
.mono { font-family: monospace; }

/* Stat cards */
.stat-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; }
.stat-card__title { font-size: 12px; color: var(--color-text-muted); font-weight: 500; }
.stat-card__big { font-size: 22px; font-weight: 600; }
.stat-card__sub  { font-size: 11px; color: var(--color-text-muted); }

/* SVG gauge */
.stat-card__gauge { position: relative; width: 80px; height: 80px; }
.gauge-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.gauge-bg   { fill: none; stroke: var(--color-border); stroke-width: 3; }
.gauge-fill {
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dashoffset: 0;
  transition: stroke-dasharray .4s ease;
}
.gauge-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

/* Traffic */
.traffic-card { display: flex; flex-direction: column; gap: 4px; }
.traffic-card__title { font-size: 11px; color: var(--color-text-muted); }
.traffic-card__value { font-size: 20px; font-weight: 600; }
</style>
