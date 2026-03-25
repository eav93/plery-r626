<template>
  <div class="layout" :class="isMobile ? 'layout--mobile' : 'layout--desktop'">

    <!-- Desktop sidebar -->
    <aside v-if="!isMobile" class="sidebar">
      <div class="sidebar__brand">
        <span class="sidebar__logo">Plery R626</span>
      </div>
      <nav class="sidebar__nav">
        <template v-for="item in navItems" :key="item.id">
          <!-- Top-level with children -->
          <div v-if="item.children" class="nav-group">
            <div
              class="nav-item nav-item--parent"
              :class="{ 'is-open': openGroups.has(item.id) }"
              @click="toggleGroup(item.id)"
            >
              <AppIcon :name="item.icon" class="nav-item__icon" />
              <span class="nav-item__label">{{ t(item.labelKey) }}</span>
              <AppIcon name="chevron_down" :size="14" class="nav-item__arrow" />
            </div>
            <div v-show="openGroups.has(item.id)" class="nav-children">
              <RouterLink
                v-for="child in item.children"
                :key="child.id"
                :to="child.to"
                class="nav-item nav-item--child"
                active-class="is-active"
              >
                {{ t(child.labelKey) }}
              </RouterLink>
            </div>
          </div>

          <!-- Top-level leaf -->
          <RouterLink
            v-else
            :to="item.to!"
            class="nav-item"
            active-class="is-active"
          >
            <AppIcon :name="item.icon" class="nav-item__icon" />
            <span class="nav-item__label">{{ t(item.labelKey) }}</span>
          </RouterLink>
        </template>
      </nav>
      <div class="sidebar__footer">
        <button class="nav-item nav-item--logout" @click="logout">
          <AppIcon name="logout" class="nav-item__icon" />
          <span class="nav-item__label">{{ t('logout') }}</span>
        </button>
      </div>
    </aside>

    <!-- Content area -->
    <div class="content">
      <header class="topbar">
        <h1 class="topbar__title">{{ pageTitle }}</h1>
        <div class="topbar__actions">
          <select class="lang-select" :value="locale" @change="changeLang">
            <option value="en">EN</option>
            <option value="ru">RU</option>
            <option value="cn">中文</option>
          </select>
        </div>
      </header>
      <main class="main">
        <RouterView />
      </main>
    </div>

    <!-- Mobile bottom navigation -->
    <nav v-if="isMobile" class="bottom-nav">
      <RouterLink
        v-for="item in mobileNavItems"
        :key="item.id"
        :to="item.to"
        class="bottom-nav__item"
        active-class="is-active"
      >
        <AppIcon :name="item.icon" :size="22" />
        <span>{{ t(item.labelKey) }}</span>
      </RouterLink>
    </nav>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi'
import AppIcon, { type IconName } from '@/components/AppIcon.vue'

const { t, locale } = useI18n()
const route = useRoute()
const { post } = useApi()

// ── Responsive breakpoint ───────────────────────────────────────────────────
const isMobile = ref(window.innerWidth < 768)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// ── Navigation definition ───────────────────────────────────────────────────
interface NavLeaf   { id: string; labelKey: string; icon: IconName; to: string; children?: undefined }
interface NavGroup  { id: string; labelKey: string; icon: IconName; to?: string; children: NavLeaf[] }
type NavItem = NavLeaf | NavGroup

const navItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'home',    icon: 'dashboard',  to: '/dashboard' },
  {
    id: 'network', labelKey: 'network', icon: 'router',
    children: [
      { id: 'lan',  labelKey: 'lan',      icon: 'lan',    to: '/network/lan' },
      { id: 'wan',  labelKey: 'wan',      icon: 'public', to: '/network/wan' },
      { id: 'wifi', labelKey: 'wireless', icon: 'wifi',   to: '/network/wifi' },
    ],
  },
  {
    id: 'system', labelKey: 'system', icon: 'settings',
    children: [
      { id: 'reboot', labelKey: 'reboot', icon: 'restart_alt', to: '/system/reboot' },
    ],
  },
]

