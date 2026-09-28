import { apiClient } from '@/lib/api'

export interface BibliographicCouplingEdge {
  source_id: string
  target_id: string
  source_title: string
  target_title: string
  shared_entities: string[]
  shared_methods: string[]
  shared_datasets: string[]
  coupling_strength: number
}

export interface CoCitationCluster {
  cluster_id: number
  theme: string
  paper_ids: string[]
  paper_titles: string[]
  representative_entities: string[]
  cluster_strength: number
}

export interface PaperInfluenceMetric {
  paper_id: string
  title: string
  year?: number
  in_degree: number
  out_degree: number
  pagerank: number
  hub_score: number
  authority_score: number
  influence_score: number
  influence_rank: number
  classification: string
}

export interface CitationNetworkAnalysisResponse {
  total_papers: number
  total_couplings: number
  coupling_edges: BibliographicCouplingEdge[]
  influential_papers: PaperInfluenceMetric[]
  clusters: CoCitationCluster[]
  network_density: number
}

export const citationsService = {
  async getAnalysis(): Promise<CitationNetworkAnalysisResponse> {
    return apiClient<CitationNetworkAnalysisResponse>('/citations/analysis')
  }
}
