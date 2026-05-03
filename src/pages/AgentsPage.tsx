import { useState } from 'react'
import {
  Bot,
  Plus,
  Play,
  Trash2,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { StatusBadge } from '../components/Badge'
import { streamChat, AVAILABLE_MODELS, defaultModel } from '../lib/ai'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Agent, AgentRun, TaskStatus } from '../types'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

const TOOL_OPTIONS = [
  'web_search',
  'code_analysis',
  'file_reader',
  'calculator',
  'data_analysis',
  'summarization',
]

export function AgentsPage() {
  const { user } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [runInput, setRunInput] = useState('')
  const [running, setRunning] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editAgent, setEditAgent] = useState<Agent | null>(null)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    system_prompt: '',
    model: defaultModel,
    allowed_tools: [] as string[],
  })

  function resetForm() {
    setForm({ name: '', description: '', system_prompt: '', model: defaultModel, allowed_tools: [] })
    setEditAgent(null)
  }

  function openNewForm() {
    resetForm()
    setShowForm(true)
  }

  function openEditForm(agent: Agent) {
    setForm({
      name: agent.name,
      description: agent.description,
      system_prompt: agent.system_prompt,
      model: agent.model,
      allowed_tools: agent.allowed_tools,
    })
    setEditAgent(agent)
    setShowForm(true)
  }

  async function saveAgent() {
    if (!form.name.trim() || !form.system_prompt.trim()) return
    const agentData = {
      user_id: user?.id ?? 'demo',
      name: form.name,
      description: form.description,
      system_prompt: form.system_prompt,
      model: form.model,
      allowed_tools: form.allowed_tools,
      created_at: new Date().toISOString(),
    }

    if (editAgent) {
      const updated = { ...editAgent, ...agentData }
      setAgents((prev) => prev.map((a) => (a.id === editAgent.id ? updated : a)))
      if (selectedAgent?.id === editAgent.id) setSelectedAgent(updated)
      if (user) await supabase.from('agents').update(agentData).eq('id', editAgent.id)
      toast.success('Agent updated!')
    } else {
      const newAgent: Agent = { ...agentData, id: Date.now().toString() }
      if (user) {
        const { data } = await supabase.from('agents').insert(agentData).select().single()
        if (data) newAgent.id = data.id
      }
      setAgents((prev) => [newAgent, ...prev])
      setSelectedAgent(newAgent)
      toast.success('Agent created!')
    }
    setShowForm(false)
    resetForm()
  }

  async function deleteAgent(id: string) {
    setAgents((prev) => prev.filter((a) => a.id !== id))
    if (selectedAgent?.id === id) setSelectedAgent(null)
    if (user) await supabase.from('agents').delete().eq('id', id)
    toast.success('Agent deleted')
  }

  async function runAgent() {
    if (!selectedAgent || !runInput.trim()) return
    setRunning(true)
    const input = runInput.trim()
    setRunInput('')

    const run: AgentRun = {
      id: Date.now().toString(),
      agent_id: selectedAgent.id,
      user_id: user?.id ?? 'demo',
      input,
      output: '',
      status: 'running',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setRuns((prev) => [run, ...prev])

    let savedRunId = run.id
    if (user) {
      const { data } = await supabase.from('agent_runs').insert({
        agent_id: selectedAgent.id,
        user_id: user.id,
        input,
        status: 'running',
      }).select().single()
      if (data) savedRunId = data.id
    }

    try {
      let output = ''
      await streamChat(
        [
          { role: 'system', content: selectedAgent.system_prompt },
          { role: 'user', content: input },
        ],
        selectedAgent.model,
        (chunk) => {
          output += chunk
          setRuns((prev) =>
            prev.map((r) => (r.id === run.id ? { ...r, output } : r)),
          )
        },
      )

      const completed: AgentRun = { ...run, id: savedRunId, output, status: 'completed' }
      setRuns((prev) => prev.map((r) => (r.id === run.id ? completed : r)))
      if (user) {
        await supabase.from('agent_runs').update({ output, status: 'completed' }).eq('id', savedRunId)
      }
      setExpandedRun(run.id)
      toast.success('Agent task complete!')
    } catch {
      const failed: AgentRun = { ...run, id: savedRunId, status: 'failed', error: 'Agent run failed' }
      setRuns((prev) => prev.map((r) => (r.id === run.id ? failed : r)))
      toast.error('Agent run failed')
    } finally {
      setRunning(false)
    }
  }

  function toggleTool(tool: string) {
    setForm((prev) => ({
      ...prev,
      allowed_tools: prev.allowed_tools.includes(tool)
        ? prev.allowed_tools.filter((t) => t !== tool)
        : [...prev.allowed_tools, tool],
    }))
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Agent Builder"
        subtitle="Create and run custom AI agents"
        actions={
          <button onClick={openNewForm} className="btn-primary text-sm">
            <Plus size={14} /> New Agent
          </button>
        }
      />

      {/* Agent Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editAgent ? 'Edit Agent' : 'Create Agent'}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm() }} className="btn-ghost p-1">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="input-field"
                    placeholder="Code Reviewer"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Model</label>
                  <select
                    value={form.model}
                    onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                    className="input-field"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="input-field"
                  placeholder="What does this agent do?"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">System Prompt *</label>
                <textarea
                  value={form.system_prompt}
                  onChange={(e) => setForm((p) => ({ ...p, system_prompt: e.target.value }))}
                  className="input-field resize-none h-32"
                  placeholder="You are an expert... Your role is to..."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Allowed Tools</label>
                <div className="flex flex-wrap gap-2">
                  {TOOL_OPTIONS.map((tool) => (
                    <button
                      key={tool}
                      onClick={() => toggleTool(tool)}
                      className={`px-3 py-1 rounded-lg text-xs border transition-all ${
                        form.allowed_tools.includes(tool)
                          ? 'bg-brand-blue/20 border-brand-blue/50 text-brand-blue'
                          : 'bg-dark-700 border-dark-500 text-slate-400 hover:border-dark-400'
                      }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowForm(false); resetForm() }} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={saveAgent}
                  disabled={!form.name.trim() || !form.system_prompt.trim()}
                  className="btn-primary flex-1"
                >
                  {editAgent ? 'Update Agent' : 'Create Agent'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Agent List */}
        <div className="w-64 flex-shrink-0 border-r border-dark-600/50 overflow-y-auto p-3">
          {agents.length === 0 ? (
            <EmptyState
              icon={<Bot size={20} />}
              title="No agents"
              description="Create your first custom AI agent"
              action={
                <button onClick={openNewForm} className="btn-primary text-xs">
                  <Plus size={12} /> Create
                </button>
              }
            />
          ) : (
            <div className="space-y-1">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`group p-2.5 rounded-xl cursor-pointer transition-colors ${
                    selectedAgent?.id === agent.id ? 'bg-dark-600' : 'hover:bg-dark-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 font-medium truncate">{agent.name}</p>
                      <p className="text-xs text-slate-500 truncate">{agent.description}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{agent.model}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button onClick={(e) => { e.stopPropagation(); openEditForm(agent) }} className="p-1 text-slate-500 hover:text-slate-300">
                        <Settings size={11} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteAgent(agent.id) }} className="p-1 text-slate-500 hover:text-red-400">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Detail & Runs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedAgent ? (
            <EmptyState
              icon={<Bot size={28} />}
              title="Select an agent"
              description="Choose an agent to run tasks or create a new one."
            />
          ) : (
            <>
              {/* Agent Info */}
              <div className="p-4 border-b border-dark-600/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center flex-shrink-0">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{selectedAgent.name}</h3>
                    <p className="text-sm text-slate-400">{selectedAgent.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="badge bg-dark-600 text-slate-400">{selectedAgent.model}</span>
                      {selectedAgent.allowed_tools.map((tool) => (
                        <span key={tool} className="badge bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => openEditForm(selectedAgent)} className="btn-ghost p-2">
                    <Settings size={15} />
                  </button>
                </div>

                {/* Run Input */}
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={runInput}
                    onChange={(e) => setRunInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runAgent()}
                    placeholder={`Give ${selectedAgent.name} a task...`}
                    className="input-field flex-1 text-sm"
                    disabled={running}
                  />
                  <button
                    onClick={runAgent}
                    disabled={running || !runInput.trim()}
                    className="btn-primary px-4"
                  >
                    {running ? <LoadingSpinner size="sm" /> : <><Play size={14} /> Run</>}
                  </button>
                </div>
              </div>

              {/* Runs */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {runs.filter((r) => r.agent_id === selectedAgent.id).length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">No runs yet. Give the agent a task above.</p>
                ) : (
                  runs
                    .filter((r) => r.agent_id === selectedAgent.id)
                    .map((run) => (
                      <Card key={run.id} className="overflow-hidden">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                        >
                          <div className="flex items-center gap-3">
                            <StatusBadge status={run.status} />
                            <p className="text-sm text-slate-300 truncate max-w-xs">{run.input}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{formatDate(run.created_at)}</span>
                            {expandedRun === run.id ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                          </div>
                        </div>
                        {expandedRun === run.id && run.output && (
                          <div className="mt-3 pt-3 border-t border-dark-600/50">
                            <p className="text-xs text-slate-500 mb-2">Output:</p>
                            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {run.status === 'running' && !run.output ? (
                                <LoadingSpinner size="sm" />
                              ) : run.output}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
