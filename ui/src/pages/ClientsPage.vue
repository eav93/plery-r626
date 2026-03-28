<template>
  <div class="page-form">
    <div class="box">
      <div class="flex items-center justify-between">
        <div class="section-title" style="margin-bottom:0">{{ t('currentdevice') || 'Подключённые устройства' }}</div>
        <button class="btn btn-ghost" :disabled="loading" @click="load" style="padding:4px 12px;font-size:13px">
          {{ loading ? '…' : (t('refresh') || 'Обновить') }}
        </button>
      </div>
    </div>

    <div class="box" style="padding:0;overflow:hidden">
      <table class="clients-table">
        <thead>
          <tr>
            <th>{{ t('hostname') || 'Имя' }}</th>
            <th>{{ t('ip_addr') || 'IP' }}</th>
            <th>{{ t('mac') || 'MAC' }}</th>
            <th>{{ t('interface') || 'Интерфейс' }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!clients.length">
            <td colspan="4" class="empty">{{ loading ? '…' : (t('no_clients') || 'Нет подключённых устройств') }}</td>
          </tr>
          <tr v-for="c in clients" :key="c.mac">
            <td>{{ c.hostname || '—' }}</td>
            <td>{{ c.ip }}</td>
            <td class="mono">{{ c.mac }}</td>
            <td>{{ c.iface || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi'

const { t } = useI18n()
const { get } = useApi()

const loading = ref(false)

interface Client {
  mac: string
  ip: string
  hostname: string
  iface: string
}

const clients = ref<Client[]>([])

async function load() {
  loading.value = true
  try {
    const [dhcp, arp] = await Promise.all([
      get<{ leases: { mac: string; ip: string; hostname: string; expires: number }[] }>('/api/dhcp/leases'),
      get<{ entries: { ip: string; mac: string; iface: string }[] }>('/api/arp'),
    ])

    // Index ARP by MAC for fast lookup
    const arpByMac = new Map<string, { ip: string; iface: string }>()
    for (const e of (arp.entries || [])) {
      arpByMac.set(e.mac.toLowerCase(), { ip: e.ip, iface: e.iface })
    }

    // Start with DHCP leases (have hostname)
    const result = new Map<string, Client>()
    for (const l of (dhcp.leases || [])) {
      const mac = l.mac.toLowerCase()
      const arpEntry = arpByMac.get(mac)
      result.set(mac, {
        mac:      l.mac,
        ip:       l.ip,
        hostname: l.hostname,
        iface:    arpEntry?.iface || '',
      })
    }

    // Add ARP entries not in DHCP (static IPs)
    for (const e of (arp.entries || [])) {
      const mac = e.mac.toLowerCase()
      if (!result.has(mac)) {
        result.set(mac, { mac: e.mac, ip: e.ip, hostname: '', iface: e.iface })
      }
    }

    clients.value = [...result.values()]
  } catch { /* ignore */ }
  finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.clients-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.clients-table th {
  text-align: left;
  padding: 10px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0ecf0;
  color: #555;
  font-weight: 600;
  white-space: nowrap;
}
.clients-table td {
  padding: 9px 16px;
  border-bottom: 1px solid #e0ecf0;
  color: #333;
}
.clients-table tr:last-child td {
  border-bottom: none;
}
.clients-table tr:hover td {
  background: #f9fdff;
}
.mono {
  font-family: monospace;
  font-size: 12px;
}
.empty {
  text-align: center;
  color: #aaa;
  padding: 24px !important;
}
</style>
