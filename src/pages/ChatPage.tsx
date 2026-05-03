import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Send,
  Plus,
  Paperclip,
  ChevronDown,
  MessageSquare,
  Trash2,
  Copy,
  Check,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TopBar } from '../components/TopBar'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import { streamChat, AVAILABLE_MODELS, defaultModel, type Message as AIMessage } from '../lib/ai'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ConversationItem {
  id: string
  title: string
  created_at: string
}

export function ChatPage() {
  const { id: convId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState(defaultModel)
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [currentConvId, setCurrentConvId] = useState<string | null>(convId || null)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (convId) {
      setCurrentConvId(convId)
      loadMessages(convId)
    }
  }, [convId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    if (!user) return
    const { data } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setConversations(data)
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (data) {
      setMessages(data.map((m) => ({ id: m.id, role: m.role, content: m.content })))
    }
  }

  async function createConversation(firstMessage: string) {
    if (!user) return null
    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '...' : '')
    const { data } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title, model })
      .select()
      .single()
    return data?.id ?? null
  }

  async function saveMessage(conversationId: string, role: string, content: string) {
    await supabase.from('messages').insert({ conversation_id: conversationId, role, content })
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return
    const userContent = input.trim()
    setInput('')

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    let convId = currentConvId
    if (!convId) {
      convId = await createConversation(userContent)
      if (convId) {
        setCurrentConvId(convId)
        navigate(`/chat/${convId}`, { replace: true })
      }
    }

    if (convId) await saveMessage(convId, 'user', userContent)

    const assistantId = (Date.now() + 1).toString()
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    const aiMessages: AIMessage[] = [
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: userContent },
    ]

    let fullResponse = ''
    try {
      await streamChat(
        aiMessages,
        model,
        (chunk) => {
          fullResponse += chunk
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: fullResponse } : m)),
          )
        },
      )
      if (convId) await saveMessage(convId, 'assistant', fullResponse)
    } catch (err: unknown) {
      const errorMsg = 'Failed to get AI response. Check your API configuration in Settings.'
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: errorMsg } : m)),
      )
      toast.error('AI request failed')
    } finally {
      setLoading(false)
      if (convId) loadConversations()
    }
  }, [input, loading, model, currentConvId, navigate, user])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function startNewChat() {
    setMessages([])
    setCurrentConvId(null)
    navigate('/chat')
  }

  async function deleteConversation(id: string) {
    await supabase.from('conversations').delete().eq('id', id)
    if (currentConvId === id) startNewChat()
    loadConversations()
    toast.success('Conversation deleted')
  }

  async function copyMessage(id: string, content: string) {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className="w-56 flex-shrink-0 bg-dark-800/40 border-r border-dark-600/50 flex flex-col">
        <div className="p-3 border-b border-dark-600/50">
          <button onClick={startNewChat} className="btn-primary w-full text-xs py-2">
            <Plus size={14} />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors',
                currentConvId === conv.id ? 'bg-dark-600 text-white' : 'text-slate-400 hover:bg-dark-700',
              )}
              onClick={() => navigate(`/chat/${conv.id}`)}
            >
              <MessageSquare size={12} className="flex-shrink-0" />
              <span className="flex-1 text-xs truncate">{conv.title}</span>
              <button
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400"
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">No conversations yet</p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title="AI Chat"
          actions={
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
              >
                {AVAILABLE_MODELS.find((m) => m.id === model)?.label ?? model}
                <ChevronDown size={12} />
              </button>
              {showModelPicker && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-dark-700 border border-dark-500 rounded-xl shadow-glass z-20 overflow-hidden">
                  {AVAILABLE_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setModel(m.id); setShowModelPicker(false) }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs hover:bg-dark-600 transition-colors',
                        model === m.id ? 'text-brand-green' : 'text-slate-300',
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          }
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={24} />}
              title="Start a conversation"
              description="Ask anything – the AI will respond in real time with streaming."
            />
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 animate-fade-in',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center flex-shrink-0 self-start mt-0.5">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                )}
                <div className={cn(
                  'group max-w-[80%] rounded-2xl px-4 py-3',
                  msg.role === 'user'
                    ? 'bg-brand-blue/20 border border-brand-blue/30 text-slate-200'
                    : 'bg-dark-700 border border-dark-600 text-slate-200',
                )}>
                  {msg.content === '' && msg.role === 'assistant' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                  <button
                    onClick={() => copyMessage(msg.id, msg.content)}
                    className="opacity-0 group-hover:opacity-100 mt-2 text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-opacity"
                  >
                    {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                    {copiedId === msg.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center flex-shrink-0 self-start mt-0.5">
                    <span className="text-slate-400 text-xs font-bold">U</span>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-dark-600/50">
          <div className="flex items-end gap-2 bg-dark-700 border border-dark-500 rounded-2xl px-4 py-3 focus-within:border-brand-blue/50 transition-colors">
            <button className="btn-ghost p-1 self-end mb-0.5">
              <Paperclip size={16} />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message DiekAI... (Enter to send, Shift+Enter for new line)"
              className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 resize-none outline-none text-sm max-h-32 min-h-[24px]"
              rows={1}
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn-primary p-2 self-end"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
