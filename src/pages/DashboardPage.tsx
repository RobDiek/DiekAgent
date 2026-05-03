import { useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Search,
  FileText,
  Presentation,
  FolderOpen,
  Bot,
  ListTodo,
  ArrowRight,
  Zap,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { Card, StatCard } from '../components/Card'
import { useAuth } from '../hooks/useAuth'

const quickActions = [
  { label: 'New Chat', icon: MessageSquare, to: '/chat', color: 'from-brand-blue/20 to-brand-blue/5', border: 'border-brand-blue/30' },
  { label: 'Research Topic', icon: Search, to: '/research', color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/30' },
  { label: 'Generate Doc', icon: FileText, to: '/documents', color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/30' },
  { label: 'Build Agent', icon: Bot, to: '/agents', color: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/30' },
  { label: 'Create Slides', icon: Presentation, to: '/presentations', color: 'from-pink-500/20 to-pink-500/5', border: 'border-pink-500/30' },
  { label: 'Analyze File', icon: FolderOpen, to: '/files', color: 'from-cyan-500/20 to-cyan-500/5', border: 'border-cyan-500/30' },
]

const recentActivities = [
  { icon: MessageSquare, text: 'Started chat: "Explain microservices"', time: '2m ago', type: 'chat' },
  { icon: Search, text: 'Research: "AI trends 2024"', time: '1h ago', type: 'research' },
  { icon: FileText, text: 'Document: "Q4 Project Proposal"', time: '3h ago', type: 'doc' },
  { icon: Bot, text: 'Agent run: Code Reviewer', time: '5h ago', type: 'agent' },
  { icon: Presentation, text: 'Presentation: "Product Roadmap"', time: '1d ago', type: 'slides' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const displayName = user?.email?.split('@')[0] ?? 'there'

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Dashboard"
        subtitle={`Welcome back, ${displayName}!`}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Chats"
            value="24"
            subtitle="3 this week"
            icon={<MessageSquare size={20} className="text-white" />}
            gradient
          />
          <StatCard
            title="Documents"
            value="12"
            subtitle="2 in progress"
            icon={<FileText size={20} className="text-slate-400" />}
          />
          <StatCard
            title="Agent Runs"
            value="38"
            subtitle="5 today"
            icon={<Bot size={20} className="text-slate-400" />}
          />
          <StatCard
            title="Tasks Done"
            value="91%"
            subtitle="Success rate"
            icon={<TrendingUp size={20} className="text-slate-400" />}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
            <Zap size={16} className="text-brand-green" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map(({ label, icon: Icon, to, color, border }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`glass-card p-4 flex flex-col items-center gap-3 cursor-pointer hover:scale-105 transition-all duration-200 bg-gradient-to-br ${color} border ${border}`}
              >
                <Icon size={22} className="text-slate-300" />
                <span className="text-xs text-slate-400 text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
              <Clock size={16} className="text-brand-green" />
              Recent Activity
            </h3>
            <Card>
              <div className="space-y-3">
                {recentActivities.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-dark-600/50 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
                      <item.icon size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">{item.text}</p>
                      <p className="text-xs text-slate-500">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Active Modules */}
          <div>
            <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
              <ListTodo size={16} className="text-brand-green" />
              Modules
            </h3>
            <Card>
              <div className="space-y-2">
                {[
                  { icon: MessageSquare, label: 'AI Chat', to: '/chat' },
                  { icon: Search, label: 'Research', to: '/research' },
                  { icon: FileText, label: 'Documents', to: '/documents' },
                  { icon: Presentation, label: 'Presentations', to: '/presentations' },
                  { icon: FolderOpen, label: 'File Analysis', to: '/files' },
                  { icon: Bot, label: 'Agents', to: '/agents' },
                ].map(({ icon: Icon, label, to }) => (
                  <button
                    key={to}
                    onClick={() => navigate(to)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-700 transition-colors group"
                  >
                    <Icon size={16} className="text-slate-500 group-hover:text-brand-blue transition-colors" />
                    <span className="flex-1 text-sm text-slate-400 text-left">{label}</span>
                    <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
