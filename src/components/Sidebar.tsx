import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  Search,
  FileText,
  Presentation,
  FolderOpen,
  Bot,
  ListTodo,
  Settings,
  Zap,
  LogOut,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/research', icon: Search, label: 'Research Agent' },
  { to: '/documents', icon: FileText, label: 'Document Generator' },
  { to: '/presentations', icon: Presentation, label: 'Presentations' },
  { to: '/files', icon: FolderOpen, label: 'File Analysis' },
  { to: '/agents', icon: Bot, label: 'Agent Builder' },
  { to: '/tasks', icon: ListTodo, label: 'Task Center' },
]

export function Sidebar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-dark-800/80 backdrop-blur-md border-r border-dark-600/50 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-dark-600/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-blue">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">DiekAI</h1>
            <p className="text-xs text-slate-500">Workbench</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn('sidebar-item', isActive && 'active')
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-dark-600/50 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn('sidebar-item', isActive && 'active')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
        <button className="sidebar-item w-full" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
