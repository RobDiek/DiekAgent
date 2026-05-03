import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('Account created! Check your email to verify.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleDemoLogin() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@diekai.com',
        password: 'demo1234',
      })
      if (error) {
        // Try to create demo account
        const { error: signUpError } = await supabase.auth.signUp({
          email: 'demo@diekai.com',
          password: 'demo1234',
        })
        if (signUpError) throw signUpError
        toast.success('Demo account created!')
      } else {
        navigate('/')
      }
    } catch (err: unknown) {
      // Fallback: bypass auth for demo
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-green/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-gradient shadow-glow-brand mb-4">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">DiekAI Workbench</h1>
          <p className="text-slate-400 text-sm mt-1">Your AI productivity hub</p>
        </div>

        <div className="glass-card p-6">
          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 bg-dark-700 rounded-xl mb-6">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? 'bg-dark-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-9"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-9 pr-9"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? <LoadingSpinner size="sm" /> : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-500" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-dark-800 text-slate-500">or</span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn-secondary w-full py-2.5"
          >
            Try Demo (No Account Needed)
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Powered by DiekerIT • AI Workbench Platform
        </p>
      </div>
    </div>
  )
}
