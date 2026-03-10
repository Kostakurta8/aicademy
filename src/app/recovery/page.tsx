'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { AlertTriangle, Download, Trash2, RefreshCw, Copy } from 'lucide-react'

export default function RecoveryPage() {
  const [confirmReset, setConfirmReset] = useState('')

  const exportRawData = () => {
    try {
      const data: Record<string, unknown> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) || '')
          } catch {
            data[key] = localStorage.getItem(key)
          }
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aicademy-recovery-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Export failed: ' + (e as Error).message)
    }
  }

  const clearLocalStorage = () => {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && !key.startsWith('aicademy-progress') && !key.startsWith('aicademy-xp') && !key.startsWith('aicademy-flashcard')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  const clearAll = () => {
    if (confirmReset !== 'RESET') return
    localStorage.clear()
    const req = indexedDB.deleteDatabase('aicademy')
    req.onsuccess = () => window.location.href = '/'
    req.onerror = () => {
      alert('Failed to clear IndexedDB. Try clearing your browser data manually.')
    }
  }

  const copyDiagnostics = () => {
    const info = {
      appVersion: '0.1.0',
      userAgent: navigator.userAgent,
      localStorageKeys: Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)),
      localStorageSize: new Blob(Object.values(localStorage)).size,
      indexedDB: 'available' in window ? 'Available' : 'Not available',
      timestamp: new Date().toISOString(),
    }
    navigator.clipboard.writeText(JSON.stringify(info, null, 2))
      .then(() => alert('Diagnostics copied to clipboard'))
      .catch(() => alert('Failed to copy'))
  }

  return (
    <div className="min-h-screen bg-surface p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <AlertTriangle size={32} className="text-gold" />
        <h1 className="text-2xl font-bold text-text-primary">Recovery Mode</h1>
      </div>

      <div className="bg-surface-raised border border-border-subtle rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-3">What happened?</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          If the main app crashed or isn&apos;t loading correctly, it could be due to corrupted
          data in your browser storage. Use the tools below to recover or reset.
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={exportRawData}
          className="w-full flex items-center gap-3 p-4 bg-surface-raised border border-border-subtle rounded-xl hover:bg-border-subtle/30 transition-colors text-left cursor-pointer"
        >
          <Download size={20} className="text-blue shrink-0" />
          <div>
            <p className="font-medium text-text-primary">Export Raw Data</p>
            <p className="text-sm text-text-muted">Download all localStorage data as JSON for backup.</p>
          </div>
        </button>

        <button
          onClick={copyDiagnostics}
          className="w-full flex items-center gap-3 p-4 bg-surface-raised border border-border-subtle rounded-xl hover:bg-border-subtle/30 transition-colors text-left cursor-pointer"
        >
          <Copy size={20} className="text-accent shrink-0" />
          <div>
            <p className="font-medium text-text-primary">Copy Diagnostics</p>
            <p className="text-sm text-text-muted">Copy system info to clipboard for bug reports.</p>
          </div>
        </button>

        <button
          onClick={clearLocalStorage}
          className="w-full flex items-center gap-3 p-4 bg-surface-raised border border-gold/20 rounded-xl hover:bg-border-subtle/30 transition-colors text-left cursor-pointer"
        >
          <RefreshCw size={20} className="text-gold shrink-0" />
          <div>
            <p className="font-medium text-text-primary">Clear Settings Only</p>
            <p className="text-sm text-text-muted">Reset preferences and settings. Keeps lesson data.</p>
          </div>
        </button>

        <div className="bg-surface-raised border border-red/20 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 size={20} className="text-red shrink-0" />
            <div>
              <p className="font-medium text-text-primary">Full Data Reset</p>
              <p className="text-sm text-text-muted">Delete ALL data including progress, XP, and flashcards.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder='Type "RESET" to confirm'
              value={confirmReset}
              onChange={(e) => setConfirmReset(e.target.value)}
              className="flex-1 px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-red"
            />
            <Button
              variant="danger"
              size="sm"
              onClick={clearAll}
              disabled={confirmReset !== 'RESET'}
            >
              Reset Everything
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-accent hover:text-accent/80 text-sm font-medium transition-colors"
        >
          ← Return to App
        </Link>
      </div>
    </div>
  )
}
