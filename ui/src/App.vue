<template>
  <RouterView v-if="isLoginPage" />
  <AppLayout v-else />
  <NotifyToast />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './layout/AppLayout.vue'
import NotifyToast from './components/NotifyToast.vue'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')
</script>
