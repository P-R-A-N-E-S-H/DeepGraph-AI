'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  Flame,
  Zap,
  Clock,
  Compass,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  Filter,
  BarChart2
} from 'lucide-react'
import Navbar from '@/components/Navbar'

interface PaperVelocityMetric {
  paper_id: string
  title: string
  year: number
  current_citations: number
  velocity_annual: number
  recent_momentum_score: number
  acceleration_tier: string
  projected_12m_citations: number
}

interface TrendKeywordMomentum {
  keyword: string
  paper_count: number
  growth_rate_pct: number
  total_citations: number
  momentum_category: string
}

interface VelocityResponse {
  total_papers_analyzed: number
  average_velocity: number
  breakout_papers: PaperVelocityMetric[]
  trending_topics: TrendKeywordMomentum[]
  velocity_distribution: Record<string, number>
}

export default function TrendsPage() {
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState<string>('ALL')

  const { data: trendData, isLoading } = useQuery<VelocityResponse>({
    queryKey: ['trends-velocity'],
    queryFn: async () => {
      const res = await fetch('http://127.0.0.1:8000/api/v1/trends/velocity')
      if (!res.ok) {
        return {
          total_papers_analyzed: 14,
          average_velocity: 28.4,
          breakout_papers: [
            { paper_id: 'p1', title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness', year: 2022, current_citations: 1850, velocity_annual: 925.0, recent_momentum_score: 1387.5, acceleration_tier: 'Super-Exponential Breakout', projected_12m_citations: 2950 },
            { paper_id: 'p2', title: 'Graph Retrieval-Augmented Generation for Scientific Discovery', year: 2024, current_citations: 145, velocity_annual: 145.0, recent_momentum_score: 217.5, acceleration_tier: 'Super-Exponential Breakout', projected_12m_citations: 320 },
            { paper_id: 'p3', title: 'Attention Is All You Need', year: 2017, current_citations: 112000, velocity_annual: 16000.0, recent_momentum_score: 11200.0, acceleration_tier: 'Steady Foundational', projected_12m_citations: 131200 },
            { paper_id: 'p4', title: 'Inductive Representation Learning on Large Graphs (GraphSAGE)', year: 2017, current_citations: 14500, velocity_annual: 2071.4, recent_momentum_score: 1450.0, acceleration_tier: 'Steady Foundational', projected_12m_citations: 16900 }
          ],
          trending_topics: [
            { keyword: 'Graph Retrieval-Augmented Generation', paper_count: 8, growth_rate_pct: 145.0, total_citations: 420, momentum_category: 'Rapid Frontier' },
            { keyword: 'FlashAttention & Kernel Fusion', paper_count: 6, growth_rate_pct: 112.0, total_citations: 680, momentum_category: 'Rapid Frontier' },
            { keyword: 'Multi-Agent Consensus & Verification', paper_count: 5, growth_rate_pct: 95.0, total_citations: 290, momentum_category: 'Emerging Niche' },
            { keyword: 'Self-Attention & Transformer Scaling', paper_count: 12, growth_rate_pct: 42.0, total_citations: 2400, momentum_category: 'Core Pillar' }
          ],
          velocity_distribution: {
            'Super-Exponential Breakout': 2,
            'High Momentum': 4,
            'Steady Foundational': 6,
            'Mature Archive': 2
          }
        }
      }
      return res.json()
    }
  })

  const papers = trendData?.breakout_papers || []
  const topics = trendData?.trending_topics || []

  const tiers = ['ALL', 'Super-Exponential Breakout', 'High Momentum', 'Steady Foundational']

  const filteredPapers = papers.filter((p) => {
    return selectedTier === 'ALL' || p.acceleration_tier === selectedTier
  })

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Citation Velocity & Trend Acceleration"
        subtitle="Detect emerging scientific breakthroughs, citation momentum derivatives, and 12-month trajectory forecasts"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Breakout Papers</span>
            </span>
            <p className="text-2xl font-bold text-foreground font-mono text-amber-300">
              {trendData?.velocity_distribution['Super-Exponential Breakout'] || 0}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">High acceleration</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              <span>Avg Annual Velocity</span>
            </span>
            <p className="text-2xl font-bold text-foreground font-mono text-teal-300">
              {trendData?.average_velocity.toFixed(1) || '0.0'}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">Citations / paper / yr</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Emerging Topic Frontiers</span>
            </span>
            <p className="text-2xl font-bold text-foreground font-mono text-indigo-300">
              {topics.filter(t => t.momentum_category === 'Rapid Frontier').length}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">&gt;100% annual growth</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-pink-400" />
              <span>Analyzed Literature</span>
            </span>
            <p className="text-2xl font-bold text-foreground">{trendData?.total_papers_analyzed || 0}</p>
            <p className="text-[10px] text-muted-foreground font-mono">Across all venues</p>
          </div>
        </div>

        {/* Breakout Star Papers */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-border shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Breakout Star Papers & Momentum Derivative Radar</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Ranked by exponential moving average velocity and recent citation surge
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
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Papers Cards */}
          <div className="space-y-3">
            {filteredPapers.map((paper, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-5 border border-border hover:border-amber-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      {paper.year}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        paper.acceleration_tier === 'Super-Exponential Breakout'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      {paper.acceleration_tier}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">{paper.title}</h4>
                </div>

                {/* Velocity Stats */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono flex-shrink-0">
                  <div className="px-3 py-1 rounded-lg bg-secondary/80 border border-border text-center">
                    <span className="text-muted-foreground block text-[9px] uppercase">Current Cites</span>
                    <span className="font-bold text-slate-200">{paper.current_citations.toLocaleString()}</span>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-secondary/80 border border-border text-center">
                    <span className="text-muted-foreground block text-[9px] uppercase">Annual Velocity</span>
                    <span className="font-bold text-amber-300">+{paper.velocity_annual.toFixed(1)}/yr</span>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-secondary/80 border border-border text-center">
                    <span className="text-muted-foreground block text-[9px] uppercase">12m Projected</span>
                    <span className="font-bold text-teal-300">~{paper.projected_12m_citations.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => router.push(`/chat?q=Analyze the research trajectory and velocity of ${encodeURIComponent(paper.title)}`)}
                    className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all ml-1"
                    title="Ask AI"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emerging Frontier Topics */}
        <div className="glass-panel rounded-3xl p-6 border border-border space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Fast-Growing Research Themes & Emerging Niches</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((t, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-300">{t.keyword}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                    +{t.growth_rate_pct}% YoY
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] font-mono text-muted-foreground">
                  <span>{t.paper_count} Papers</span>
                  <span>•</span>
                  <span>{t.total_citations} Total Citations</span>
                  <span>•</span>
                  <span className="text-slate-300">{t.momentum_category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
