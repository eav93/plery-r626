<template>
  <div class="field">
    <label v-if="label" class="field__label">{{ label }}</label>
    <slot />
    <span v-if="hint" class="field__hint">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label?: string; hint?: string }>()
</script>

<style scoped>
.field { display: flex; flex-direction: column; gap: 4px; }
.field__label { font-size: 12px; color: var(--color-text-muted); font-weight: 500; }
.field__hint  { font-size: 11px; color: var(--color-text-muted); }
</style>
