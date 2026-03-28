<template>
  <div class="flex h-screen overflow-hidden" :class="isMobile ? 'flex-col' : 'flex-row'">

    <!-- Desktop sidebar -->
    <aside v-if="!isMobile" class="w-[230px] min-w-[230px] bg-[#1d1e1f] text-[#eaeefe] flex flex-col overflow-y-auto">
      <div class="h-[60px] bg-[#ffc510] flex items-center justify-center shrink-0">
        <img :src="logoUrl" alt="Plery" class="h-9 w-auto" />
      </div>
      <nav class="flex-1">
        <template v-for="item in navItems" :key="item.id">
          <div v-if="item.children">
            <button
              class="flex items-center gap-3 px-5 h-12 cursor-pointer text-[15px] text-[#eaeefe] transition-colors border-l-4 border-l-transparent no-underline w-full text-left bg-transparent hover:bg-[rgba(67,67,72,0.4)]"
              @click="toggleGroup(item.id)"
            >
              <AppIcon :name="item.icon" :size="16" class="w-[18px] shrink-0" />
              <span class="flex-1 text-[15px]">{{ t(item.labelKey) }}</span>
              <svg
                viewBox="0 0 10 10" width="10" height="10" fill="currentColor"
                class="shrink-0 transition-transform"
                :class="openGroups.has(item.id) ? 'rotate-180' : ''"
              ><path d="M2 3 L5 7 L8 3z"/></svg>
            </button>
            <div v-show="openGroups.has(item.id)">
              <RouterLink
                v-for="child in item.children"
                :key="child.id"
                :to="child.to"
                class="flex items-center gap-3 pl-11 h-10 cursor-pointer text-[14px] text-[#eaeefe] transition-colors border-l-4 border-l-transparent no-underline w-full hover:bg-[rgba(67,67,72,0.4)]"
                active-class="!text-[#ffc510] !border-l-[#ffc510] !bg-[#434348]"
              >
                {{ t(child.labelKey) }}
              </RouterLink>
            </div>
          </div>

          <RouterLink
            v-else
            :to="item.to!"
            class="flex items-center gap-3 px-5 h-12 cursor-pointer text-[15px] text-[#eaeefe] transition-colors border-l-4 border-l-transparent no-underline w-full hover:bg-[rgba(67,67,72,0.4)]"
            :class="isNavActive(item.to!) ? '!text-[#ffc510] !border-l-[#ffc510] !bg-[#434348]' : ''"
          >
            <AppIcon :name="item.icon" :size="16" class="w-[18px] shrink-0" />
            <span class="flex-1 text-[15px]">{{ t(item.labelKey) }}</span>
          </RouterLink>
        </template>
      </nav>
      <div class="py-1 border-t border-[rgba(255,255,255,0.08)]">
        <button
          class="flex items-center gap-3 px-5 h-12 cursor-pointer text-[15px] text-[#eaeefe] transition-colors border-l-4 border-l-transparent no-underline w-full text-left bg-transparent hover:bg-[rgba(67,67,72,0.4)]"
          @click="logout"
        >
          <AppIcon name="tuichu" :size="16" class="w-[18px] shrink-0" />
          <span class="flex-1 text-[15px]">{{ t('logout') }}</span>
        </button>
      </div>
    </aside>

    <!-- Content area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar: shared for desktop and mobile -->
      <header class="h-[60px] bg-[#1d1e1f] flex items-center px-4 gap-4 shrink-0">
        <button
          v-if="isMobile"
          class="flex flex-col gap-[5px] p-1 cursor-pointer bg-transparent border-0"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span class="block w-[22px] h-[2px] bg-white rounded-[1px]" />
          <span class="block w-[22px] h-[2px] bg-white rounded-[1px]" />
          <span class="block w-[22px] h-[2px] bg-white rounded-[1px]" />
        </button>
        <img v-if="isMobile" :src="logoUrl" alt="Plery" class="h-[30px] w-auto brightness-0 invert" />
      </header>

      <main class="flex-1 overflow-y-auto bg-[#f5f5f5] px-4 pt-6 pb-8">
        <RouterView />
      </main>
    </div>

    <!-- Mobile slide-out menu overlay -->
    <Teleport to="body">
      <div v-if="isMobile && mobileMenuOpen" class="fixed inset-0 bg-black/50 z-[1000] flex" @click.self="mobileMenuOpen = false">
        <aside class="w-[230px] min-w-[230px] bg-[#1d1e1f] text-[#eaeefe] flex flex-col overflow-y-auto h-full shrink-0">
          <div class="h-[60px] bg-[#ffc510] flex items-center justify-center shrink-0">
            <img :src="logoUrl" alt="Plery" class="h-9 w-auto" />
          </div>
          <nav class="flex-1">
            <template v-for="item in navItems" :key="item.id">
              <div v-if="item.children">
                <button
                  class="flex items-center gap-3 px-5 h-12 cursor-pointer text-[15px] text-[#eaeefe] transition-colors border-l-4 border-l-transparent no-underline w-full text-left bg-transparent hover:bg-[rgba(67,67,72,0.4)]"
                  @click="toggleGroup(item.id)"
                >
                  <AppIcon :name="item.icon" :size="16" class="w-[18px] shrink-0" />
                  <span class="flex-1 text-[15px]">{{ t(item.labelKey) }}</span>
                  <svg
                    viewBox="0 0 10 10" width="10" height="10" fill="currentColor"
                    class="shrink-0 transition-transform"
                    :class="openGroups.has(item.id) ? 'rotate-180' : ''"
                  ><path d="M2 3 L5 7 L8 3z"/></svg>
                </button>
                <div v-show="openGroups.has(item.id)">
                  <RouterLink
                    v-for="child in item.children"
                    :key="child.id"
                    :to="child.to"
                    class="flex items-center gap-3 pl-11 h-10 cursor-pointer text-[14px] text-[#eaeefe] transition-colors border-l-4 border-l-transparent no-underline w-full hover:bg-[rgba(67,67,72,0.4)]"
                    :class="isNavActive(child.to) ? '!text-[#ffc510] !border-l-[#ffc510] !bg-[#434348]' : ''"
                    @click="mobileMenuOpen = false"
                  >
                    {{ t(child.labelKey) }}
                  </RouterLink>
                </div>
              </div>

              <RouterLink
                v-else
                :to="item.to!"
                class="flex items-center gap-3 px-5 h-12 cursor-pointer text-[15px] text-[#eaeefe] transition-colors border-l-4 border-l-transparent no-underline w-full hover:bg-[rgba(67,67,72,0.4)]"
                active-class="!text-[#ffc510] !border-l-[#ffc510] !bg-[#434348]"
                @click="mobileMenuOpen = false"
              >
                <AppIcon :name="item.icon" :size="16" class="w-[18px] shrink-0" />
                <span class="flex-1 text-[15px]">{{ t(item.labelKey) }}</span>
              </RouterLink>
            </template>
          </nav>
          <div class="py-1 border-t border-[rgba(255,255,255,0.08)]">
            <button
              class="flex items-center gap-3 px-5 h-12 cursor-pointer text-[15px] text-[#eaeefe] transition-colors border-l-4 border-l-transparent no-underline w-full text-left bg-transparent hover:bg-[rgba(67,67,72,0.4)]"
              @click="logout"
            >
              <AppIcon name="tuichu" :size="16" class="w-[18px] shrink-0" />
              <span class="flex-1 text-[15px]">{{ t('logout') }}</span>
            </button>
          </div>
        </aside>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@/composables/useApi'
