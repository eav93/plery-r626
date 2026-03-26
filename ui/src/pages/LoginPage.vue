<template>
  <div class="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4 pt-0 max-[500px]:items-start max-[500px]:pt-10">
    <div class="w-full max-w-[460px] bg-white border border-[#9eb9c2] rounded">

      <div class="bg-[#ffc510] flex items-center justify-center h-[70px] rounded-t">
        <img :src="logoUrl" alt="Plery" class="h-[38px] w-auto" />
      </div>

      <form @submit.prevent="doLogin" class="px-4 pt-5 pb-4">
        <div class="form-row">
          <label class="form-row__label">{{ t('language') }}</label>
          <div class="form-row__value">
            <select :value="locale" @change="changeLang">
              <option value="ru">Русский</option>
              <option value="en">English</option>
              <option value="cn">简体中文</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <label class="form-row__label">{{ t('pwd') }}</label>
          <div class="form-row__value">
            <input v-model="password" type="password" autocomplete="current-password" required />
          </div>
        </div>

        <p v-if="errorMsg" class="text-[12px] text-[#d9534f] px-[10px] py-[6px] bg-[rgba(209,52,56,0.08)] rounded my-1">{{ errorMsg }}</p>

        <div class="flex gap-2 pt-3 pb-1 justify-center">
          <button type="submit" class="btn btn-primary min-w-[120px] justify-center" :disabled="loading">
            {{ loading ? '…' : t('login') }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi'
import logoUrl from '@/assets/logo.png'

const { t, locale } = useI18n()
const router = useRouter()
const route  = useRoute()
const { authLogin } = useApi()

const password = ref('')
const loading  = ref(false)
const errorMsg = ref('')

function changeLang(e: Event) {
  locale.value = (e.target as HTMLSelectElement).value as 'en' | 'ru' | 'cn'
}

function errText(errKey?: string, errMsg?: string) {
  return (errKey ? t(errKey) : '') || errMsg || ''
}

async function doLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await authLogin(password.value)
    if (res.errCode === 0) {
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    } else {
      errorMsg.value = errText(res.errKey, res.errMsg) || t('password_error')
    }
  } catch (e) {
    const detail = e instanceof Error ? e.message : ''
    errorMsg.value = t('network_err') + (detail ? ': ' + detail : '')
  } finally {
    loading.value = false
  }
}
</script>

