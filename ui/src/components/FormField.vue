<template>
  <div class="form-row">
    <label v-if="label" class="form-row__label">{{ label }}</label>
    <div class="form-row__value">
      <slot />
      <span v-if="hint" class="field-hint">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label?: string; hint?: string }>()
</script>
