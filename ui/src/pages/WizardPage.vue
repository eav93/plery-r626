<template>
  <div class="p-4 grid grid-cols-2 gap-4">

    <RouterLink
      v-for="m in modes" :key="m.id"
      :to="`/wizard/${m.id}`"
      class="box flex flex-col items-center gap-2 py-4 transition-colors cursor-pointer no-underline"
      :class="currentMode === m.id
        ? '!border-[#ffc510] bg-[#fffbef]'
        : 'hover:!border-[#ffc510] hover:bg-[#fffbef]'"
    >
      <img :src="m.img" class="h-40 object-contain" />
      <span class="text-sm text-center text-[#16191c]">{{ t(m.labelKey) }}</span>
    </RouterLink>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi'

import imgRouter   from '@/assets/m_router.png'
import imgAp       from '@/assets/m_ap.png'
import imgRepeater from '@/assets/m_repeater.png'
import imgBridge   from '@/assets/m_bridge.png'

const { t } = useI18n()
const { uciGet } = useApi()

const modes = [
  { id: 'router',   labelKey: 'router',   img: imgRouter   },
  { id: 'bridge',   labelKey: 'bridge',   img: imgBridge   },
  { id: 'ap',       labelKey: 'ap',       img: imgAp       },
  { id: 'repeater', labelKey: 'repeater', img: imgRepeater },
]

const currentMode = ref('router')

onMounted(async () => {
  try {
    const d = await uciGet('mbox.workmode.workmode')
    currentMode.value = d['mbox.workmode.workmode'] || 'router'
  } catch { /* ignore */ }
})
</script>
