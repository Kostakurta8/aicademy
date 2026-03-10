import { create } from 'zustand'

interface Toast {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  duration: number
  dismissible: boolean
  createdAt: number
}

interface NotificationStore {
  toasts: Toast[]
  maxVisible: number
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
}

let toastCounter = 0

export const useNotificationStore = create<NotificationStore>()((set) => ({
  toasts: [],
  maxVisible: 3,

  addToast: (toast) => {
    const id = `toast-${++toastCounter}-${Date.now()}`
    const newToast: Toast = { ...toast, id, createdAt: Date.now() }
    set((s) => ({ toasts: [...s.toasts, newToast] }))

    if (toast.duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, toast.duration)
    }

    return id
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clearAll: () => set({ toasts: [] }),
}))

// Convenience hook
export function useToast() {
  const addToast = useNotificationStore((s) => s.addToast)

  return {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message, duration: 4000, dismissible: true }),
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message, duration: 8000, dismissible: true }),
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message, duration: 6000, dismissible: true }),
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message, duration: 4000, dismissible: true }),
  }
}
