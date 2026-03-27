<template>
  <div class="box">
    <div class="section-title">{{ t('wan_set') }}</div>

    <!-- Connection type — radio -->
    <FormField :label="t('wan_type') || 'Тип подключения'">
      <div class="flex flex-wrap gap-x-5 gap-y-2">
        <label v-for="p in protos" :key="p.value" class="inline-flex items-center gap-1.5 cursor-pointer select-none">
          <input type="radio" v-model="form.proto" :value="p.value" />
          <span class="text-[13px]">{{ p.label }}</span>
        </label>
      </div>
    </FormField>

    <!-- DHCP -->
    <div v-if="form.proto === 'dhcp'" class="py-3 text-sm text-[#888] text-center">
      {{ t('dhcp_auto') || 'IP-адрес получается автоматически от провайдера.' }}
    </div>

    <!-- PPPoE -->
    <template v-if="form.proto === 'pppoe'">
      <FormField :label="t('pppoe_name') || 'Имя пользователя'">
        <input v-model="form.username" type="text" autocomplete="username" />
      </FormField>
      <FormField :label="t('pppoe_psd') || 'Пароль'">
        <input v-model="form.password" :type="showPwd ? 'text' : 'password'" autocomplete="current-password" />
        <button class="pwd-toggle" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁' }}</button>
      </FormField>
      <FormField :label="t('pppoe_sever_name') || 'Имя сервиса'">
        <input v-model="form.service" type="text" />
      </FormField>
      <FormField label="MTU">
        <input v-model="form.mtu" type="number" min="576" max="1500" />
      </FormField>
    </template>

    <!-- Static -->
    <template v-if="form.proto === 'static'">
      <FormField :label="t('ip_addr') || 'IP-адрес'">
        <input v-model="form.ipaddr" type="text" placeholder="0.0.0.0" />
      </FormField>
      <FormField :label="t('subnet_mask') || 'Маска подсети'">
        <select v-model="form.netmask">
          <option v-for="m in netmasks" :key="m" :value="m">{{ m }}</option>
        </select>
      </FormField>
      <FormField :label="t('gateway') || 'Шлюз'">
        <input v-model="form.gateway" type="text" placeholder="0.0.0.0" />
      </FormField>
      <FormField label="DNS">
        <input v-model="form.dns" type="text" placeholder="8.8.8.8" />
      </FormField>
    </template>

    <!-- QMI / 4G -->
    <template v-if="form.proto === 'qmi'">
      <FormField :label="t('apninfo') || 'Настройка APN'">
        <select v-model="form.apnMode">
          <option value="auto">{{ t('apn_auto') || 'Автоматически' }}</option>
          <option value="manual">{{ t('apn_nanual') || 'Вручную' }}</option>
        </select>
      </FormField>
      <template v-if="form.apnMode === 'manual'">
        <FormField :label="t('apnauth') || 'Аутентификация APN'">
          <select v-model="form.apnAuth">
            <option value="0">{{ t('auth_none') || 'Нет' }}</option>
            <option value="1">{{ t('auth_pap') || 'PAP' }}</option>
            <option value="2">{{ t('auth_chap') || 'CHAP' }}</option>
            <option value="3">{{ t('auth_pap_chap') || 'PAP и CHAP' }}</option>
          </select>
        </FormField>
        <FormField :label="t('apn') || 'APN'">
          <input v-model="form.apn" type="text" placeholder="internet" />
        </FormField>
        <FormField :label="t('apn_user') || 'Имя пользователя'">
          <input v-model="form.apnUser" type="text" autocomplete="username" />
        </FormField>
        <FormField :label="t('apn_psd') || 'Пароль'">
          <input v-model="form.apnPassword" :type="showApnPwd ? 'text' : 'password'" autocomplete="current-password" />
          <button class="pwd-toggle" @click="showApnPwd = !showApnPwd">{{ showApnPwd ? '🙈' : '👁' }}</button>
        </FormField>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi'
