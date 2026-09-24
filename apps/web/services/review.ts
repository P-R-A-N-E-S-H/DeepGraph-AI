import { apiClient } from '@/lib/api'

export interface ReviewSection {
  title: string
  content: string
  citations: Array<{ paper_id?: string; title?: string; year?: number; venue?: string }>
}

export interface SystematicReviewResponse {
  title: string
  topic: string
  paper_count: int
  executive_summary: string
  taxonomies: Array<{
    cluster_name: string
    focus: string
    representative_papers: string[]
  }>
  sections: ReviewSection[]
  consensus_and_controversies: {
    Consensus: string[]
    'Controversies & Open Debates': string[]
  }
  future_directions: string[]
  markdown_report: string
}

export const reviewService = {
  async generateReview(topic: string, paperIds?: string[], workspaceId?: string): Promise<SystematicReviewResponse> {
    return apiClient<SystematicReviewResponse>('/review/generate', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        paper_ids: paperIds,
        workspace_id: workspaceId
      })
    })
  },

  async downloadReviewMarkdown(topic: string, paperIds?: string[]): Promise<string> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    const res = await fetch(`${API_BASE_URL}/review/generate/export-markdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, paper_ids: paperIds })
    })
    return res.text()
  }
}
