import { useState } from 'react'
import { Search, Plus, ChevronRight, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TopBar } from '../components/TopBar'
import { Card } from '../components/Card'
import { StatusBadge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { generateText } from '../lib/ai'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { ResearchTask, ResearchResult, TaskStatus } from '../types'
import toast from 'react-hot-toast'

const RESEARCH_SYSTEM_PROMPT = `You are an expert research analyst. When given a topic, produce a structured research report in the following JSON format exactly:
{
  "summary": "2-3 sentence overview",
  "key_findings": ["finding 1", "finding 2", "finding 3", "finding 4"],
  "pros": ["pro 1", "pro 2", "pro 3"],
  "cons": ["con 1", "con 2"],
  "risks": ["risk 1", "risk 2"],
  "recommendation": "A clear actionable recommendation paragraph"
}
Return ONLY valid JSON, no markdown code blocks.`

export function ResearchPage() {
  const { user } = useAuth()
  const [topic, setTopic] = useState('')
  const [tasks, setTasks] = useState<ResearchTask[]>([])
  const [selectedTask, setSelectedTask] = useState<ResearchTask | null>(null)
  const [loading, setLoading] = useState(false)

  async function runResearch() {
    if (!topic.trim()) return
    setLoading(true)

    const newTask: ResearchTask = {
      id: Date.now().toString(),
      user_id: user?.id ?? 'demo',
      topic: topic.trim(),
      status: 'running',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setTasks((prev) => [newTask, ...prev])
    setTopic('')

    let savedId = newTask.id
    if (user) {
      const { data } = await supabase.from('research_tasks').insert({
        user_id: user.id,
        topic: newTask.topic,
        status: 'running',
      }).select().single()
      if (data) savedId = data.id
    }

    try {
      const raw = await generateText(
        `Research topic: ${newTask.topic}`,
        RESEARCH_SYSTEM_PROMPT,
      )
      const result: ResearchResult = JSON.parse(raw)

      if (user) {
        await supabase.from('research_tasks').update({
          status: 'completed',
          result,
          updated_at: new Date().toISOString(),
        }).eq('id', savedId)
      }

      const completed = { ...newTask, id: savedId, status: 'completed' as TaskStatus, result }
      setTasks((prev) => prev.map((t) => (t.id === newTask.id ? completed : t)))
      setSelectedTask(completed)
      toast.success('Research completed!')
    } catch (err) {
      const failed = { ...newTask, id: savedId, status: 'failed' as TaskStatus, error: 'Failed to generate research report' }
      setTasks((prev) => prev.map((t) => (t.id === newTask.id ? failed : t)))
      toast.error('Research failed. Check AI configuration.')
    } finally {
      setLoading(false)
    }
  }

  function statusIcon(status: TaskStatus) {
    if (status === 'completed') return <CheckCircle2 size={14} className="text-brand-green" />
    if (status === 'failed') return <XCircle size={14} className="text-red-400" />
    if (status === 'running') return <Loader2 size={14} className="text-brand-blue animate-spin" />
    return <Clock size={14} className="text-slate-500" />
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Research Agent" subtitle="AI-powered deep research on any topic" />

      <div className="flex-1 flex gap-0">
        {/* Left: Input + Task List */}
        <div className="w-80 flex-shrink-0 border-r border-dark-600/50 flex flex-col">
          <div className="p-4 border-b border-dark-600/50">
            <h3 className="text-sm font-medium text-slate-300 mb-3">New Research</h3>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field resize-none h-24 text-sm"
              placeholder="Enter a topic to research…&#10;e.g. 'Impact of AI on healthcare'"
            />
            <button
              onClick={runResearch}
              disabled={loading || !topic.trim()}
              className="btn-primary w-full mt-3"
            >
              {loading ? <LoadingSpinner size="sm" /> : <><Search size={15} /> Research</>}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-xs text-slate-500 mb-2 px-1">History ({tasks.length})</p>
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-8">No research tasks yet</p>
            ) : (
              <div className="space-y-1">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-start gap-2 ${
                      selectedTask?.id === task.id ? 'bg-dark-600' : 'hover:bg-dark-700'
                    }`}
                  >
                    <span className="mt-0.5">{statusIcon(task.status)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate">{task.topic}</p>
                      <StatusBadge status={task.status} />
                    </div>
                    <ChevronRight size={12} className="text-slate-600 mt-0.5 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Result */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedTask ? (
            <EmptyState
              icon={<Search size={28} />}
              title="No research selected"
              description="Start a new research task or select one from the history."
            />
          ) : selectedTask.status === 'running' ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-slate-400">Researching: {selectedTask.topic}</p>
            </div>
          ) : selectedTask.status === 'failed' ? (
            <div className="flex flex-col items-center justify-center h-64">
              <XCircle size={32} className="text-red-400 mb-3" />
              <p className="text-slate-300 font-medium">Research failed</p>
              <p className="text-slate-500 text-sm mt-1">{selectedTask.error}</p>
            </div>
          ) : selectedTask.result ? (
            <ResearchResult topic={selectedTask.topic} result={selectedTask.result} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ResearchResult({ topic, result }: { topic: string; result: ResearchResult }) {
  return (
    <div className="space-y-5 max-w-3xl animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">{topic}</h2>
        <p className="text-slate-400 text-sm">Research Report</p>
      </div>

      <Card className="border-brand-blue/20">
        <h3 className="text-sm font-semibold text-brand-blue mb-2 flex items-center gap-2">
          <Search size={14} /> Summary
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">🔑 Key Findings</h3>
          <ul className="space-y-2">
            {result.key_findings.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-400">
                <span className="text-brand-green font-bold flex-shrink-0">{i + 1}.</span>
                {f}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-green-400 mb-2">✅ Pros</h3>
            <ul className="space-y-1">
              {result.pros.map((p, i) => (
                <li key={i} className="text-sm text-slate-400 flex gap-2">
                  <span className="text-green-500">+</span> {p}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-red-400 mb-2">❌ Cons</h3>
            <ul className="space-y-1">
              {result.cons.map((c, i) => (
                <li key={i} className="text-sm text-slate-400 flex gap-2">
                  <span className="text-red-400">−</span> {c}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="border-yellow-500/20">
        <h3 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Risks</h3>
        <ul className="space-y-1">
          {result.risks.map((r, i) => (
            <li key={i} className="text-sm text-slate-400 flex gap-2">
              <span className="text-yellow-500">!</span> {r}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="border-brand-green/20 bg-brand-green/5">
        <h3 className="text-sm font-semibold text-brand-green mb-2">💡 Recommendation</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{result.recommendation}</p>
      </Card>
    </div>
  )
}
