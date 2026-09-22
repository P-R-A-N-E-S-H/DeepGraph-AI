import { apiClient } from '@/lib/api'

export interface DocumentItem {
  id: string
  filename: string
  file_size: number
  source: string
  arxiv_id?: string
  status: 'UPLOADED' | 'PARSING' | 'CHUNKING' | 'EXTRACTING' | 'EMBEDDING' | 'INDEXING' | 'COMPLETED' | 'FAILED'
  progress: number
  current_stage: string
  error_message?: string
  stage_metrics?: Record<string, any>
  created_at: string
  updated_at: string
  paper_title?: string
  author_names?: string[]
}

export interface ArxivSearchItem {
  arxiv_id: string
  title: string
  authors: string[]
  abstract: string
  published: string
  categories: string[]
  pdf_url: string
}

export const documentService = {
  async listDocuments(): Promise<DocumentItem[]> {
    return apiClient<DocumentItem[]>('/documents')
  },

  async getDocument(id: string): Promise<DocumentItem> {
    return apiClient<DocumentItem>(`/documents/${id}`)
  },

  async getStatus(id: string): Promise<{ id: string; status: DocumentItem['status']; progress: number; current_stage: string }> {
    return apiClient<{ id: string; status: DocumentItem['status']; progress: number; current_stage: string }>(`/documents/${id}/status`)
  },

  async uploadDocument(file: File): Promise<DocumentItem> {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient<DocumentItem>('/documents/upload', {
      method: 'POST',
      body: formData,
    })
  },

  async deleteDocument(id: string): Promise<void> {
    return apiClient<void>(`/documents/${id}`, {
      method: 'DELETE',
    })
  },

  async searchArxiv(query: string): Promise<ArxivSearchItem[]> {
    return apiClient<ArxivSearchItem[]>(`/arxiv/search?query=${encodeURIComponent(query)}`)
  },

  async importArxiv(arxivId: string, title: string): Promise<DocumentItem> {
    return apiClient<DocumentItem>('/arxiv/import', {
      method: 'POST',
      body: JSON.stringify({ arxiv_id: arxivId, title }),
    })
  }
}
