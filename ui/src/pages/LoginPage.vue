<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="login-logo">Plery R626</div>

      <form @submit.prevent="doLogin" class="login-form">
        <FormField :label="t('username') || 'Username'">
          <input v-model="username" type="text" autocomplete="username" required />
        </FormField>
        <FormField :label="t('password') || 'Password'">
          <input v-model="password" type="password" autocomplete="current-password" required />
        </FormField>

        <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>

        <button type="submit" class="btn btn-primary" :disabled="loading" style="width:100%;justify-content:center">
          {{ loading ? '…' : (t('login') || 'Login') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi'
import FormField from '@/components/FormField.vue'

const { t } = useI18n()
const router = useRouter()
const { post } = useApi()
const username = ref('admin')
const password = ref('')
const loading  = ref(false)
const errorMsg = ref('')

async function doLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await post<{ errCode: number }>('/cgi-bin/login', {
      username: username.value,
      password: password.value,
    })
    if (res.errCode === 0) {
      router.push('/dashboard')
    } else {
      errorMsg.value = t('password_error') || 'Wrong password'
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
  max-width: 360px;
  padding: 32px;
}
.login-logo {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 24px;
  color: var(--color-primary);
}
.login-form { display: flex; flex-direction: column; gap: 14px; }
.login-error {
  font-size: 12px;
  color: var(--color-danger);
  padding: 6px 10px;
  background: rgba(209,52,56,.08);
  border-radius: var(--radius);
}
</style>
