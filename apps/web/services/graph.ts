import { apiClient } from '@/lib/api'

export interface GraphNode {
  id: string
  label: string
  properties: Record<string, any>
}

export interface GraphEdge {
  source: string
  target: string
  relation: string
  properties: Record<string, any>
}

export interface SubgraphResponse {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphAnalyticsResponse {
  total_nodes: number
  total_edges: number
  label_counts: Record<string, number>
  relation_counts: Record<string, number>
  top_connected_entities: Array<{
    id: string
    name: string
    degree: number
    label: string
  }>
}

export interface CentralityResponse {
  pagerank: Record<string, number>
  betweenness: Record<string, number>
  top_influencers: Array<{
    id: string
    name: string
    label: string
    pagerank: number
    betweenness: number
    score: number
  }>
}

export interface CommunitiesResponse {
  total_communities: number
  communities: Array<{
    cluster_id: number
    cluster_name: string
    size: number
    members: Array<{ id: string; name: string; label: string }>
  }>
}

export const graphService = {
  async getSubgraph(types?: string[], limit: number = 150): Promise<SubgraphResponse> {
    const params = new URLSearchParams()
    if (types && types.length > 0) {
      types.forEach(t => params.append('types', t))
    }
    params.set('limit', limit.toString())
    return apiClient<SubgraphResponse>(`/graph?${params.toString()}`)
  },

  async getNeighbors(nodeId: string, depth: number = 1): Promise<SubgraphResponse> {
    return apiClient<SubgraphResponse>(`/graph/entity/${encodeURIComponent(nodeId)}?depth=${depth}`)
  },

  async getAnalytics(): Promise<GraphAnalyticsResponse> {
    return apiClient<GraphAnalyticsResponse>('/graph/analytics')
  },

  async getCentrality(): Promise<CentralityResponse> {
    return apiClient<CentralityResponse>('/graph/centrality')
  },

  async getCommunities(): Promise<CommunitiesResponse> {
    return apiClient<CommunitiesResponse>('/graph/communities')
  }
}
