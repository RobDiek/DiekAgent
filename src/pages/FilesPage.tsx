import { useState, useRef } from 'react'
import { Upload, FolderOpen, Send, FileText, Table, X, MessageSquare } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { generateText } from '../lib/ai'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { UploadedFile } from '../types'
import toast from 'react-hot-toast'

interface QAMessage {
  role: 'user' | 'assistant'
  content: string
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((line) =>
    line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')),
  )
  return { headers, rows }
}

export function FilesPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
  const [messages, setMessages] = useState<QAMessage[]>([])
  const [question, setQuestion] = useState('')
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] } | null>(null)

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)

    try {
      let content = ''
      const isSupportedText = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')
      const isUnsupported = file.name.endsWith('.pdf') || file.name.endsWith('.docx')

      if (isSupportedText) {
        content = await file.text()
        if (file.name.endsWith('.csv')) {
          setCsvData(parseCSV(content))
        } else {
          setCsvData(null)
        }
      } else if (isUnsupported) {
        content = `[${file.name}] - This file type is not yet supported for direct parsing. Please convert to TXT or CSV format for full analysis, or type a description of the file content below.`
        toast(`${file.type || file.name.split('.').pop()?.toUpperCase()} files are not yet supported for direct parsing. Please use TXT or CSV.`, { icon: 'ℹ️' })
      } else {
        content = await file.text()
        setCsvData(null)
      }

      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        user_id: user?.id ?? 'demo',
        filename: file.name,
        file_type: file.type || 'unknown',
        file_size: file.size,
        content,
        created_at: new Date().toISOString(),
      }

      if (user) {
        const { data } = await supabase.from('uploaded_files').insert({
          user_id: user.id,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          content: content.slice(0, 50000),
        }).select().single()
        if (data) uploadedFile.id = data.id
      }

      setFiles((prev) => [uploadedFile, ...prev])
      setSelectedFile(uploadedFile)
      setMessages([])
      toast.success(`${file.name} uploaded!`)
    } catch (err) {
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function askQuestion() {
    if (!question.trim() || !selectedFile) return
    const userQ = question.trim()
    setQuestion('')
    setMessages((prev) => [...prev, { role: 'user', content: userQ }])
    setAnalyzing(true)

    const contentSnippet = selectedFile.content?.slice(0, 8000) ?? ''
    const systemPrompt = `You are an expert file analyst. The user has uploaded a file named "${selectedFile.filename}". Here is its content:\n\n${contentSnippet}\n\nAnswer questions about this file accurately and concisely.`

    try {
      const answer = await generateText(userQ, systemPrompt)
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }])
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Failed to analyze the file. Please check your AI configuration.',
      }])
      toast.error('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    if (selectedFile?.id === id) {
      setSelectedFile(null)
      setMessages([])
    }
    toast.success('File removed')
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="File Analysis" subtitle="Upload files and ask questions with AI" />

      <div className="flex flex-1 overflow-hidden">
        {/* File List */}
        <div className="w-64 flex-shrink-0 border-r border-dark-600/50 flex flex-col">
          <div className="p-3 border-b border-dark-600/50">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept=".txt,.csv,.pdf,.docx,.json,.md"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary w-full text-sm"
            >
              {uploading ? <LoadingSpinner size="sm" /> : <><Upload size={14} /> Upload File</>}
            </button>
            <p className="text-xs text-slate-500 mt-2 text-center">TXT, CSV (parsed) • PDF, DOCX (placeholder)</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {files.length === 0 ? (
              <EmptyState
                icon={<FolderOpen size={20} />}
                title="No files"
                description="Upload TXT or CSV to get started"
              />
            ) : (
              <div className="space-y-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => {
                      setSelectedFile(file)
                      if (file.filename.endsWith('.csv') && file.content) {
                        setCsvData(parseCSV(file.content))
                      } else {
                        setCsvData(null)
                      }
                      setMessages([])
                    }}
                    className={`group p-2.5 rounded-xl cursor-pointer transition-colors ${
                      selectedFile?.id === file.id ? 'bg-dark-600' : 'hover:bg-dark-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {file.filename.endsWith('.csv') ? (
                        <Table size={14} className="text-brand-green flex-shrink-0" />
                      ) : (
                        <FileText size={14} className="text-brand-blue flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 truncate">{file.filename}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.file_size)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id) }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedFile ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
              <div className="w-20 h-20 rounded-2xl bg-dark-700 flex items-center justify-center">
                <Upload size={32} className="text-slate-500" />
              </div>
              <h3 className="text-slate-300 font-semibold">Upload a file to analyze</h3>
              <p className="text-slate-500 text-sm text-center max-w-sm">
                Upload TXT or CSV files for full content parsing. Ask questions and get AI-powered insights.
              </p>
              <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
                <Upload size={15} /> Choose File
              </button>
            </div>
          ) : (
            <>
              {/* File preview */}
              <div className="border-b border-dark-600/50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center">
                    {selectedFile.filename.endsWith('.csv') ? (
                      <Table size={16} className="text-brand-green" />
                    ) : (
                      <FileText size={16} className="text-brand-blue" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{selectedFile.filename}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(selectedFile.file_size)}</p>
                  </div>
                </div>

                {csvData ? (
                  <div className="overflow-x-auto max-h-40 rounded-xl border border-dark-500">
                    <table className="w-full text-xs">
                      <thead className="bg-dark-700">
                        <tr>
                          {csvData.headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left text-slate-300 font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.rows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-dark-600/50">
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-1.5 text-slate-400 whitespace-nowrap">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvData.rows.length > 5 && (
                      <p className="text-xs text-slate-600 text-center py-2">
                        Showing 5 of {csvData.rows.length} rows
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-dark-700 rounded-xl p-3 max-h-32 overflow-y-auto">
                    <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                      {selectedFile.content?.slice(0, 500)}
                      {(selectedFile.content?.length ?? 0) > 500 && '...'}
                    </pre>
                  </div>
                )}
              </div>

              {/* Q&A */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare size={24} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Ask questions about this file</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-3">
                      {[
                        'Summarize this file',
                        'What are the key insights?',
                        'List the main topics',
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuestion(q)}
                          className="btn-secondary text-xs py-1"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-brand-blue/20 border border-brand-blue/30 text-slate-200'
                          : 'bg-dark-700 text-slate-300'
                      }`}>
                        {msg.content}
                        {analyzing && i === messages.length - 1 && msg.role === 'user' && (
                          <div className="mt-1"><LoadingSpinner size="sm" /></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {analyzing && <div className="flex justify-start"><LoadingSpinner size="sm" /></div>}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-dark-600/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
                    placeholder="Ask about this file..."
                    className="input-field flex-1 text-sm"
                    disabled={analyzing}
                  />
                  <button
                    onClick={askQuestion}
                    disabled={analyzing || !question.trim()}
                    className="btn-primary px-3"
                  >
                    {analyzing ? <LoadingSpinner size="sm" /> : <Send size={15} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
