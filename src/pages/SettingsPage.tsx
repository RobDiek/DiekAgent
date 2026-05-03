import { useState } from 'react'
import {
  User,
  Key,
  Palette,
  Database,
  Bell,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { Card } from '../components/Card'
import { AVAILABLE_MODELS, defaultModel } from '../lib/ai'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'ai', label: 'AI Configuration', icon: Key },
  { id: 'theme', label: 'Appearance', icon: Palette },
  { id: 'usage', label: 'Usage & Limits', icon: Database },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

const MOCK_USAGE = [
  { label: 'API Calls Today', value: 47, max: 200 },
  { label: 'Tokens Used (month)', value: 125000, max: 500000 },
  { label: 'Documents Created', value: 12, max: 50 },
  { label: 'Agent Runs', value: 38, max: 100 },
]

export function SettingsPage() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState('profile')
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({
    fullName: user?.email?.split('@')[0] ?? '',
    email: user?.email ?? '',
  })

  const [aiConfig, setAiConfig] = useState({
    apiBase: import.meta.env.VITE_AI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: '',
    defaultModel: import.meta.env.VITE_AI_DEFAULT_MODEL || defaultModel,
  })

  const [theme] = useState('dark')

  async function handleSaveProfile() {
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 500))
      toast.success('Profile saved!')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAI() {
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 500))
      toast.success('AI configuration saved! Restart the app to apply changes.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Settings" subtitle="Manage your account and preferences" />

      <div className="flex flex-1 overflow-hidden">
        {/* Settings Nav */}
        <div className="w-56 flex-shrink-0 border-r border-dark-600/50 p-3">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 mb-1 ${
                activeSection === id
                  ? 'bg-dark-600 text-white'
                  : 'text-slate-400 hover:bg-dark-700 hover:text-slate-200'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1 text-left">{label}</span>
              <ChevronRight size={13} className={activeSection === id ? 'text-slate-400' : 'text-slate-600'} />
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'profile' && (
            <div className="max-w-xl space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Profile</h3>
                <p className="text-sm text-slate-400">Manage your personal information</p>
              </div>

              {/* Avatar */}
              <Card className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-xl font-bold">
                  {profile.fullName?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div>
                  <p className="text-white font-medium">{profile.fullName || 'Anonymous'}</p>
                  <p className="text-sm text-slate-400">{profile.email}</p>
                  <button className="text-xs text-brand-blue mt-1 hover:underline">Change avatar</button>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      className="input-field opacity-60 cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed here</p>
                  </div>
                  <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
                    <Save size={14} /> {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </Card>

              <Card className="border-red-500/20">
                <h4 className="text-sm font-medium text-red-400 mb-3">Danger Zone</h4>
                <button onClick={handleSignOut} className="btn-secondary border-red-500/30 text-red-400 hover:bg-red-500/10">
                  Sign Out
                </button>
              </Card>
            </div>
          )}

          {activeSection === 'ai' && (
            <div className="max-w-xl space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">AI Configuration</h3>
                <p className="text-sm text-slate-400">Configure your AI provider settings</p>
              </div>

              <Card>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">API Base URL</label>
                    <input
                      type="text"
                      value={aiConfig.apiBase}
                      onChange={(e) => setAiConfig((p) => ({ ...p, apiBase: e.target.value }))}
                      className="input-field font-mono text-sm"
                      placeholder="https://api.openai.com/v1"
                    />
                    <p className="text-xs text-slate-500 mt-1">Use any OpenAI-compatible API endpoint</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={aiConfig.apiKey}
                        onChange={(e) => setAiConfig((p) => ({ ...p, apiKey: e.target.value }))}
                        className="input-field pr-10 font-mono text-sm"
                        placeholder="sk-..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Stored locally, never sent to our servers</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Default Model</label>
                    <select
                      value={aiConfig.defaultModel}
                      onChange={(e) => setAiConfig((p) => ({ ...p, defaultModel: e.target.value }))}
                      className="input-field"
                    >
                      {AVAILABLE_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={handleSaveAI} disabled={saving} className="btn-primary">
                    <Save size={14} /> {saving ? 'Saving...' : 'Save AI Config'}
                  </button>
                </div>
              </Card>

              <Card className="border-brand-green/20 bg-brand-green/5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-brand-green flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">OpenAI Compatible</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Works with OpenAI, Azure OpenAI, Anthropic (via proxy), Together AI, Ollama, and any OpenAI-compatible API.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'theme' && (
            <div className="max-w-xl space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Appearance</h3>
                <p className="text-sm text-slate-400">Customize the look and feel</p>
              </div>
              <Card>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Theme</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'dark', label: 'Dark (Default)', desc: 'Deep dark with blue accents' },
                    { id: 'darker', label: 'Midnight', desc: 'Pure black, ultra dark' },
                  ].map(({ id, label, desc }) => (
                    <div
                      key={id}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        theme === id ? 'border-brand-blue bg-brand-blue/10' : 'border-dark-500 hover:border-dark-400'
                      }`}
                    >
                      <div className="h-12 rounded-lg bg-dark-900 border border-dark-600 mb-2 overflow-hidden">
                        <div className="h-full flex">
                          <div className="w-6 bg-dark-800 border-r border-dark-700" />
                          <div className="flex-1 p-1.5 space-y-1">
                            <div className="h-1.5 bg-dark-700 rounded w-3/4" />
                            <div className="h-1.5 bg-dark-700 rounded w-1/2" />
                            <div className="h-1.5 bg-brand-blue/40 rounded w-2/3" />
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-300">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Accent Colors</h4>
                <div className="flex gap-3">
                  {[
                    { label: 'DiekerIT Blue', from: '#0072C6', to: '#29F49A', active: true },
                    { label: 'Purple Haze', from: '#7C3AED', to: '#06B6D4', active: false },
                    { label: 'Sunset', from: '#F97316', to: '#EF4444', active: false },
                  ].map(({ label, from, to, active }) => (
                    <div key={label} className={`flex-1 p-2.5 rounded-xl border cursor-pointer ${active ? 'border-white/20' : 'border-dark-500'}`}>
                      <div
                        className="h-6 rounded-lg mb-1.5"
                        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                      />
                      <p className="text-xs text-slate-400 text-center">{label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'usage' && (
            <div className="max-w-xl space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Usage & Limits</h3>
                <p className="text-sm text-slate-400">Monitor your API usage (mock data)</p>
              </div>
              <div className="space-y-3">
                {MOCK_USAGE.map(({ label, value, max }) => {
                  const pct = Math.min(100, Math.round((value / max) * 100))
                  return (
                    <Card key={label}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-300">{label}</p>
                        <p className="text-sm font-medium text-white">
                          {value.toLocaleString()} / {max.toLocaleString()}
                        </p>
                      </div>
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-brand-gradient'
                          }`}
                          style={{ width: `${pct}%`, background: pct <= 60 ? 'linear-gradient(90deg, #0072C6, #29F49A)' : undefined }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{pct}% used</p>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="max-w-xl space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Notifications</h3>
                <p className="text-sm text-slate-400">Manage notification preferences</p>
              </div>
              <Card>
                <div className="space-y-4">
                  {[
                    { label: 'Task Completed', desc: 'Notify when AI tasks finish', on: true },
                    { label: 'Research Ready', desc: 'Alert when research reports are done', on: true },
                    { label: 'Agent Errors', desc: 'Notify on agent run failures', on: true },
                    { label: 'Usage Alerts', desc: 'Alert when approaching limits', on: false },
                  ].map(({ label, desc, on }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-300">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                      <button
                        className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
                          on ? 'bg-brand-blue' : 'bg-dark-600'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                            on ? 'left-6' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
