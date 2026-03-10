'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useThemeStore } from '@/stores/theme-store'
import { useUserStore } from '@/stores/user-store'
import { useAIStore } from '@/stores/ai-store'
import { checkAIHealth } from '@/lib/ai/groq-client'
import {
  Moon, Sun, Eye, Monitor,
  User, Palette, Database, Cpu,
  Download, Upload, Trash2, Check,
  Wifi, WifiOff, RefreshCw,
  Info, GraduationCap,
} from 'lucide-react'

const themes = [
  { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
  { id: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright' },
  { id: 'high-contrast', label: 'High Contrast', icon: Eye, desc: 'Maximum accessibility' },
  { id: 'system', label: 'System', icon: Monitor, desc: 'Match OS preference' },
] as const

const avatars = ['🧑‍💻', '👩‍🔬', '🧙‍♂️', '🤖', '🦊', '🐱', '🌟', '🎯']

export default function SettingsPage() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const userName = useUserStore((s) => s.name)
  const setName = useUserStore((s) => s.setName)
  const avatar = useUserStore((s) => s.avatar)
  const setAvatar = useUserStore((s) => s.setAvatar)
  const groqApiKey = useUserStore((s) => s.groqApiKey)
  const setGroqApiKey = useUserStore((s) => s.setGroqApiKey)
  const aiHealthy = useAIStore((s) => s.aiHealthy)
  const installedModels = useAIStore((s) => s.installedModels)
  const selectedModel = useAIStore((s) => s.selectedModel)
  const setSelectedModel = useAIStore((s) => s.setSelectedModel)
  const setAIHealth = useAIStore((s) => s.setAIHealth)
  const selectedTrack = useUserStore((s) => s.selectedTrack)
  const setSelectedTrack = useUserStore((s) => s.setSelectedTrack)
  const soundEnabled = useUserStore((s) => s.soundEnabled)
  const setSoundEnabled = useUserStore((s) => s.setSoundEnabled)

  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState('')
  const [exportDone, setExportDone] = useState(false)

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setTestResult(null)
    const { healthy, models, error } = await checkAIHealth()
    setAIHealth(healthy, models)
    setTestResult(healthy ? `✅ Connected! ${models.length} model(s) available.` : `❌ ${error || 'Connection failed'}`)
    setTestingConnection(false)
  }

  const handleExport = () => {
    const data: Record<string, unknown> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('aicademy')) {
        try { data[key] = JSON.parse(localStorage.getItem(key) || '') }
        catch { data[key] = localStorage.getItem(key) }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aicademy-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 3000)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
        }
        window.location.reload()
      } catch {
        alert('Invalid backup file.')
      }
    }
    input.click()
  }

  const handleReset = () => {
    if (confirmReset !== 'RESET') return
    localStorage.clear()
    window.location.href = '/'
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
        <p className="text-text-secondary">Customize your AIcademy experience.</p>
      </div>

      {/* Profile */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><User size={18} /> Profile</h2>
        <Card padding="md">
          <div className="space-y-4">
            <Input label="Display Name" value={userName} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-2">Avatar</label>
              <div className="flex gap-2 flex-wrap">
                {avatars.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                      avatar === a ? 'ring-2 ring-accent bg-accent/10 scale-110' : 'bg-surface-raised hover:bg-border-subtle/30'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Appearance */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><Palette size={18} /> Appearance</h2>
        <Card padding="md">
          <div className="grid grid-cols-2 gap-3">
            {themes.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    theme === t.id ? 'border-accent bg-accent/10 ring-2 ring-accent' : 'border-border-subtle bg-surface-raised hover:border-accent/50'
                  }`}
                >
                  <Icon size={18} className={theme === t.id ? 'text-accent' : 'text-text-muted'} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">{t.label}</p>
                    <p className="text-xs text-text-muted">{t.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </section>

      {/* Groq AI */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><Cpu size={18} /> Groq AI Configuration</h2>
        <Card padding="md">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              {aiHealthy ? (
                <span className="flex items-center gap-2 text-sm text-green"><Wifi size={14} /> Connected</span>
              ) : (
                <span className="flex items-center gap-2 text-sm text-red"><WifiOff size={14} /> Not configured</span>
              )}
            </div>

            <Input
              label="Groq API Key"
              type="password"
              value={groqApiKey}
              onChange={(e) => setGroqApiKey(e.target.value)}
              placeholder="gsk_..."
            />

            <div className="flex gap-2">
              <Button onClick={handleTestConnection} loading={testingConnection} icon={<RefreshCw size={14} />} variant="secondary" size="sm">
                Test Connection
              </Button>
            </div>

            {testResult && (
              <p className="text-sm text-text-secondary">{testResult}</p>
            )}

            {installedModels.length > 0 && (
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Default Model</label>
                <div className="flex flex-wrap gap-2">
                  {installedModels.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedModel(m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        selectedModel === m ? 'bg-accent text-white' : 'bg-surface-raised text-text-secondary hover:bg-border-subtle/30'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Learning Track */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><GraduationCap size={18} /> Learning Track</h2>
        <Card padding="md">
          <p className="text-sm text-text-secondary mb-3">Choose a track to customize your learning journey.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'student', label: '🎓 Student', desc: 'New to AI — start with theory and foundations' },
              { id: 'professional', label: '💼 Professional', desc: 'Apply AI in your work — focus on tools and ethics' },
              { id: 'builder', label: '🛠️ Builder', desc: 'Build with AI — APIs, agents, and projects' },
            ].map(track => (
              <button key={track.id}
                onClick={() => setSelectedTrack(selectedTrack === track.id ? null : track.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedTrack === track.id
                    ? 'border-accent bg-accent/10 ring-2 ring-accent'
                    : 'border-border-subtle bg-surface-raised hover:border-accent/50'
                }`}
              >
                <p className="text-sm font-medium text-text-primary">{track.label}</p>
                <p className="text-xs text-text-muted mt-1">{track.desc}</p>
              </button>
            ))}
          </div>
        </Card>
      </section>

      {/* Sound */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">🔊 Sound</h2>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Sound Effects</p>
              <p className="text-xs text-text-muted">XP dings, level-up sounds, and quiz feedback</p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative ${soundEnabled ? 'bg-accent' : 'bg-surface-raised border border-border-subtle'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${soundEnabled ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>
        </Card>
      </section>

      {/* Data Management */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><Database size={18} /> Data Management</h2>
        <Card padding="md">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button onClick={handleExport} variant="secondary" icon={exportDone ? <Check size={14} /> : <Download size={14} />}>
                {exportDone ? 'Exported!' : 'Export Backup'}
              </Button>
              <Button onClick={handleImport} variant="secondary" icon={<Upload size={14} />}>
                Import Backup
              </Button>
            </div>

            <div className="border-t border-border-subtle pt-4">
              <div className="flex items-start gap-2 mb-3">
                <Trash2 size={16} className="text-red shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Reset All Data</p>
                  <p className="text-xs text-text-muted">This will delete all progress, settings, and conversations.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder='Type "RESET" to confirm'
                  value={confirmReset}
                  onChange={(e) => setConfirmReset(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-red"
                />
                <Button variant="danger" size="sm" onClick={handleReset} disabled={confirmReset !== 'RESET'}>
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* About */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><Info size={18} /> About</h2>
        <Card padding="md">
          <div className="space-y-2 text-sm text-text-secondary">
            <p><strong className="text-text-primary">AIcademy</strong> v0.1.0</p>
            <p>AI Literacy Learning Platform</p>
            <p>Built with Next.js 16, Tailwind CSS 4, Zustand, Motion, and Groq AI.</p>
            <p className="text-xs text-text-muted mt-3">© 2026 AIcademy. All rights reserved.</p>
          </div>
        </Card>
      </section>
    </div>
  )
}
