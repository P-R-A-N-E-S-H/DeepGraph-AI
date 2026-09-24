import { apiClient } from '@/lib/api'

export interface ResearchNote {
  id: string
  workspace_id: string
  title: string
  content: string
  tags: string[]
  citations: Array<{ paper_title?: string; page?: number; section?: string; chunk_id?: string }>
  created_at: string
  updated_at: string
}

export interface PaperAnnotation {
  id: string
  paper_id: string
  user_id?: string
  page_number: number
  highlighted_text: string
  comment?: string
  color: string
  position_data?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Bookmark {
  id: string
  paper_id: string
  user_id?: string
  folder: string
  notes?: string
  tags: string[]
  created_at: string
}

export const notesService = {
  async listNotes(workspaceId?: string, query?: string, tag?: string): Promise<ResearchNote[]> {
    const params = new URLSearchParams()
    if (workspaceId) params.append('workspace_id', workspaceId)
    if (query) params.append('query', query)
    if (tag) params.append('tag', tag)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return apiClient<ResearchNote[]>(`/notes${qs}`)
  },

  async createNote(workspaceId: string, title: string, content: string, tags: string[] = []): Promise<ResearchNote> {
    return apiClient<ResearchNote>('/notes', {
      method: 'POST',
      body: JSON.stringify({ workspace_id: workspaceId, title, content, tags, citations: [] })
    })
  },

  async updateNote(noteId: string, title?: string, content?: string, tags?: string[]): Promise<ResearchNote> {
    return apiClient<ResearchNote>(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content, tags })
    })
  },

  async deleteNote(noteId: string): Promise<void> {
    return apiClient<void>(`/notes/${noteId}`, {
      method: 'DELETE'
    })
  },

  async listAnnotations(paperId: string): Promise<PaperAnnotation[]> {
    return apiClient<PaperAnnotation[]>(`/notes/annotations/paper/${paperId}`)
  },

  async createAnnotation(annotation: Omit<PaperAnnotation, 'id' | 'created_at' | 'updated_at'>): Promise<PaperAnnotation> {
    return apiClient<PaperAnnotation>('/notes/annotations', {
      method: 'POST',
      body: JSON.stringify(annotation)
    })
  },

  async deleteAnnotation(annotationId: string): Promise<void> {
    return apiClient<void>(`/notes/annotations/${annotationId}`, {
      method: 'DELETE'
    })
  },

  async listBookmarks(folder?: string): Promise<Bookmark[]> {
    const qs = folder ? `?folder=${encodeURIComponent(folder)}` : ''
    return apiClient<Bookmark[]>(`/notes/bookmarks${qs}`)
  },

  async createBookmark(paperId: string, folder: string = 'reading_list', notes?: string, tags: string[] = []): Promise<Bookmark> {
    return apiClient<Bookmark>('/notes/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ paper_id: paperId, folder, notes, tags })
    })
  }
}
