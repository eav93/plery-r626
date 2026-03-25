<template>
  <div class="login-page">
    <div class="login-card">

      <div class="login-brand">
        <img :src="logoUrl" alt="Plery" class="login-logo" />
      </div>

      <form @submit.prevent="doLogin" class="login-form">
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

        <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>

        <div class="form-actions" style="justify-content:center">
          <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
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

async function doLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await authLogin(password.value)
    if (res.errCode === 0) {
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    } else {
      errorMsg.value = res.errMsg || t('password_error') || 'Wrong password'
    }
  } catch {
    errorMsg.value = t('network_err') || 'Network error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
}

.login-card {
  width: 100%;
  max-width: 460px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-sizing: border-box;
}

@media (max-width: 500px) {
  .login-page { padding: 16px; align-items: flex-start; padding-top: 40px; }
  .login-card { max-width: 100%; }
}

.login-brand {
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70px;
  border-radius: var(--radius) var(--radius) 0 0;
}
.login-logo { height: 38px; width: auto; }

.login-form { padding: 20px 16px 16px; }

.login-error {
  font-size: 12px;
  color: var(--color-danger);
  padding: 6px 10px;
  background: rgba(209,52,56,.08);
  border-radius: var(--radius);
  margin: 4px 0;
}

.login-btn { min-width: 120px; justify-content: center; }
</style>
