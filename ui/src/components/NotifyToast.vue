<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="px-4 py-[10px] rounded text-[13px] font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] toast-slide-in"
        :class="{
          'bg-[#2ecc71]': n.type === 'success',
          'bg-[#d9534f]': n.type === 'error',
          'bg-[#1d1e1f]': n.type === 'info',
        }"
      >{{ n.message }}</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotify } from '@/composables/useNotify'
const { notifications } = useNotify()
</script>

<style scoped>
@keyframes slide-in {
  from { transform: translateX(20px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
.toast-slide-in { animation: slide-in .2s ease; }
</style>
