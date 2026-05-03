export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  model: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  type: DocumentType
  content: string
  created_at: string
  updated_at: string
}

export type DocumentType = 'blog' | 'email' | 'technical_concept' | 'proposal' | 'comparison' | 'meeting_summary'

export interface Presentation {
  id: string
  user_id: string
  title: string
  topic: string
  slides: Slide[]
  created_at: string
}

export interface Slide {
  id: number
  title: string
  bullets: string[]
  notes?: string
}

export interface ResearchTask {
  id: string
  user_id: string
  topic: string
  status: TaskStatus
  result?: ResearchResult
  error?: string
  created_at: string
  updated_at: string
}

export interface ResearchResult {
  summary: string
  key_findings: string[]
  pros: string[]
  cons: string[]
  risks: string[]
  recommendation: string
}

export interface Agent {
  id: string
  user_id: string
  name: string
  description: string
  system_prompt: string
  model: string
  allowed_tools: string[]
  created_at: string
}

export interface AgentRun {
  id: string
  agent_id: string
  user_id: string
  input: string
  output?: string
  status: TaskStatus
  error?: string
  created_at: string
  updated_at: string
}

export interface UploadedFile {
  id: string
  user_id: string
  filename: string
  file_type: string
  file_size: number
  content?: string
  storage_path?: string
  created_at: string
}

export interface UsageEvent {
  id: string
  user_id: string
  event_type: string
  model?: string
  tokens_used?: number
  created_at: string
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface TaskItem {
  id: string
  type: 'research' | 'document' | 'presentation' | 'agent_run'
  title: string
  status: TaskStatus
  created_at: string
  result?: unknown
}
