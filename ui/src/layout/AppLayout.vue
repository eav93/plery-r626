<template>
  <div class="layout" :class="isMobile ? 'layout--mobile' : 'layout--desktop'">

    <!-- Desktop sidebar -->
    <aside v-if="!isMobile" class="sidebar">
      <div class="sidebar__brand">
        <img :src="logoUrl" alt="Plery" class="sidebar__logo" />
      </div>
      <nav class="sidebar__nav">
        <template v-for="item in navItems" :key="item.id">
          <div v-if="item.children" class="nav-group">
            <div
              class="nav-item nav-item--parent"
              :class="{ 'is-open': openGroups.has(item.id) }"
              @click="toggleGroup(item.id)"
            >
              <AppIcon :name="item.icon" :size="16" class="nav-item__icon" />
              <span class="nav-item__label">{{ t(item.labelKey) }}</span>
              <AppIcon name="chevron_down" :size="12" class="nav-item__arrow" />
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

          <RouterLink
            v-else
            :to="item.to!"
            class="nav-item"
            active-class="is-active"
          >
            <AppIcon :name="item.icon" :size="16" class="nav-item__icon" />
            <span class="nav-item__label">{{ t(item.labelKey) }}</span>
          </RouterLink>
        </template>
      </nav>
      <div class="sidebar__footer">
        <button class="nav-item nav-item--logout" @click="logout">
          <AppIcon name="logout" :size="16" class="nav-item__icon" />
          <span class="nav-item__label">{{ t('logout') }}</span>
        </button>
      </div>
    </aside>

    <!-- Content area -->
    <div class="content">
      <!-- Desktop topbar -->
      <header v-if="!isMobile" class="topbar topbar--desktop">
        <span class="topbar__title">{{ t('global_title') }}</span>
        <button class="topbar__logout" @click="logout">
          <AppIcon name="logout" :size="16" />
          <span>{{ t('logout') }}</span>
        </button>
      </header>

      <!-- Mobile topbar with hamburger -->
      <header v-if="isMobile" class="topbar topbar--mobile">
        <button class="hamburger" @click="mobileMenuOpen = !mobileMenuOpen">
          <span /><span /><span />
        </button>
        <img :src="logoUrl" alt="Plery" class="topbar__logo" />
      </header>

      <main class="main">
        <RouterView />
      </main>
    </div>

    <!-- Mobile slide-out menu overlay -->
    <Teleport to="body">
      <div v-if="isMobile && mobileMenuOpen" class="mobile-overlay" @click.self="mobileMenuOpen = false">
        <aside class="mobile-drawer">
          <div class="sidebar__brand">
            <img :src="logoUrl" alt="Plery" class="sidebar__logo" />
          </div>
          <nav class="sidebar__nav">
            <template v-for="item in navItems" :key="item.id">
              <div v-if="item.children" class="nav-group">
                <div
                  class="nav-item nav-item--parent"
                  :class="{ 'is-open': openGroups.has(item.id) }"
                  @click="toggleGroup(item.id)"
                >
                  <AppIcon :name="item.icon" :size="16" class="nav-item__icon" />
                  <span class="nav-item__label">{{ t(item.labelKey) }}</span>
                  <AppIcon name="chevron_down" :size="12" class="nav-item__arrow" />
                </div>
                <div v-show="openGroups.has(item.id)" class="nav-children">
                  <RouterLink
                    v-for="child in item.children"
                    :key="child.id"
                    :to="child.to"
                    class="nav-item nav-item--child"
                    active-class="is-active"
                    @click="mobileMenuOpen = false"
                  >
                    {{ t(child.labelKey) }}
                  </RouterLink>
                </div>
              </div>

              <RouterLink
                v-else
                :to="item.to!"
                class="nav-item"
                active-class="is-active"
                @click="mobileMenuOpen = false"
              >
                <AppIcon :name="item.icon" :size="16" class="nav-item__icon" />
                <span class="nav-item__label">{{ t(item.labelKey) }}</span>
              </RouterLink>
            </template>
          </nav>
          <div class="sidebar__footer">
            <button class="nav-item nav-item--logout" @click="logout">
              <AppIcon name="logout" :size="16" class="nav-item__icon" />
              <span class="nav-item__label">{{ t('logout') }}</span>
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
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import AppIcon, { type IconName } from '@/components/AppIcon.vue'
import logoUrl from '@/assets/logo.png'

