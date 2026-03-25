<template>
  <RouterView v-if="isLoginPage" />
  <AppLayout v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './layout/AppLayout.vue'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')
</script>
