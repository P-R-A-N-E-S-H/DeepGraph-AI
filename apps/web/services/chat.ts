import { apiClient } from '@/lib/api'

export interface CitationReference {
  document_id: string
  paper_title?: string
  page: number
  section: string
  chunk_id: string
  relevance_score: number
  excerpt?: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  citations?: CitationReference[]
  reasoning_trace?: Array<{
    agent: string
    action: string
    output_summary: string
    timestamp: number
  }>
  created_at: string
}

export interface ChatSession {
  id: string
  title: string
  workspace_id?: string
  created_at: string
  updated_at: string
  messages: ChatMessage[]
}

export const chatService = {
  async listSessions(): Promise<ChatSession[]> {
    return apiClient<ChatSession[]>('/chat/sessions')
  },

  async getSession(id: string): Promise<ChatSession> {
    return apiClient<ChatSession>(`/chat/sessions/${id}`)
  },

  async sendMessage(content: string, sessionId?: string, workspaceId?: string): Promise<ChatMessage> {
    return apiClient<ChatMessage>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        content,
        session_id: sessionId,
        workspace_id: workspaceId
      }),
    })
  }
}
