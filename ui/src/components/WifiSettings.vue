<template>
  <!-- Band Steering toggle -->
  <div class="box">
    <div class="form-row">
      <label class="form-row__label">{{ t('band_steering') }}</label>
      <div class="form-row__value flex items-center gap-3">
        <label class="toggle">
          <input type="checkbox" v-model="bandSteering" />
          <span class="toggle__track"><span class="toggle__thumb"></span></span>
        </label>
        <span class="text-xs text-[#888]">
          {{ bandSteering ? t('band_steering_on_hint') : t('band_steering_off_hint') }}
        </span>
      </div>
    </div>
  </div>

  <!-- Band Steering ON: shared settings + per-radio grid -->
  <template v-if="bandSteering">
    <div class="box">
      <div class="section-title">{{ t('wifi_network') }}</div>

      <FormField :label="t('ssid') || 'SSID'">
        <input v-model="shared.ssid" type="text" maxlength="32" />
      </FormField>

      <FormField :label="t('encrypt') || 'Шифрование'">
        <select v-model="shared.encryption">
          <option value="psk2">WPA2-PSK</option>
          <option value="psk-mixed">WPA/WPA2-PSK</option>
          <option value="psk">WPA-PSK</option>
          <option value="none">{{ t('none') || 'Открытая' }}</option>
        </select>
      </FormField>

      <FormField v-if="shared.encryption !== 'none'" :label="t('wifi_passwd') || 'Пароль'">
        <input v-model="shared.key" :type="showSharedPwd ? 'text' : 'password'" maxlength="63" />
        <button class="pwd-toggle" @click="showSharedPwd = !showSharedPwd">{{ showSharedPwd ? '🙈' : '👁' }}</button>
      </FormField>

      <FormField :label="t('hidden') || 'Скрыть SSID'">
        <label class="toggle">
          <input type="checkbox" v-model="shared.hidden" />
          <span class="toggle__track"><span class="toggle__thumb"></span></span>
        </label>
      </FormField>
    </div>

    <div class="radio-grid">
      <div v-for="r in radios" :key="r.id" class="box">
        <div class="section-title">{{ r.label }}</div>

        <FormField :label="t('channels') || 'Канал'">
          <select v-model="r.channel">
            <option value="auto">{{ t('auto') || 'Авто' }}</option>
            <option v-for="ch in r.channels" :key="ch" :value="String(ch)">{{ ch }}</option>
          </select>
        </FormField>

        <FormField :label="t('wifi_enable') || 'Радио'">
          <label class="toggle">
            <input type="checkbox" v-model="r.enabled" />
            <span class="toggle__track"><span class="toggle__thumb"></span></span>
            <span class="ml-2 text-sm">{{ r.enabled ? (t('enable') || 'Вкл') : (t('disable') || 'Выкл') }}</span>
          </label>
        </FormField>
      </div>
    </div>
  </template>

  <!-- Band Steering OFF: two independent columns -->
  <div v-else class="radio-grid">
    <div v-for="r in radios" :key="r.id" class="box">
      <div class="section-title">{{ r.label }}</div>

      <FormField :label="t('ssid') || 'SSID'">
        <input v-model="r.ssid" type="text" maxlength="32" />
      </FormField>

      <FormField :label="t('encrypt') || 'Шифрование'">
        <select v-model="r.encryption">
          <option value="psk2">WPA2-PSK</option>
          <option value="psk-mixed">WPA/WPA2-PSK</option>
          <option value="psk">WPA-PSK</option>
          <option value="none">{{ t('none') || 'Открытая' }}</option>
        </select>
      </FormField>

      <FormField v-if="r.encryption !== 'none'" :label="t('wifi_passwd') || 'Пароль'">
        <input v-model="r.key" :type="showPwd[r.id] ? 'text' : 'password'" maxlength="63" />
        <button class="pwd-toggle" @click="showPwd[r.id] = !showPwd[r.id]">{{ showPwd[r.id] ? '🙈' : '👁' }}</button>
      </FormField>

      <FormField :label="t('channels') || 'Канал'">
        <select v-model="r.channel">
          <option value="auto">{{ t('auto') || 'Авто' }}</option>
          <option v-for="ch in r.channels" :key="ch" :value="String(ch)">{{ ch }}</option>
        </select>
      </FormField>

      <FormField :label="t('hidden') || 'Скрыть SSID'">
        <label class="toggle">
          <input type="checkbox" v-model="r.hidden" />
          <span class="toggle__track"><span class="toggle__thumb"></span></span>
        </label>
      </FormField>

      <FormField :label="t('wifi_enable') || 'Радио'">
        <label class="toggle">
          <input type="checkbox" v-model="r.enabled" />
          <span class="toggle__track"><span class="toggle__thumb"></span></span>
          <span class="ml-2 text-sm">{{ r.enabled ? (t('enable') || 'Вкл') : (t('disable') || 'Выкл') }}</span>
        </label>
      </FormField>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FormField from '@/components/FormField.vue'

const { t } = useI18n()

export interface RadioData {
  id: string
  label: string
  channels: number[]
  ssid: string
  key: string
  encryption: string
  hidden: boolean
  channel: string
  enabled: boolean
}

export interface WifiShared {
  ssid: string
  key: string
  encryption: string
  hidden: boolean
}

export interface WifiSettingsValue {
  bandSteering: boolean
  shared: WifiShared
  radios: RadioData[]
}

const props = defineProps<{ modelValue: WifiSettingsValue }>()
const emit  = defineEmits<{ 'update:modelValue': [v: WifiSettingsValue] }>()

// Local reactive state mirrored from modelValue
const bandSteering = ref(props.modelValue.bandSteering)
const shared = reactive<WifiShared>({ ...props.modelValue.shared })
const radios = reactive<RadioData[]>(props.modelValue.radios.map(r => ({ ...r })))
const showSharedPwd = ref(false)
const showPwd = reactive<Record<string, boolean>>(
  Object.fromEntries(props.modelValue.radios.map(r => [r.id, false]))
)

function emitUpdate() {
  emit('update:modelValue', {
    bandSteering: bandSteering.value,
    shared: { ...shared },
    radios: radios.map(r => ({ ...r })),
  })
}

// When switching band steering OFF, pre-fill per-radio fields from shared
watch(bandSteering, (on) => {
  if (!on) {
    for (const r of radios) {
      if (!r.ssid) r.ssid = shared.ssid
      if (r.id === '5g' && r.ssid && !/5G$/i.test(r.ssid)) r.ssid += ' 5G'
      r.key        = shared.key
      r.encryption = shared.encryption
      r.hidden     = shared.hidden
    }
  }
  emitUpdate()
})

watch(shared, emitUpdate, { deep: true })
watch(radios, emitUpdate, { deep: true })
</script>

<style scoped>
.radio-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (max-width: 600px) {
  .radio-grid { grid-template-columns: 1fr; }
}
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
