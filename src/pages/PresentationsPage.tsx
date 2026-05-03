import { useState } from 'react'
import { Presentation, Plus, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { generateText } from '../lib/ai'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Presentation as PresentationType, Slide } from '../types'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

const SLIDES_SYSTEM_PROMPT = `Create a presentation in JSON format for the given topic. Return ONLY a valid JSON object:
{
  "title": "Presentation Title",
  "slides": [
    {
      "id": 1,
      "title": "Slide Title",
      "bullets": ["Point 1", "Point 2", "Point 3"],
      "notes": "Speaker notes for this slide"
    }
  ]
}
Generate 6-8 slides: title slide, agenda, 3-4 content slides, conclusion, Q&A. No markdown code blocks, just JSON.`

export function PresentationsPage() {
  const { user } = useAuth()
  const [presentations, setPresentations] = useState<PresentationType[]>([])
  const [selected, setSelected] = useState<PresentationType | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [topic, setTopic] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  async function generatePresentation() {
    if (!topic.trim()) return
    setGenerating(true)
    try {
      const raw = await generateText(topic, SLIDES_SYSTEM_PROMPT)
      const parsed = JSON.parse(raw)
      const pres: PresentationType = {
        id: Date.now().toString(),
        user_id: user?.id ?? 'demo',
        title: parsed.title,
        topic,
        slides: parsed.slides,
        created_at: new Date().toISOString(),
      }
      if (user) {
        const { data } = await supabase.from('presentations').insert({
          user_id: user.id,
          title: parsed.title,
          topic,
          slides: parsed.slides,
        }).select().single()
        if (data) pres.id = data.id
      }
      setPresentations((prev) => [pres, ...prev])
      setSelected(pres)
      setCurrentSlide(0)
      setShowForm(false)
      setTopic('')
      toast.success('Presentation created!')
    } catch {
      toast.error('Failed to generate presentation')
    } finally {
      setGenerating(false)
    }
  }

  function exportJSON() {
    if (!selected) return
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected.title.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function deletePresentation(id: string) {
    setPresentations((prev) => prev.filter((p) => p.id !== id))
    if (selected?.id === id) setSelected(null)
    if (user) supabase.from('presentations').delete().eq('id', id)
    toast.success('Deleted')
  }

  const slide = selected?.slides[currentSlide]

  const SLIDE_COLORS = [
    'from-brand-blue/30 to-dark-700',
    'from-purple-600/20 to-dark-700',
    'from-emerald-600/20 to-dark-700',
    'from-pink-600/20 to-dark-700',
    'from-orange-600/20 to-dark-700',
    'from-cyan-600/20 to-dark-700',
  ]

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Presentation Generator"
        subtitle="Create stunning slide decks with AI"
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus size={14} /> New Presentation
          </button>
        }
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">New Presentation</h3>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field resize-none h-28 mb-4"
              placeholder="Topic or title for your presentation…&#10;e.g. 'The Future of Renewable Energy'"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={generatePresentation} disabled={generating || !topic.trim()} className="btn-primary flex-1">
                {generating ? <LoadingSpinner size="sm" /> : 'Generate Slides'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar list */}
        <div className="w-60 flex-shrink-0 border-r border-dark-600/50 overflow-y-auto p-3">
          {presentations.length === 0 ? (
            <EmptyState
              icon={<Presentation size={20} />}
              title="No presentations"
              action={
                <button onClick={() => setShowForm(true)} className="btn-primary text-xs">
                  <Plus size={12} /> Create
                </button>
              }
            />
          ) : (
            <div className="space-y-1">
              {presentations.map((pres) => (
                <div
                  key={pres.id}
                  onClick={() => { setSelected(pres); setCurrentSlide(0) }}
                  className={`group p-2.5 rounded-xl cursor-pointer transition-colors ${
                    selected?.id === pres.id ? 'bg-dark-600' : 'hover:bg-dark-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate font-medium">{pres.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{pres.slides.length} slides • {formatDate(pres.created_at)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePresentation(pres.id) }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slide viewer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <EmptyState
              icon={<Presentation size={28} />}
              title="No presentation selected"
              description="Create a new presentation or select one from the list."
            />
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-600/50">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-white truncate">{selected.title}</h3>
                  <span className="text-xs text-slate-500">{selected.slides.length} slides</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className={`btn-ghost text-xs py-1 px-2 ${showNotes ? 'text-brand-blue' : ''}`}
                  >
                    Notes
                  </button>
                  <button onClick={exportJSON} className="btn-secondary text-xs py-1.5 px-3">
                    <Download size={12} /> Export JSON
                  </button>
                </div>
              </div>

              {/* Current Slide */}
              <div className="flex-1 overflow-y-auto p-6">
                {slide && (
                  <div className="max-w-3xl mx-auto space-y-4">
                    {/* Main slide */}
                    <div className={`rounded-2xl bg-gradient-to-br ${SLIDE_COLORS[currentSlide % SLIDE_COLORS.length]} border border-dark-500/50 p-8 min-h-64 flex flex-col justify-center`}>
                      <div className="text-xs text-slate-400 mb-4 font-mono">
                        Slide {currentSlide + 1} / {selected.slides.length}
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-6">{slide.title}</h2>
                      <ul className="space-y-3">
                        {slide.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-2 flex-shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Speaker notes */}
                    {showNotes && slide.notes && (
                      <Card className="bg-dark-700/40">
                        <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Speaker Notes</p>
                        <p className="text-sm text-slate-300">{slide.notes}</p>
                      </Card>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentSlide((c) => Math.max(0, c - 1))}
                        disabled={currentSlide === 0}
                        className="btn-secondary"
                      >
                        <ChevronLeft size={16} /> Previous
                      </button>
                      <div className="flex gap-1.5">
                        {selected.slides.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === currentSlide ? 'bg-brand-blue w-4' : 'bg-dark-500 hover:bg-dark-400'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentSlide((c) => Math.min(selected.slides.length - 1, c + 1))}
                        disabled={currentSlide === selected.slides.length - 1}
                        className="btn-secondary"
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Slide thumbnails */}
                    <div>
                      <p className="text-xs text-slate-500 mb-3 font-medium">All Slides</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {selected.slides.map((s, i) => (
                          <button
                            key={s.id}
                            onClick={() => setCurrentSlide(i)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              i === currentSlide
                                ? 'border-brand-blue bg-brand-blue/10'
                                : 'border-dark-500 bg-dark-700 hover:border-dark-400'
                            }`}
                          >
                            <p className="text-xs text-slate-400 font-medium truncate">{s.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{i + 1}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
