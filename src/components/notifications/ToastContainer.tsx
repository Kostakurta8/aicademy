'use client'

import { useNotificationStore } from '@/stores/notification-store'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'border-green/30 bg-green/5',
  error: 'border-red/30 bg-red/5',
  warning: 'border-gold/30 bg-gold/5',
  info: 'border-blue/30 bg-blue/5',
}

const iconColors = {
  success: 'text-green',
  error: 'text-red',
  warning: 'text-gold',
  info: 'text-blue',
}

export default function ToastContainer() {
  const toasts = useNotificationStore((s) => s.toasts)
  const maxVisible = useNotificationStore((s) => s.maxVisible)
  const removeToast = useNotificationStore((s) => s.removeToast)

  const visible = toasts.slice(-maxVisible)

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      role="status"
      aria-live="polite"
      aria-label="Notifications"
    >
        {visible.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <div
              key={toast.id}
              className={`
                animate-fade-in pointer-events-auto
                flex items-start gap-3 p-4 rounded-xl
                border backdrop-blur-md shadow-lg
                bg-surface ${colors[toast.type]}
              `}
            >
              <Icon size={18} className={`${iconColors[toast.type]} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-text-secondary mt-0.5">{toast.message}</p>
                )}
              </div>
              {toast.dismissible && (
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-md text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )
        })}
    </div>
  )
}
