import { useRouter } from 'vue-router'

function authGuard(r: Response) {
  if (r.status === 401) {
    // Redirect to login on session expiry
    window.location.href = '/login.html'
  }
  return r
}

export function useApi() {
  async function get<T = unknown>(path: string): Promise<T> {
    const r = await fetch(path, { cache: 'no-store' })
    authGuard(r)
    return r.json()
  }

  async function post<T = unknown>(path: string, data?: unknown): Promise<T> {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data ?? {}),
    })
    authGuard(r)
    return r.json()
  }

  /** GET /api/uci?get=<comma-separated paths>
   *  Returns flat object: { "package.section.option": "value", ... }
   */
  function uciGet(paths: string | string[]) {
    const q = Array.isArray(paths) ? paths.join(',') : paths
    return get<Record<string, string>>(`/api/uci?get=${encodeURIComponent(q)}`)
  }

  /** POST /api/uci/set  { "package.section.option": "value", ... } */
  function uciSet(obj: Record<string, string>) {
    return post<{ result: string }>('/api/uci/set', obj)
  }

  function apiAction(action: string, data?: unknown) {
    return post<{ result: string }>(`/api/action/${action}`, data)
  }

  return { get, post, uciGet, uciSet, apiAction }
}
