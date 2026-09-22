import { apiClient } from '@/lib/api'

export interface WorkspaceItem {
  id: string
  name: string
  description?: string
  document_ids: string[]
  created_at: string
  updated_at: string
}

export interface ResearchNoteItem {
  id: string
  workspace_id: string
  title: string
  content: string
  tags: string[]
  citations: Array<Record<string, any>>
  created_at: string
  updated_at: string
}

export const workspaceService = {
  async listWorkspaces(): Promise<WorkspaceItem[]> {
    return apiClient<WorkspaceItem[]>('/workspaces')
  },

  async createWorkspace(name: string, description?: string, documentIds: string[] = []): Promise<WorkspaceItem> {
    return apiClient<WorkspaceItem>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, description, document_ids: documentIds }),
    })
  },

  async listNotes(workspaceId: string): Promise<ResearchNoteItem[]> {
    return apiClient<ResearchNoteItem[]>(`/workspaces/${workspaceId}/notes`)
  },

  async createNote(workspaceId: string, title: string, content: string, tags: string[] = [], citations: any[] = []): Promise<ResearchNoteItem> {
    return apiClient<ResearchNoteItem>(`/workspaces/${workspaceId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ title, content, tags, citations }),
    })
  },

  async exportMarkdown(workspaceId: string): Promise<string> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/export`)
    return res.text()
  }
}