const { t } = useI18n()
const router = useRouter()
const { authLogout } = useApi()

// ── Responsive ───────────────────────────────────────────────────────────────
const isMobile = ref(window.innerWidth < 768)
const mobileMenuOpen = ref(false)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// ── Navigation ───────────────────────────────────────────────────────────────
interface NavLeaf  { id: string; labelKey: string; icon: IconName; to: string; children?: undefined }
interface NavGroup { id: string; labelKey: string; icon: IconName; to?: string; children: NavLeaf[] }
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

const openGroups = ref<Set<string>>(new Set(['network', 'system']))
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

<style scoped>
/* ── Shell ───────────────────────────────────────────────────────────────── */
.layout { display: flex; height: 100vh; overflow: hidden; }
.layout--desktop { flex-direction: row; }
.layout--mobile  { flex-direction: column; }

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
.sidebar, .mobile-drawer {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
}

.sidebar__brand {
  height: var(--header-height);
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sidebar__logo { height: 36px; width: auto; }
.sidebar__nav  { flex: 1; padding: 0; }
.sidebar__footer {
  padding: 4px 0 8px;
  border-top: 1px solid rgba(255,255,255,.08);
}

/* ── Nav items ───────────────────────────────────────────────────────────── */
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  height: 48px;
  line-height: 48px;
  cursor: pointer;
  font-size: 15px;
  color: var(--sidebar-text);
  transition: background .2s, color .2s;
  border: none;
  border-left: 4px solid transparent;
  background: none;
  width: 100%;
  text-align: left;
  box-sizing: border-box;
  white-space: nowrap;
  text-decoration: none;
}
.nav-item:hover { background: var(--sidebar-hover-bg); }
.nav-item.is-active {
  color: var(--color-accent);
  border-left-color: var(--color-accent);
  background: var(--sidebar-active-bg);
}
.nav-item__icon { width: 18px; flex-shrink: 0; }
.nav-item__label { flex: 1; font-size: 15px; }
.nav-item__arrow { transition: transform .2s; flex-shrink: 0; }
.nav-item--parent.is-open .nav-item__arrow { transform: rotate(180deg); }
.nav-item--child { padding-left: 44px; font-size: 14px; font-weight: 400; height: 40px; line-height: 40px; }
.nav-item--logout { color: var(--sidebar-text); }
.nav-item--logout:hover { color: #ff8c00; }

/* ── Content ─────────────────────────────────────────────────────────────── */
.content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.main { flex: 1; overflow-y: auto; background: var(--color-bg); }

/* ── Desktop topbar ──────────────────────────────────────────────────────── */
.topbar--desktop {
  height: var(--header-height);
  background: var(--sidebar-bg);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
  flex-shrink: 0;
  color: var(--sidebar-text);
}
.topbar__title {
  flex: 1;
  font-size: 14px;
  color: #aaa;
  letter-spacing: .5px;
}
.topbar__logout {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--sidebar-text);
  font-size: 14px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 6px 10px;
  border-radius: var(--radius);
  transition: color .2s;
}
.topbar__logout:hover { color: #ff8c00; }

/* ── Mobile topbar ───────────────────────────────────────────────────────── */
.topbar--mobile {
  height: var(--header-height);
  background: var(--sidebar-bg);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
  flex-shrink: 0;
}
.topbar__logo { height: 30px; width: auto; filter: brightness(0) invert(1); }

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 4px;
  cursor: pointer;
  background: none;
  border: none;
}
.hamburger span {
  display: block;
  width: 22px;
  height: 2px;
  background: #fff;
  border-radius: 1px;
}

/* ── Mobile overlay + drawer ─────────────────────────────────────────────── */
.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  z-index: 1000;
  display: flex;
}
.mobile-drawer {
  height: 100vh;
  flex-shrink: 0;
}
</style>
