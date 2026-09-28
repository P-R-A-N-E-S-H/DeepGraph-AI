'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  BookOpen,
  Download,
  CheckCircle,
  HelpCircle,
  Compass,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  Copy,
  Check
} from 'lucide-react'
import { reviewService, SystematicReviewResponse } from '@/services/review'

export default function ReviewsPage() {
  const [topic, setTopic] = useState('Graph Retrieval-Augmented Generation (Graph-RAG) in Technical Problem Solving')
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState<SystematicReviewResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    try {
      const data = await reviewService.generateReview(topic)
      setReview(data)
    } catch (err) {
      console.error('Error generating review:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!review) return
    navigator.clipboard.writeText(review.markdown_report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!review) return
    const blob = new Blob([review.markdown_report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `literature_review_${topic.replace(/[^a-zA-Z0-9]/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-400" />
            Systematic Literature Review Synthesizer
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Automate multi-paper meta-analyses, thematic taxonomies, and research consensus discovery.
          </p>
        </div>

        {review && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Markdown'}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition-all shadow-md shadow-brand-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              Download Draft (.md)
            </button>
          </div>
        )}
      </div>

      {/* Query Bar */}
      <form onSubmit={handleGenerate} className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-xl flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Enter research field or question (e.g., Sparse Mixture of Experts scaling laws)..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-brand-600/25 disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Synthesizing Corpus...</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Systematic Review</span>
            </>
          )}
        </button>
      </form>

      {/* Review Synthesis Dashboard */}
      {review && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Summary Card */}
          <div className="bg-gradient-to-br from-brand-950/40 via-slate-900 to-slate-900/90 border border-brand-500/30 rounded-xl p-6">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-300 bg-brand-900/50 border border-brand-700/50 px-2 py-0.5 rounded-full mb-3">
              EXECUTIVE SYNTHESIS • {review.paper_count} PAPERS ANALYZED
            </span>
            <h2 className="text-xl font-bold text-white mb-2">{review.title}</h2>
            <p className="text-slate-300 text-sm leading-relaxed">{review.executive_summary}</p>
          </div>

          {/* Thematic Taxonomies */}
          <div>
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              Thematic Literature Taxonomies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {review.taxonomies.map((tax, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-brand-400 uppercase">Cluster 0{idx + 1}</span>
                    <h4 className="font-semibold text-slate-100 text-sm mt-0.5">{tax.cluster_name}</h4>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">{tax.focus}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <p className="text-[11px] font-medium text-slate-500 mb-1">Key Literature:</p>
                    <div className="space-y-1">
                      {tax.representative_papers.map((p, pIdx) => (
                        <p key={pIdx} className="text-xs text-brand-300 font-mono line-clamp-1">
                          • {p}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Synthesis Sections */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-400" />
              Comprehensive Review Sections
            </h3>

            <div className="space-y-6">
              {review.sections.map((sec, sIdx) => (
                <div key={sIdx} className="border-b border-slate-800/80 pb-6 last:border-b-0 last:pb-0">
                  <h4 className="text-sm font-semibold text-brand-200 mb-2">{sec.title}</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{sec.content}</p>

                  {sec.citations && sec.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {sec.citations.map((c, cIdx) => (
                        <span key={cIdx} className="text-[11px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                          [{c.title || 'Citation'} ({c.year || '2024'})]
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Consensus vs Controversies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Consensus */}
            <div className="bg-slate-900 border border-emerald-950/60 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Areas of Empirical Consensus
              </h4>
              <ul className="space-y-2.5">
                {review.consensus_and_controversies.Consensus.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                    <span className="text-emerald-400 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Controversies */}
            <div className="bg-slate-900 border border-amber-950/60 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Active Scientific Controversies & Debates
              </h4>
              <ul className="space-y-2.5">
                {review.consensus_and_controversies['Controversies & Open Debates'].map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                    <span className="text-amber-400 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Future Directions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-400" />
              High-Impact Future Research Roadmap
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {review.future_directions.map((dir, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 leading-relaxed">
                  <span className="text-brand-400 font-mono font-bold block mb-1">Grant Direction #{idx + 1}</span>
                  {dir}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
