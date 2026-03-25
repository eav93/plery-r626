import { ref } from 'vue'

export type NotifyType = 'success' | 'error' | 'info'

interface Notification {
  id: number
  type: NotifyType
  message: string
}

const notifications = ref<Notification[]>([])
let seq = 0

export function useNotify() {
  function show(message: string, type: NotifyType = 'info', duration = 3000) {
    const id = ++seq
    notifications.value.push({ id, type, message })
    setTimeout(() => {
      notifications.value = notifications.value.filter(n => n.id !== id)
    }, duration)
  }

  const success = (msg: string) => show(msg, 'success')
  const error   = (msg: string) => show(msg, 'error', 4000)

  return { notifications, show, success, error }
}
