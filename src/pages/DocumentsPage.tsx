import { useState, useEffect } from 'react'
import { FileText, Plus, Save, Download, Trash2, ChevronDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TopBar } from '../components/TopBar'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Badge } from '../components/Badge'
import { generateText } from '../lib/ai'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Document, DocumentType } from '../types'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

const DOC_TYPES: { value: DocumentType; label: string; description: string }[] = [
  { value: 'blog', label: 'Blog Post', description: 'SEO-friendly article' },
  { value: 'email', label: 'Email', description: 'Professional email draft' },
  { value: 'technical_concept', label: 'Technical Concept', description: 'Architecture/design doc' },
  { value: 'proposal', label: 'Proposal', description: 'Business/project proposal' },
  { value: 'comparison', label: 'Comparison', description: 'Side-by-side analysis' },
  { value: 'meeting_summary', label: 'Meeting Summary', description: 'Action items & notes' },
]

const SYSTEM_PROMPTS: Record<DocumentType, string> = {
  blog: 'Write a well-structured, engaging blog post in Markdown format with H2/H3 headers, an introduction, main sections, and a conclusion. Make it SEO-friendly and informative.',
  email: 'Write a professional email in Markdown. Include: Subject line, greeting, clear body paragraphs, call-to-action, and sign-off.',
  technical_concept: 'Write a technical concept document in Markdown with sections: Overview, Problem Statement, Proposed Solution, Architecture, Implementation Steps, Tradeoffs, and Conclusion.',
  proposal: 'Write a business proposal in Markdown with sections: Executive Summary, Problem Statement, Proposed Solution, Benefits, Timeline, Budget Estimate, and Next Steps.',
  comparison: 'Write a comparison document in Markdown with a clear introduction, comparison table (using | syntax), detailed analysis of each option, and a recommendation.',
  meeting_summary: 'Write a meeting summary in Markdown with sections: Meeting Info, Attendees, Agenda, Key Discussions, Decisions Made, Action Items (with owners), and Next Steps.',
}

export function DocumentsPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [editContent, setEditContent] = useState('')
  const [preview, setPreview] = useState(true)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTopic, setNewTopic] = useState('')
  const [newType, setNewType] = useState<DocumentType>('blog')
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => { loadDocuments() }, [user])

  async function loadDocuments() {
    if (!user) return
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setDocuments(data)
  }

  async function generateDocument() {
    if (!newTopic.trim() || !newTitle.trim()) return
    setGenerating(true)
    const typeLabel = DOC_TYPES.find((t) => t.value === newType)?.label ?? newType
    try {
      const content = await generateText(
        `Create a ${typeLabel} about: ${newTopic}`,
        SYSTEM_PROMPTS[newType],
      )
      const doc: Document = {
        id: Date.now().toString(),
        user_id: user?.id ?? 'demo',
        title: newTitle,
        type: newType,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      if (user) {
        const { data } = await supabase.from('documents').insert({
          user_id: user.id,
          title: newTitle,
          type: newType,
          content,
        }).select().single()
        if (data) doc.id = data.id
      }
      setDocuments((prev) => [doc, ...prev])
      setSelectedDoc(doc)
      setEditContent(content)
      setShowNewForm(false)
      setNewTopic('')
      setNewTitle('')
      toast.success('Document generated!')
    } catch {
      toast.error('Failed to generate document')
    } finally {
      setGenerating(false)
    }
  }

  async function saveDocument() {
    if (!selectedDoc) return
    const updated = { ...selectedDoc, content: editContent, updated_at: new Date().toISOString() }
    setDocuments((prev) => prev.map((d) => (d.id === selectedDoc.id ? updated : d)))
    setSelectedDoc(updated)
    if (user) {
      await supabase.from('documents').update({ content: editContent }).eq('id', selectedDoc.id)
    }
    toast.success('Saved!')
  }

  async function deleteDocument(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    if (selectedDoc?.id === id) setSelectedDoc(null)
    if (user) await supabase.from('documents').delete().eq('id', id)
    toast.success('Deleted')
  }

  function downloadDocument(doc: Document) {
    const blob = new Blob([doc.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title.replace(/\s+/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function selectDocument(doc: Document) {
    setSelectedDoc(doc)
    setEditContent(doc.content)
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Document Generator"
        subtitle="AI-powered document creation"
        actions={
          <button onClick={() => setShowNewForm(true)} className="btn-primary text-sm">
            <Plus size={14} /> New Document
          </button>
        }
      />

      {/* New Document Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">New Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Document Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Q4 Strategy Blog Post"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {DOC_TYPES.map(({ value, label, description }) => (
                    <button
                      key={value}
                      onClick={() => setNewType(value)}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                        newType === value
                          ? 'border-brand-blue/50 bg-brand-blue/10 text-white'
                          : 'border-dark-500 bg-dark-700 text-slate-400 hover:border-dark-400'
                      }`}
                    >
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs opacity-60 mt-0.5">{description}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Topic / Description</label>
                <textarea
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="input-field resize-none h-20"
                  placeholder="Describe what you want the document to cover..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowNewForm(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={generateDocument}
                  disabled={generating || !newTopic.trim() || !newTitle.trim()}
                  className="btn-primary flex-1"
                >
                  {generating ? <LoadingSpinner size="sm" /> : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Doc List */}
        <div className="w-64 flex-shrink-0 border-r border-dark-600/50 overflow-y-auto p-3">
          {documents.length === 0 ? (
            <EmptyState
              icon={<FileText size={20} />}
              title="No documents"
              description="Create your first document"
              action={
                <button onClick={() => setShowNewForm(true)} className="btn-primary text-xs">
                  <Plus size={12} /> New
                </button>
              }
            />
          ) : (
            <div className="space-y-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => selectDocument(doc)}
                  className={`group p-2.5 rounded-xl cursor-pointer transition-colors ${
                    selectedDoc?.id === doc.id ? 'bg-dark-600' : 'hover:bg-dark-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 font-medium truncate">{doc.title}</p>
                      <Badge variant="info" className="mt-1 text-xs">
                        {DOC_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(doc.created_at)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id) }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedDoc ? (
            <EmptyState
              icon={<FileText size={28} />}
              title="Select a document"
              description="Choose a document from the list or create a new one."
            />
          ) : (
            <>
              {/* Editor Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-600/50 bg-dark-800/30">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-white">{selectedDoc.title}</h3>
                  <Badge variant="info">
                    {DOC_TYPES.find((t) => t.value === selectedDoc.type)?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 p-1 bg-dark-700 rounded-lg">
                    <button
                      onClick={() => setPreview(false)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${!preview ? 'bg-dark-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setPreview(true)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${preview ? 'bg-dark-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Preview
                    </button>
                  </div>
                  <button onClick={() => downloadDocument(selectedDoc)} className="btn-ghost p-2">
                    <Download size={14} />
                  </button>
                  <button onClick={saveDocument} className="btn-primary py-1.5 px-3 text-xs">
                    <Save size={13} /> Save
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {preview ? (
                  <div className="max-w-3xl mx-auto prose prose-invert prose-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{editContent}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full bg-transparent text-slate-200 font-mono text-sm outline-none resize-none leading-relaxed min-h-96"
                    placeholder="Document content..."
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
