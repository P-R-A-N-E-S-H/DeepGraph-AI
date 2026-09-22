import { apiClient } from '@/lib/api'

export interface PaperItem {
  id: string
  document_id: string
  title: string
  abstract?: string
  year?: number
  venue?: string
  doi?: string
  arxiv_id?: string
  citation_count: number
  authors: Array<{ id: string; name: string; affiliation?: string }>
}

export interface ComparisonDimension {
  category: string
  dimension: string
  values: Record<string, string>
  citations: Record<string, Array<Record<string, any>>>
}

export interface PaperComparisonResponse {
  papers: PaperItem[]
  matrix: ComparisonDimension[]
  synthesis: string
}

export interface ResearchGapItem {
  id: string
  topic: string
  evidence_count: number
  observed_limitation: string
  unresolved_questions: string[]
  potential_direction: string
  supporting_papers: Array<{ id?: string; title: string; year?: number }>
  confidence: 'Low' | 'Medium' | 'High'
}

export interface TimelineEvent {
  year: number
  paper_id: string
  title: string
  authors: string[]
  method?: string
  dataset?: string
  key_contribution: string
}

export interface AnalyticsSummary {
  kpi: {
    documents: number
    papers: number
    chunks: number
    entities: number
    authors: number
    sessions: number
  }
  charts: {
    dataset_distribution: Array<{ name: string; count: number }>
    method_distribution: Array<{ name: string; count: number }>
    papers_by_year: Array<{ year: string; papers: number }>
  }
}

export const compareService = {
  async comparePapers(paperIds: string[]): Promise<PaperComparisonResponse> {
    return apiClient<PaperComparisonResponse>('/compare', {
      method: 'POST',
      body: JSON.stringify({ paper_ids: paperIds }),
    })
  }
}

export const gapService = {
  async getGaps(workspaceId?: string): Promise<{ gaps: ResearchGapItem[]; analyzed_papers_count: number }> {
    const q = workspaceId ? `?workspace_id=${workspaceId}` : ''
    return apiClient<{ gaps: ResearchGapItem[]; analyzed_papers_count: number }>(`/gaps${q}`)
  }
}

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    return apiClient<AnalyticsSummary>('/analytics/summary')
  },

  async getTimeline(): Promise<{ events: TimelineEvent[]; years: number[] }> {
    return apiClient<{ events: TimelineEvent[]; years: number[] }>('/analytics/timeline')
  }
}