import AppIcon, { type AppIconName } from '@/components/AppIcon.vue'
import logoUrl from '@/assets/logo.png'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { authLogout } = useApi()

function isNavActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}

// ── Responsive ───────────────────────────────────────────────────────────────
const isMobile = ref(window.innerWidth < 768)
const mobileMenuOpen = ref(false)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// ── Navigation ───────────────────────────────────────────────────────────────
interface NavLeaf  { id: string; labelKey: string; icon: AppIconName; to: string; children?: undefined }
interface NavGroup { id: string; labelKey: string; icon: AppIconName; to?: string; children: NavLeaf[] }
type NavItem = NavLeaf | NavGroup

const navItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'home',    icon: 'hemo',    to: '/dashboard' },
  { id: 'wizard',    labelKey: 'wizard',  icon: 'wizard',  to: '/wizard' },
  {
    id: 'network', labelKey: 'network', icon: 'network',
    children: [
      { id: 'wan',  labelKey: 'wan',      icon: 'wan',     to: '/network/wan' },
      { id: 'lan',  labelKey: 'lan',      icon: 'lan',     to: '/network/lan' },
      { id: 'wifi', labelKey: 'wireless', icon: 'wifi',    to: '/network/wifi' },
      { id: 'dns',     labelKey: 'dns',           icon: 'network', to: '/network/dns' },
      { id: 'clients', labelKey: 'currentdevice', icon: 'yonghuzu', to: '/network/clients' },
    ],
  },
  {
    id: 'system', labelKey: 'system', icon: 'system',
    children: [
      { id: 'firmware', labelKey: 'upgrade',         icon: 'faarrowdown', to: '/system/firmware' },
      { id: 'password', labelKey: 'change_password', icon: 'yonghuzu',    to: '/system/password' },
      { id: 'reboot',   labelKey: 'reboot',          icon: 'system',      to: '/system/reboot' },
    ],
  },
]

function activeGroup(): string | null {
  for (const item of navItems) {
    if (item.children?.some(c => route.path.startsWith(c.to)))
      return item.id
  }
  return null
}

const openGroups = ref<Set<string>>(new Set(activeGroup() ? [activeGroup()!] : []))
function toggleGroup(id: string) {
  if (openGroups.value.has(id)) openGroups.value.delete(id)
  else openGroups.value.add(id)
}

// ── Logout ────────────────────────────────────────────────────────────────────
async function logout() {
  await authLogout().catch(() => {})
  router.push('/login')
}
</script>