import FormField from '@/components/FormField.vue'

const { t } = useI18n()
const { uciGet } = useApi()

const netmasks = [
  '255.255.255.252', '255.255.255.248', '255.255.255.240',
  '255.255.255.224', '255.255.255.192', '255.255.255.128',
  '255.255.255.0',   '255.255.254.0',   '255.255.252.0',
  '255.255.248.0',   '255.255.240.0',   '255.255.224.0',
  '255.255.0.0',     '255.254.0.0',     '255.252.0.0',
  '255.248.0.0',     '255.240.0.0',     '255.0.0.0',
]

const protos = [
  { value: 'dhcp',   label: 'DHCP' },
  { value: 'pppoe',  label: 'PPPoE' },
  { value: 'static', label: t('staAddress') || 'Статический' },
  { value: 'qmi',    label: '4G/LTE' },
]

const form = reactive({
  proto:       'dhcp',
  // PPPoE
  username:    '',
  password:    '',
  service:     '',
  mtu:         '1492',
  // Static
  ipaddr:      '',
  netmask:     '255.255.255.0',
  gateway:     '',
  dns:         '',
  // QMI
  apnMode:     'auto',
  apnAuth:     '0',
  apn:         '',
  apnUser:     '',
  apnPassword: '',
})

const showPwd    = ref(false)
const showApnPwd = ref(false)

onMounted(async () => {
  try {
    const data = await uciGet([
      'network.wan.proto',    'network.wan.ipaddr',   'network.wan.netmask',
      'network.wan.gateway',  'network.wan.dns',      'network.wan.username',
      'network.wan.password', 'network.wan.mtu',      'network.wan.service',
      'network.wan.apn',      'network.wan.apn_auth', 'network.wan.apn_user',
      'network.wan.apn_psd',
    ])
    form.proto       = data['network.wan.proto']    || 'dhcp'
    form.ipaddr      = data['network.wan.ipaddr']   || ''
    form.netmask     = data['network.wan.netmask']  || '255.255.255.0'
    form.gateway     = data['network.wan.gateway']  || ''
    form.dns         = data['network.wan.dns']      || ''
    form.username    = data['network.wan.username'] || ''
    form.password    = data['network.wan.password'] || ''
    form.mtu         = data['network.wan.mtu']      || '1492'
    form.service     = data['network.wan.service']  || ''
    form.apn         = data['network.wan.apn']      || ''
    form.apnAuth     = data['network.wan.apn_auth'] || '0'
    form.apnUser     = data['network.wan.apn_user'] || ''
    form.apnPassword = data['network.wan.apn_psd']  || ''
    form.apnMode     = form.apn ? 'manual' : 'auto'
  } catch { /* ignore */ }
})

function getUci(): Record<string, string> {
  const obj: Record<string, string> = { 'network.wan.proto': form.proto }
  if (form.proto === 'pppoe') {
    obj['network.wan.username'] = form.username
    obj['network.wan.password'] = form.password
    obj['network.wan.service']  = form.service
    obj['network.wan.mtu']      = form.mtu
  } else if (form.proto === 'static') {
    obj['network.wan.ipaddr']   = form.ipaddr
    obj['network.wan.netmask']  = form.netmask
    obj['network.wan.gateway']  = form.gateway
    obj['network.wan.dns']      = form.dns
  } else if (form.proto === 'qmi') {
    if (form.apnMode === 'manual') {
      obj['network.wan.apn']      = form.apn
      obj['network.wan.apn_auth'] = form.apnAuth
      obj['network.wan.apn_user'] = form.apnUser
      obj['network.wan.apn_psd']  = form.apnPassword
    }
  }
  return obj
}

defineExpose({ getUci, form })
</script>

<style scoped>
.pwd-toggle {
  padding: 0 8px;
  height: 30px;
  border: 1px solid #9eb9c2;
  border-radius: 2px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}
</style>
