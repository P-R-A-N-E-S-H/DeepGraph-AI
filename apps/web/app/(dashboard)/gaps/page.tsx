'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  FileText,
  Compass,
  CheckCircle2,
  Filter,
  Search,
  Zap,
  TrendingUp,
  Flame,
  BrainCircuit,
  Cpu
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { gapService, ResearchGapItem } from '@/services/analytics'

export default function GapsPage() {
  const router = useRouter()
  const [selectedConfidence, setSelectedConfidence] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['research-gaps'],
    queryFn: () => gapService.getGaps(),
  })

  const gaps: ResearchGapItem[] = data?.gaps || []

  const filteredGaps = gaps.filter(gap => {
    const matchesConfidence = selectedConfidence === 'ALL' || gap.confidence === selectedConfidence
    const q = searchQuery.toLowerCase()
    const matchesSearch = (
      gap.topic.toLowerCase().includes(q) ||
      gap.observed_limitation.toLowerCase().includes(q) ||
      gap.potential_direction.toLowerCase().includes(q) ||
      gap.unresolved_questions.some(uq => uq.toLowerCase().includes(q))
    )
    return matchesConfidence && matchesSearch
  })

  const handleLaunchExperimentChat = (gap: ResearchGapItem) => {
    const prompt = `Formulate a concrete research hypothesis and 3-stage experimental design to address the following limitation:\n\nTopic: ${gap.topic}\nLimitation: ${gap.observed_limitation}\nProposed Direction: ${gap.potential_direction}`
    router.push(`/chat?q=${encodeURIComponent(prompt)}`)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Research Gap & Frontier Discovery"
        subtitle="Automated analysis of reported limitations, unresolved questions, and open research directions"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Scientific Integrity Disclaimer Banner */}
        <div className="p-5 rounded-2xl glass-panel bg-amber-950/20 border border-amber-500/30 flex items-start space-x-3.5 text-xs shadow-lg">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-amber-300 text-xs uppercase tracking-wider">
              Scientific Integrity & Frontier Methodology Notice
            </p>
            <p className="text-amber-200/80 leading-relaxed text-xs">
              Discovered research gaps represent observed empirical trade-offs, author-reported limitations, and computational boundaries across your ingested papers. These items are strictly formulated as <strong>Potential Research Hypotheses</strong> to inspire rigorous experimentation.
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search frontiers by topic, limitation, or keywords..."
                className="w-full bg-slate-950/60 border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-teal-500/60 shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-muted-foreground">Confidence:</span>
            <div className="flex items-center space-x-1 bg-secondary/50 p-1 rounded-xl border border-border text-xs">
              {['ALL', 'High', 'Medium'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedConfidence(lvl)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    selectedConfidence === lvl
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gaps List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredGaps.length > 0 ? (
            filteredGaps.map((gap) => (
              <div
                key={gap.id}
                className="glass-card rounded-3xl p-6 md:p-8 border border-border space-y-6 shadow-xl relative overflow-hidden"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-wider">
                        Potential Research Frontier
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        gap.confidence === 'High'
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50'
                          : 'bg-amber-950/50 text-amber-400 border border-amber-800/50'
                      }`}>
                        Confidence: {gap.confidence}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground pt-1">{gap.topic}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground font-mono bg-secondary px-3 py-1 rounded-xl border border-border">
                      {gap.evidence_count} Grounded Citations
                    </span>
                  </div>
                </div>

                {/* Observed Limitation Panel */}
                <div className="p-4 rounded-2xl bg-rose-950/15 border border-rose-500/20 space-y-1.5 text-xs">
                  <div className="flex items-center space-x-2 font-bold text-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span className="uppercase tracking-wider text-[10px] font-mono">Observed Empirical Limitation</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed font-normal">{gap.observed_limitation}</p>
                </div>

                {/* Key Unresolved Scientific Questions */}
                <div className="space-y-2.5 text-xs">
                  <p className="font-bold text-foreground flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    <span>Key Unresolved Questions:</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {gap.unresolved_questions.map((q, qIdx) => (
                      <div key={qIdx} className="flex items-start space-x-2.5 p-3 rounded-xl bg-secondary/40 border border-border/80 text-muted-foreground">
                        <span className="text-indigo-400 mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                        <span className="text-slate-300 leading-relaxed">{q}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proposed Research Direction */}
                <div className="p-5 rounded-2xl bg-teal-950/20 border border-teal-500/30 text-xs space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-teal-300">
                    <Compass className="w-4 h-4 text-teal-400" />
                    <span className="uppercase tracking-wider text-[10px] font-mono">Hypothesized Research Direction</span>
                  </div>
                  <p className="text-slate-100 leading-relaxed font-medium text-xs">{gap.potential_direction}</p>
                </div>

                {/* Supporting Papers & Experiment Action Footer */}
                <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground font-semibold">Evidence Grounding:</span>
                    {gap.supporting_papers.map((p, pIdx) => (
                      <span key={pIdx} className="px-2.5 py-1 rounded-lg bg-secondary/80 border border-border text-[11px] text-foreground font-medium">
                        {p.title} ({p.year || 2024})
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleLaunchExperimentChat(gap)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-all shadow-md shadow-teal-500/20 active:scale-95"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      <span>Formulate Experiment Plan</span>
                    </button>
                    <button
                      onClick={() => router.push(`/chat?q=Analyze potential solutions for ${encodeURIComponent(gap.topic)}`)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition-all"
                    >
                      <span>Explore In Chat</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-xs text-muted-foreground space-y-3 glass-panel rounded-3xl border border-dashed border-border">
              <Lightbulb className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-bold text-foreground">No matching research frontiers found</p>
              <p className="max-w-md mx-auto text-muted-foreground">Try clearing your search query or switching confidence filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
