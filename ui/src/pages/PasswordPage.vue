<template>
  <div class="w-full md:w-1/2 mx-auto">
    <div class="box">
        <div class="section-title">{{ t('change_password') }}</div>

        <FormField :label="t('old_passwd')">
          <input v-model="form.oldPwd" type="password" autocomplete="current-password" />
        </FormField>

        <FormField :label="t('new_passwd')">
          <input v-model="form.newPwd" type="password" autocomplete="new-password" />
        </FormField>

        <FormField :label="t('confirm_passwd')">
          <input v-model="form.confirmPwd" type="password" autocomplete="new-password" />
        </FormField>
    </div>

    <div class="form-actions">
      <button class="btn btn-primary" :disabled="saving" @click="save">
        {{ saving ? '…' : (t('save') || 'Save') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { useNotify } from '@/composables/useNotify'
import FormField from '@/components/FormField.vue'

const { t } = useI18n()
const router = useRouter()
const { uciGet, uciSet, authLogoutAll } = useApi()
const { success, error } = useNotify()
const saving = ref(false)

const form = reactive({ oldPwd: '', newPwd: '', confirmPwd: '' })

async function save() {
  if (saving.value) return

  if (form.newPwd !== form.confirmPwd) {
    error(t('passwd_mismatch'))
    return
  }
  if (!form.newPwd) {
    error(t('new_passwd'))
    return
  }

  saving.value = true
  try {
    const data = await uciGet(['management.admin.password'])
    const stored = data['management.admin.password'] || 'admin'

    if (form.oldPwd !== stored) {
      error(t('passwd_wrong'))
      return
    }

    await uciSet({ 'management.admin.password': form.newPwd })
    success(t('set_ok'))
    await authLogoutAll().catch(() => {})
    router.push('/login')
  } catch {
    error(t('set_err'))
  } finally {
    saving.value = false
  }
}
</script>
