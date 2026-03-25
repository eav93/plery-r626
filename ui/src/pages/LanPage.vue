<template>
  <div class="page-form">

    <div class="card">
      <div class="section-title">{{ t('lan_set') || 'LAN' }}</div>

      <FormField :label="t('ip_addr') || 'IP Address'">
        <input v-model="form.ipaddr" type="text" placeholder="192.168.0.1" />
      </FormField>

      <FormField :label="t('subnet_mask') || 'Subnet Mask'">
        <select v-model="form.netmask">
          <option value="255.255.255.0">255.255.255.0</option>
          <option value="255.255.0.0">255.255.0.0</option>
          <option value="255.0.0.0">255.0.0.0</option>
          <option value="255.255.255.128">255.255.255.128</option>
          <option value="255.255.255.192">255.255.255.192</option>
        </select>
      </FormField>
    </div>

    <div class="card">
      <div class="section-title">DHCP</div>

      <FormField :label="t('dhcp_server') || 'DHCP Server'">
        <label class="toggle">
          <input type="checkbox" v-model="dhcpEnabled" />
          <span class="toggle__track"><span class="toggle__thumb"></span></span>
          <span>{{ dhcpEnabled ? (t('enable') || 'Enabled') : (t('disable') || 'Disabled') }}</span>
        </label>
      </FormField>

      <template v-if="dhcpEnabled">
        <FormField :label="t('start_addr') || 'Start'">
          <input v-model="form.dhcpStart" type="number" min="1" max="254" />
        </FormField>
        <FormField :label="t('end_addr') || 'Max Leases'">
          <input v-model="form.dhcpLimit" type="number" min="1" max="253" />
        </FormField>
        <FormField :label="t('lease_time') || 'Lease Time (min)'">
          <input v-model="form.dhcpLeasetime" type="number" min="1" />
        </FormField>
        <FormField :label="t('domain') || 'Domain'">
          <input v-model="form.dhcpDomain" type="text" />
        </FormField>
      </template>
    </div>

    <div class="form-actions">
      <button class="btn btn-primary" :disabled="saving" @click="save">
        {{ saving ? '…' : (t('save') || 'Save') }}
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
const dhcpEnabled = ref(true)

const form = reactive({
  ipaddr: '192.168.0.1', netmask: '255.255.255.0',
  dhcpStart: '100', dhcpLimit: '150', dhcpLeasetime: '1440', dhcpDomain: '',
})

onMounted(async () => {
  try {
    const data = await uciGet([
      'network.lan.ipaddr', 'network.lan.netmask',
      'dhcp.lan.start', 'dhcp.lan.limit', 'dhcp.lan.leasetime',
      'dhcp.lan.domain', 'dhcp.lan.ignore',
    ])
    form.ipaddr     = data['network.lan.ipaddr']  || form.ipaddr
    form.netmask    = data['network.lan.netmask'] || form.netmask
    form.dhcpStart  = data['dhcp.lan.start']      || form.dhcpStart
    form.dhcpLimit  = data['dhcp.lan.limit']      || form.dhcpLimit
    form.dhcpDomain = data['dhcp.lan.domain']     || ''
    const ls = parseInt(data['dhcp.lan.leasetime'] || '86400')
    form.dhcpLeasetime = String(Math.round(ls / 60))
    dhcpEnabled.value  = data['dhcp.lan.ignore'] !== '1'
  } catch { /* ignore */ }
})

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    await uciSet({
      'network.lan.ipaddr':  form.ipaddr,
      'network.lan.netmask': form.netmask,
      'dhcp.lan.start':      form.dhcpStart,
      'dhcp.lan.limit':      form.dhcpLimit,
      'dhcp.lan.leasetime':  String(parseInt(form.dhcpLeasetime) * 60),
      'dhcp.lan.domain':     form.dhcpDomain,
      'dhcp.lan.ignore':     dhcpEnabled.value ? '0' : '1',
    })
    await apiAction('apply', { service: 'network' })
    success(t('set_ok') || 'Saved')
  } catch { error(t('set_err') || 'Error') }
  finally { saving.value = false }
}
</script>
