'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Share2,
  Network,
  GitBranch,
  Layers,
  Award,
  BookOpen,
  Filter,
  ArrowRight,
  TrendingUp,
  Cpu,
  Sparkles,
  Search,
  CheckCircle2
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { citationsService, CitationNetworkAnalysisResponse } from '@/services/citations'

export default function CitationsPage() {
  const router = useRouter()
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL')
  const [searchFilter, setSearchFilter] = useState<string>('')

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['citation-network-analysis'],
    queryFn: () => citationsService.getAnalysis(),
  })

  const influentialPapers = analysis?.influential_papers || []
  const couplings = analysis?.coupling_edges || []
  const clusters = analysis?.clusters || []

  const classifications = ['ALL', 'Landmark Seed', 'Pivotal Bridge', 'Recent SOTA', 'Foundational']

  const filteredPapers = influentialPapers.filter((p) => {
    const matchesClass = selectedClassification === 'ALL' || p.classification === selectedClassification
    const matchesSearch =
      !searchFilter ||
      p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.classification.toLowerCase().includes(searchFilter.toLowerCase())
    return matchesClass && matchesSearch
  })

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Citation Network & Bibliographic Coupling"
        subtitle="Automated bibliometric analysis calculating shared methodologies, co-citation clusters, HITS authority scores, and PageRank"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Metric KPI Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-400" />
              <span>Analyzed Papers</span>
            </span>
            <p className="text-2xl font-bold text-foreground">{analysis?.total_papers || 0}</p>
            <p className="text-[10px] text-muted-foreground font-mono">In Knowledge Graph</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <Share2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Bibliographic Couplings</span>
            </span>
            <p className="text-2xl font-bold text-foreground">{analysis?.total_couplings || 0}</p>
            <p className="text-[10px] text-muted-foreground font-mono">Shared entity & method links</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Thematic Clusters</span>
            </span>
            <p className="text-2xl font-bold text-foreground">{clusters.length}</p>
            <p className="text-[10px] text-muted-foreground font-mono">Modularity community groups</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
              <span>Network Density</span>
            </span>
            <p className="text-2xl font-bold text-foreground font-mono">{analysis?.network_density || '0.00'}</p>
            <p className="text-[10px] text-muted-foreground font-mono">Graph connectivity ratio</p>
          </div>
        </div>

        {/* Influential Papers & Centrality Rankings */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-border shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Paper Influence & Structural Authority Rankings</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Ranked by fused PageRank, HITS Hub/Authority centrality, and in-degree citation linkages
              </p>
            </div>

            {/* Classification Filter */}
            <div className="flex flex-wrap items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border text-xs">
              {classifications.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClassification(cls)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    selectedClassification === cls
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search ranked papers by title or taxonomy..."
                className="w-full bg-secondary/40 border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/40"
              />
            </div>
          </div>

          {/* Papers Table */}
          <div className="space-y-3">
            {filteredPapers.map((paper) => (
              <div
                key={paper.paper_id}
                className="glass-card rounded-2xl p-5 border border-border hover:border-amber-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-amber-300 text-sm flex-shrink-0">
                    #{paper.influence_rank}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {paper.year || 2024}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          paper.classification === 'Landmark Seed'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : paper.classification === 'Pivotal Bridge'
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                            : 'bg-secondary text-muted-foreground border-border'
                        }`}
                      >
                        {paper.classification}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">{paper.title}</h4>
                  </div>
                </div>

                {/* Score Pills */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  <div className="px-2.5 py-1 rounded-lg bg-secondary/80 border border-border text-center">
                    <span className="text-muted-foreground block text-[9px] uppercase">PageRank</span>
                    <span className="font-bold text-slate-200">{paper.pagerank}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-secondary/80 border border-border text-center">
                    <span className="text-muted-foreground block text-[9px] uppercase">Authority</span>
                    <span className="font-bold text-amber-300">{paper.authority_score}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-secondary/80 border border-border text-center">
                    <span className="text-muted-foreground block text-[9px] uppercase">Coupling Deg</span>
                    <span className="font-bold text-teal-300">{paper.in_degree}</span>
                  </div>

                  <button
                    onClick={() => router.push(`/chat?q=Analyze the citation influence and methodology of ${encodeURIComponent(paper.title)}`)}
                    className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all ml-2"
                    title="Ask AI about paper"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pairwise Bibliographic Couplings Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Pairwise Couplings (7 Cols) */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-border space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-teal-400" />
                <span>Pairwise Bibliographic Coupling Strength</span>
              </h3>
              <p className="text-xs text-muted-foreground">Papers sharing methodologies, datasets, and semantic entity neighborhoods</p>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {couplings.map((edge, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-secondary/30 border border-border/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-foreground">
                      <span className="truncate max-w-[180px]">{edge.source_title}</span>
                      <span className="text-teal-400">↔</span>
                      <span className="truncate max-w-[180px]">{edge.target_title}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Strength: {edge.coupling_strength}
                    </span>
                  </div>

                  {edge.shared_methods.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-muted-foreground font-semibold">Shared Methods:</span>
                      {edge.shared_methods.map((m, mIdx) => (
                        <span key={mIdx} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {edge.shared_datasets.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-muted-foreground font-semibold">Shared Datasets:</span>
                      {edge.shared_datasets.map((d, dIdx) => (
                        <span key={dIdx} className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20 font-mono">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Co-Citation Clusters (5 Cols) */}
          <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-border space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Co-Citation Modularity Cohorts</span>
              </h3>
              <p className="text-xs text-muted-foreground">Thematic sub-communities formed by citation clustering</p>
            </div>

            <div className="space-y-3">
              {clusters.map((c) => (
                <div key={c.cluster_id} className="p-4 rounded-2xl bg-secondary/30 border border-border/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-indigo-300">{c.theme}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      {c.paper_ids.length} Papers
                    </span>
                  </div>

                  <ul className="space-y-1 text-xs text-slate-300">
                    {c.paper_titles.map((t, tIdx) => (
                      <li key={tIdx} className="truncate list-disc list-inside text-muted-foreground">
                        {t}
                      </li>
                    ))}
                  </ul>

                  {c.representative_entities.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1">
                      {c.representative_entities.map((e, eIdx) => (
                        <span key={eIdx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-slate-400 border border-border/50">
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/graph')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-brand-500/20 active:scale-95"
            >
              <Network className="w-4 h-4" />
              <span>Explore Interactive 2D/3D Knowledge Graph</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
