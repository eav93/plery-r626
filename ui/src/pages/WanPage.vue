<template>
  <div class="page-form">
    <div class="card">
      <div class="section-title">WAN</div>

      <FormField :label="t('wan_type') || 'Connection Type'">
        <div class="proto-tabs">
          <button
            v-for="p in protos" :key="p.value"
            class="proto-tab"
            :class="{ 'is-active': form.proto === p.value }"
            @click="form.proto = p.value"
          >{{ p.label }}</button>
        </div>
      </FormField>

      <!-- DHCP — no extra fields -->
      <p v-if="form.proto === 'dhcp'" style="font-size:13px;color:var(--color-text-muted)">
        {{ t('dhcp_auto') || 'IP address is obtained automatically from the provider.' }}
      </p>

      <!-- PPPoE -->
      <template v-if="form.proto === 'pppoe'">
        <FormField :label="t('username') || 'Username'">
          <input v-model="form.username" type="text" autocomplete="username" />
        </FormField>
        <FormField :label="t('password') || 'Password'">
          <input v-model="form.password" type="password" autocomplete="current-password" />
        </FormField>
        <FormField label="MTU">
          <input v-model="form.mtu" type="number" min="576" max="1500" placeholder="1492" />
        </FormField>
      </template>

      <!-- Static -->
      <template v-if="form.proto === 'static'">
        <FormField :label="t('ip_addr') || 'IP Address'">
          <input v-model="form.ipaddr" type="text" placeholder="0.0.0.0" />
        </FormField>
        <FormField :label="t('subnet_mask') || 'Subnet Mask'">
          <select v-model="form.netmask">
            <option value="255.255.255.0">255.255.255.0</option>
            <option value="255.255.0.0">255.255.0.0</option>
            <option value="255.0.0.0">255.0.0.0</option>
          </select>
        </FormField>
        <FormField :label="t('gateway') || 'Gateway'">
          <input v-model="form.gateway" type="text" placeholder="0.0.0.0" />
        </FormField>
        <FormField label="DNS">
          <input v-model="form.dns" type="text" placeholder="8.8.8.8" />
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

const protos = [
  { value: 'dhcp',   label: 'DHCP' },
  { value: 'pppoe',  label: 'PPPoE' },
  { value: 'static', label: t('static_ip') || 'Static' },
]

const form = reactive({
  proto: 'dhcp', ipaddr: '', netmask: '255.255.255.0',
  gateway: '', dns: '', username: '', password: '', mtu: '1492',
})

onMounted(async () => {
  try {
    const data = await uciGet([
      'network.wan.proto', 'network.wan.ipaddr', 'network.wan.netmask',
      'network.wan.gateway', 'network.wan.dns', 'network.wan.username',
      'network.wan.password', 'network.wan.mtu',
    ])
    form.proto    = data['network.wan.proto']    || 'dhcp'
    form.ipaddr   = data['network.wan.ipaddr']   || ''
    form.netmask  = data['network.wan.netmask']  || '255.255.255.0'
    form.gateway  = data['network.wan.gateway']  || ''
    form.dns      = data['network.wan.dns']      || ''
    form.username = data['network.wan.username'] || ''
    form.password = data['network.wan.password'] || ''
    form.mtu      = data['network.wan.mtu']      || '1492'
  } catch { /* ignore */ }
})

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    const obj: Record<string, string> = { 'network.wan.proto': form.proto }
    if (form.proto === 'pppoe') {
      obj['network.wan.username'] = form.username
      obj['network.wan.password'] = form.password
      obj['network.wan.mtu']      = form.mtu
    } else if (form.proto === 'static') {
      obj['network.wan.ipaddr']   = form.ipaddr
      obj['network.wan.netmask']  = form.netmask
      obj['network.wan.gateway']  = form.gateway
      obj['network.wan.dns']      = form.dns
    }
    await uciSet(obj)
    await apiAction('apply', { service: 'network' })
    success(t('set_ok') || 'Saved')
  } catch { error(t('set_err') || 'Error') }
  finally { saving.value = false }
}
</script>

<style scoped>
.proto-tabs { display: flex; gap: 4px; }
.proto-tab {
  padding: 6px 14px; border-radius: var(--radius);
  border: 1px solid var(--color-border); font-size: 13px; cursor: pointer;
  background: var(--color-surface); transition: all .15s;
}
.proto-tab.is-active {
  background: var(--color-primary); color: #fff; border-color: var(--color-primary);
}
</style>
