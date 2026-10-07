'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Award,
  CheckCircle2,
  Sliders,
  Sparkles,
  FileText,
  Star,
  Layers,
  MessageSquare,
  BookOpen,
  Send,
  AlertCircle
} from 'lucide-react'
import Navbar from '@/components/Navbar'

interface ScorecardItem {
  id: string
  paper_id: string
  reviewer_name: string
  originality_score: number
  empirical_soundness_score: number
  clarity_score: number
  impact_score: number
  reproducibility_score: number
  composite_overall_score: number
  recommendation: string
  strengths_summary?: string
  weaknesses_summary?: string
  suggestions_for_authors?: string
  created_at: string
}

export default function RubricsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch papers
  const { data: papers = [] } = useQuery({
    queryKey: ['papers-list'],
    queryFn: async () => {
      const res = await fetch('http://127.0.0.1:8000/api/v1/papers')
      if (!res.ok) return []
      return res.json()
    }
  })

  const [selectedPaperId, setSelectedPaperId] = useState<string>('')
  const [originality, setOriginality] = useState<number>(8.5)
  const [soundness, setSoundness] = useState<number>(8.0)
  const [clarity, setClarity] = useState<number>(8.5)
  const [impact, setImpact] = useState<number>(7.5)
  const [reproducibility, setReproducibility] = useState<number>(9.0)
  const [recommendation, setRecommendation] = useState<string>('Strong Accept')
  const [strengths, setStrengths] = useState<string>('Rigorous empirical baselines and well-structured mathematical formulation.')
  const [weaknesses, setWeaknesses] = useState<string>('High computational requirements on multi-billion token corpora.')
  const [suggestions, setSuggestions] = useState<string>('Consider ablation experiments with lower rank approximations.')

  // Fetch reviews for paper
  const { data: reviews = [] } = useQuery<ScorecardItem[]>({
    queryKey: ['rubric-reviews', selectedPaperId || (papers[0]?.id ?? 'default')],
    queryFn: async () => {
      const pId = selectedPaperId || papers[0]?.id || 'demo'
      const res = await fetch(`http://127.0.0.1:8000/api/v1/rubrics/paper/${pId}`)
      if (!res.ok) return []
      return res.json()
    }
  })

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    const pId = selectedPaperId || papers[0]?.id
    if (!pId) return

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/rubrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_id: pId,
          reviewer_name: 'Lead AI Peer Reviewer',
          originality_score: originality,
          empirical_soundness_score: soundness,
          clarity_score: clarity,
          impact_score: impact,
          reproducibility_score: reproducibility,
          recommendation: recommendation,
          strengths_summary: strengths,
          weaknesses_summary: weaknesses,
          suggestions_for_authors: suggestions
        })
      })
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['rubric-reviews'] })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const compositeScore = (
    originality * 0.25 +
    soundness * 0.30 +
    clarity * 0.15 +
    impact * 0.15 +
    reproducibility * 0.15
  ).toFixed(2)

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Peer Review & Evaluation Studio"
        subtitle="Standardized academic peer review rubrics, multi-criteria scoring, and constructive synthesis"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Review Form & Live Scorecard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Controls (7 cols) */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-6 md:p-8 border border-border shadow-xl space-y-6">
            <h3 className="text-base font-bold text-foreground flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-brand-400" />
              <span>Multi-Criteria Evaluation Rubric</span>
            </h3>

            <form onSubmit={handleSubmitReview} className="space-y-5">
              {/* Sliders */}
              <div className="space-y-4">
                {[
                  { label: 'Originality & Conceptual Novelty (25%)', val: originality, set: setOriginality },
                  { label: 'Empirical & Theoretical Soundness (30%)', val: soundness, set: setSoundness },
                  { label: 'Clarity, Organization & Presentation (15%)', val: clarity, set: setClarity },
                  { label: 'Significance & Field Impact (15%)', val: impact, set: setImpact },
                  { label: 'Reproducibility & Open Artifacts (15%)', val: reproducibility, set: setReproducibility }
                ].map((crit, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>{crit.label}</span>
                      <span className="font-mono text-brand-300 font-bold">{crit.val.toFixed(1)} / 10.0</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="10.0"
                      step="0.5"
                      value={crit.val}
                      onChange={(e) => crit.set(parseFloat(e.target.value))}
                      className="w-full accent-brand-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Overall Recommendation</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs font-semibold">
                  {['Strong Accept', 'Accept', 'Weak Accept', 'Borderline', 'Reject'].map((rec) => (
                    <button
                      key={rec}
                      type="button"
                      onClick={() => setRecommendation(rec)}
                      className={`py-2 rounded-xl border text-center transition-all ${
                        recommendation === rec
                          ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 shadow-sm font-bold'
                          : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      {rec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Qualitative Narrative */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Key Strengths</label>
                  <textarea
                    rows={2}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    className="w-full bg-secondary/40 border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-brand-500 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Weaknesses & Limitations</label>
                  <textarea
                    rows={2}
                    value={weaknesses}
                    onChange={(e) => setWeaknesses(e.target.value)}
                    className="w-full bg-secondary/40 border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-brand-500 mt-1"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Submit Peer Review Scorecard</span>
              </button>
            </form>
          </div>

          {/* Live Composite Summary Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-3xl p-6 border border-border space-y-4 text-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Composite Overall Rating</span>
              <p className="text-5xl font-black font-mono text-brand-300">{compositeScore}</p>
              <div className="inline-block px-3 py-1 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold font-mono">
                {recommendation}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Weighted composite calculated from 5 standardized peer evaluation criteria.
              </p>
            </div>

            {/* Existing Reviews List */}
            <div className="glass-panel rounded-3xl p-6 border border-border space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Recorded Reviews ({reviews.length})</span>
              </h4>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{r.reviewer_name}</span>
                      <span className="text-xs font-mono font-bold text-brand-300">{r.composite_overall_score} / 10</span>
                    </div>
                    {r.strengths_summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        <span className="font-semibold text-slate-300">Strengths:</span> {r.strengths_summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
