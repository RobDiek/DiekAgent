import { useState } from 'react'
import {
  ListTodo,
  Search,
  FileText,
  Presentation,
  Bot,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { Card } from '../components/Card'
import { StatusBadge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import type { TaskItem, TaskStatus } from '../types'
import { formatDate } from '../lib/utils'

const TYPE_ICONS: Record<string, React.ElementType> = {
  research: Search,
  document: FileText,
  presentation: Presentation,
  agent_run: Bot,
}

const MOCK_TASKS: TaskItem[] = [
  {
    id: '1',
    type: 'research',
    title: 'AI in Healthcare Research',
    status: 'completed',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'document',
    title: 'Q4 Strategy Blog Post',
    status: 'completed',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'presentation',
    title: 'Product Roadmap 2025',
    status: 'completed',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'agent_run',
    title: 'Code Review: auth module',
    status: 'failed',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'research',
    title: 'Blockchain use cases',
    status: 'running',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
]

const TYPE_LABELS: Record<string, string> = {
  research: 'Research',
  document: 'Document',
  presentation: 'Presentation',
  agent_run: 'Agent Run',
}

export function TasksPage() {
  const [tasks] = useState<TaskItem[]>(MOCK_TASKS)
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = tasks.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterType !== 'all' && t.type !== filterType) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    all: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    running: tasks.filter((t) => t.status === 'running').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Task Center"
        subtitle="Monitor all AI tasks in one place"
        actions={
          <button className="btn-ghost p-2" title="Refresh">
            <RefreshCw size={16} />
          </button>
        }
      />

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: counts.all, color: 'text-slate-300' },
            { label: 'Completed', value: counts.completed, color: 'text-brand-green' },
            { label: 'Running', value: counts.running, color: 'text-brand-blue' },
            { label: 'Failed', value: counts.failed, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 text-sm"
              placeholder="Search tasks..."
            />
          </div>

          <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-dark-600/50">
            {(['all', 'completed', 'running', 'failed', 'pending'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs capitalize transition-all ${
                  filterStatus === s ? 'bg-dark-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-dark-600/50">
            {(['all', 'research', 'document', 'presentation', 'agent_run']).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1.5 rounded-lg text-xs capitalize transition-all ${
                  filterType === type ? 'bg-dark-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {type === 'all' ? 'All Types' : TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ListTodo size={24} />}
            title="No tasks found"
            description="Try adjusting your filters or start a new task from any module."
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => {
              const Icon = TYPE_ICONS[task.type] ?? ListTodo
              return (
                <Card key={task.id} hover className="group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0 group-hover:bg-dark-600 transition-colors">
                      <Icon size={16} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                        <span className="badge bg-dark-600 text-slate-500 hidden sm:inline-flex">
                          {TYPE_LABELS[task.type]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(task.created_at)}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