const mobileNavItems: NavLeaf[] = [
  { id: 'dashboard', labelKey: 'home',    icon: 'dashboard', to: '/dashboard' },
  { id: 'lan',       labelKey: 'lan',     icon: 'lan',       to: '/network/lan' },
  { id: 'wan',       labelKey: 'wan',     icon: 'public',    to: '/network/wan' },
  { id: 'wifi',      labelKey: 'wireless',icon: 'wifi',      to: '/network/wifi' },
  { id: 'system',    labelKey: 'system',  icon: 'settings',  to: '/system/reboot' },
]

// ── Sidebar group open/close ────────────────────────────────────────────────
const openGroups = ref<Set<string>>(new Set(['network', 'system']))

function toggleGroup(id: string) {
  if (openGroups.value.has(id)) openGroups.value.delete(id)
  else openGroups.value.add(id)
}

// ── Page title derived from current route ───────────────────────────────────
const routeLabelMap: Record<string, string> = {
  dashboard: 'home', lan: 'lan', wan: 'wan', wifi: 'wireless', reboot: 'reboot',
}
const pageTitle = computed(() => {
  const key = routeLabelMap[route.name as string] ?? ''
  return key ? t(key) : ''
})

// ── Language switch ─────────────────────────────────────────────────────────
function changeLang(e: Event) {
  const lang = (e.target as HTMLSelectElement).value as 'en' | 'ru' | 'cn'
  locale.value = lang
  post('/api/system/language', { language: lang }).catch(() => {})
}

// ── Logout ───────────────────────────────────────────────────────────────────
async function logout() {
  await post('/cgi-bin/logout').catch(() => {})
  window.location.href = '/login.html'
}
</script>

<style scoped>
/* ── Shell ───────────────────────────────────────────────────────────────── */
.layout { display: flex; height: 100vh; overflow: hidden; }
.layout--desktop { flex-direction: row; }
.layout--mobile  { flex-direction: column; }

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: #1a2336;
  color: #c5cdd9;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.sidebar__brand {
  padding: 0 16px;
  height: var(--header-height);
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.sidebar__logo { font-size: 15px; font-weight: 600; color: #fff; }
.sidebar__nav  { flex: 1; padding: 8px 0; }
.sidebar__footer { padding: 8px 0; border-top: 1px solid rgba(255,255,255,.08); }

/* ── Nav items ───────────────────────────────────────────────────────────── */
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  cursor: pointer;
  font-size: 13px;
  color: #c5cdd9;
  transition: background .15s, color .15s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}
.nav-item:hover { background: rgba(255,255,255,.06); color: #fff; }
.nav-item.is-active { background: rgba(0,120,212,.25); color: #fff; }
.nav-item__icon { font-size: 18px; width: 20px; flex-shrink: 0; }
.nav-item__label { flex: 1; }
.nav-item__arrow { font-size: 11px; transition: transform .2s; }
.nav-item--parent.is-open .nav-item__arrow { transform: rotate(180deg); }
.nav-item--child { padding-left: 46px; font-size: 12.5px; }
.nav-item--logout { color: #9ca3af; }
.nav-item--logout:hover { color: #f87171; background: rgba(248,113,113,.08); }

/* ── Content ─────────────────────────────────────────────────────────────── */
.content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.topbar {
  height: var(--header-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  flex-shrink: 0;
}
.topbar__title { font-size: 15px; font-weight: 600; flex: 1; }
.lang-select {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  font-size: 12px;
  cursor: pointer;
}

.main { flex: 1; overflow-y: auto; padding: 20px; }

/* ── Mobile bottom nav ───────────────────────────────────────────────────── */
.bottom-nav {
  display: flex;
  height: var(--nav-bottom-height);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}
.bottom-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 10px;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color .15s;
}
.bottom-nav__item .app-icon { font-size: 22px; }
.bottom-nav__item.is-active { color: var(--color-primary); }

/* Mobile: content takes full height minus bottom nav */
.layout--mobile .content { flex: 1; min-height: 0; }
</style>
