'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Building2,
  Share2,
  Award,
  Network,
  BookOpen,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  TrendingUp,
  GraduationCap
} from 'lucide-react'
import Navbar from '@/components/Navbar'

interface AuthorInfluenceNode {
  author_name: string
  affiliation: string
  paper_count: int
  collaborator_count: int
  centrality_score: float
  prolificacy_tier: string
}

interface CoAuthorEdge {
  source_author: string
  target_author: string
  collaborations_count: int
  joint_papers: string[]
  weight: float
}

interface CollaborationCluster {
  cluster_id: int
  primary_institution: string
  members: string[]
  joint_publication_count: int
}

interface CoAuthorshipResponse {
  total_authors: number
  total_collaborations: number
  authors: AuthorInfluenceNode[]
  collaboration_edges: CoAuthorEdge[]
  clusters: CollaborationCluster[]
  network_density: number
}

export default function CollaborationsPage() {
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState<string>('ALL')
  const [searchFilter, setSearchFilter] = useState<string>('')

  const { data: coauthorData, isLoading } = useQuery<CoAuthorshipResponse>({
    queryKey: ['coauthorship-analysis'],
    queryFn: async () => {
      const res = await fetch('http://127.0.0.1:8000/api/v1/graph/coauthorship')
      if (!res.ok) {
        // Fallback demo data
        return {
          total_authors: 12,
          total_collaborations: 18,
          authors: [
            { author_name: 'Geoffrey Hinton', affiliation: 'University of Toronto / Google', paper_count: 5, collaborator_count: 8, centrality_score: 0.85, prolificacy_tier: 'Leading Scientist' },
            { author_name: 'Yann LeCun', affiliation: 'New York University / Meta FAIR', paper_count: 4, collaborator_count: 6, centrality_score: 0.78, prolificacy_tier: 'Leading Scientist' },
            { author_name: 'Yoshua Bengio', affiliation: 'Mila / Université de Montréal', paper_count: 4, collaborator_count: 7, centrality_score: 0.76, prolificacy_tier: 'Leading Scientist' },
            { author_name: 'Ashish Vaswani', affiliation: 'Essential AI / Google Brain', paper_count: 3, collaborator_count: 5, centrality_score: 0.62, prolificacy_tier: 'Senior Researcher' },
            { author_name: 'Sophia Chen', affiliation: 'Stanford AI Lab', paper_count: 2, collaborator_count: 3, centrality_score: 0.45, prolificacy_tier: 'Active Contributor' }
          ],
          collaboration_edges: [
            { source_author: 'Geoffrey Hinton', target_author: 'Yann LeCun', collaborations_count: 3, joint_papers: ['Deep Learning Survey (Nature)', 'Representation Learning (IEEE)'], weight: 0.9 },
            { source_author: 'Geoffrey Hinton', target_author: 'Yoshua Bengio', collaborations_count: 3, joint_papers: ['Deep Learning Review', 'Gradient-Based Optimization'], weight: 0.9 },
            { source_author: 'Yann LeCun', target_author: 'Yoshua Bengio', collaborations_count: 2, joint_papers: ['Energy-Based Models Review'], weight: 0.8 }
          ],
          clusters: [
            { cluster_id: 1, primary_institution: 'Deep Learning Pioneer Consortium', members: ['Geoffrey Hinton', 'Yann LeCun', 'Yoshua Bengio'], joint_publication_count: 6 },
            { cluster_id: 2, primary_institution: 'Sequence & Attention Architecture Group', members: ['Ashish Vaswani', 'Sophia Chen'], joint_publication_count: 3 }
          ],
          network_density: 0.38
        }
      }
      return res.json()
    }
  })

  const authors = coauthorData?.authors || []
  const edges = coauthorData?.collaboration_edges || []
  const clusters = coauthorData?.clusters || []

  const tiers = ['ALL', 'Leading Scientist', 'Senior Researcher', 'Active Contributor']

  const filteredAuthors = authors.filter((a) => {
    const matchesTier = selectedTier === 'ALL' || a.prolificacy_tier === selectedTier
    const matchesSearch =
      !searchFilter ||
      a.author_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.affiliation.toLowerCase().includes(searchFilter.toLowerCase())
    return matchesTier && matchesSearch
  })

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Co-Authorship & Research Lab Network"
        subtitle="Analyze collaborative publication networks, institutional affiliations, and author centrality metrics"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-brand-400" />
              <span>Active Researchers</span>
            </span>
            <p className="text-2xl font-bold text-foreground">{coauthorData?.total_authors || 0}</p>
            <p className="text-[10px] text-muted-foreground font-mono">Unique authors</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <Share2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Joint Collaborations</span>
            </span>
            <p className="text-2xl font-bold text-foreground">{coauthorData?.total_collaborations || 0}</p>
            <p className="text-[10px] text-muted-foreground font-mono">Co-authored edges</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Institutional Cohorts</span>
            </span>
            <p className="text-2xl font-bold text-foreground">{clusters.length}</p>
            <p className="text-[10px] text-muted-foreground font-mono">Lab communities</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
              <span>Collaboration Density</span>
            </span>
            <p className="text-2xl font-bold text-foreground font-mono">{coauthorData?.network_density || '0.00'}</p>
            <p className="text-[10px] text-muted-foreground font-mono">Graph connectivity</p>
          </div>
        </div>

        {/* Authors Roster and Centrality Matrix */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-border shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <span>Author Influence & Centrality Roster</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Ranked by degree centrality and co-authored publication frequency
              </p>
            </div>

            {/* Tier Filters */}
            <div className="flex flex-wrap items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border text-xs">
              {tiers.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    selectedTier === t
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search researchers by name or institution..."
              className="w-full bg-secondary/40 border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/40"
            />
          </div>

          {/* Authors List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAuthors.map((author, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-5 border border-border hover:border-indigo-500/40 transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-foreground">{author.author_name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {author.prolificacy_tier}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center space-x-1 truncate">
                    <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span>{author.affiliation}</span>
                  </p>
                  <div className="flex items-center space-x-3 text-[11px] font-mono pt-1 text-slate-300">
                    <span>{author.paper_count} Papers</span>
                    <span>•</span>
                    <span>{author.collaborator_count} Collaborators</span>
                    <span>•</span>
                    <span className="text-teal-300">Centrality: {author.centrality_score}</span>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/chat?q=Synthesize the core scientific contributions and collaboration network of ${encodeURIComponent(author.author_name)}`)}
                  className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary text-indigo-300 border border-border transition-all flex-shrink-0"
                  title="Ask AI about Author"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Collaboration Communities */}
        <div className="glass-panel rounded-3xl p-6 border border-border space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-brand-400" />
            <span>Research Lab & Institutional Collaboration Clusters</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clusters.map((c) => (
              <div key={c.cluster_id} className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-brand-300">{c.primary_institution}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                    {c.joint_publication_count} Joint Papers
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {c.members.map((m, mIdx) => (
                    <span key={mIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-slate-300 border border-border/60">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
