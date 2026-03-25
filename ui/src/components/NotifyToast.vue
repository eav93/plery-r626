<template>
  <Teleport to="body">
    <div class="toast-container">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="toast"
        :class="`toast--${n.type}`"
      >{{ n.message }}</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotify } from '@/composables/useNotify'
const { notifications } = useNotify()
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
}
.toast {
  padding: 10px 16px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,.2);
  animation: slide-in .2s ease;
}
.toast--success { background: var(--color-success); }
.toast--error   { background: var(--color-danger); }
.toast--info    { background: var(--color-primary); }

@keyframes slide-in {
  from { transform: translateX(20px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
</style>
