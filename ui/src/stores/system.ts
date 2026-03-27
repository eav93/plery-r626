import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'

interface SystemStats {
  cpu_pct: number
  mem_pct: number
  mem_total: number
  mem_avail: number
  rx_bytes: number
  tx_bytes: number
  uptime: number
  conntrack: number
  user_count: number
  wan_ip: string
}

interface SystemVersion {
  version: string
  macaddr: string
  hostname: string
  model: string
}

export const useSystemStore = defineStore('system', () => {
  const { get } = useApi()

  const stats   = ref<SystemStats | null>(null)
  const version = ref<SystemVersion | null>(null)
  const lang    = ref<'en' | 'ru' | 'cn'>('ru')

  async function fetchStats() {
    try { stats.value = await get<SystemStats>('/api/system/stats') }
    catch { /* ignore */ }
  }

  async function fetchVersion() {
    try { version.value = await get<SystemVersion>('/api/system/version') }
    catch { /* ignore */ }
  }

  async function fetchLang() {
    try {
      const d = await get<{ language: string }>('/api/system/language')
      if (d.language) lang.value = d.language as 'en' | 'ru' | 'cn'
    } catch { /* ignore */ }
  }

  return { stats, version, lang, fetchStats, fetchVersion, fetchLang }
})
