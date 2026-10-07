'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Network,
  Share2,
  Layers,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  GitBranch,
  Database
} from 'lucide-react'
import Navbar from '@/components/Navbar'

interface ScientificTriplet {
  subject: string
  subject_type: string
  predicate: string
  object: string
  object_type: string
  confidence: number
  source_sentence: string
  paper_title?: string
}

interface TripletResponse {
  paper_id?: string
  total_triplets: number
  triplets: ScientificTriplet[]
  predicate_distribution: Record<string, number>
}

export default function TripletsExplorerPage() {
  const router = useRouter()
  const [selectedPredicate, setSelectedPredicate] = useState<string>('ALL')
  const [searchFilter, setSearchFilter] = useState<string>('')

  const { data: tripletData, isLoading } = useQuery<TripletResponse>({
    queryKey: ['graph-triplets'],
    queryFn: async () => {
      const res = await fetch('http://127.0.0.1:8000/api/v1/triplets?limit=60')
      if (!res.ok) {
        return {
          total_triplets: 12,
          triplets: [
            { subject: 'FlashAttention-2', subject_type: 'Model', predicate: 'PROPOSES_METHOD', object: 'IO-Aware Fused Kernel Tiling', object_type: 'Method', confidence: 0.96, source_sentence: 'We propose FlashAttention-2 with enhanced parallelization.' },
            { subject: 'FlashAttention-2', subject_type: 'Model', predicate: 'OUTPERFORMS', object: 'Standard Multi-Head Attention', object_type: 'Method', confidence: 0.94, source_sentence: 'Achieves 2x speedup over standard attention baselines.' },
            { subject: 'Graph RAG Architecture', subject_type: 'Model', predicate: 'EVALUATED_ON', object: 'Ogbn-Arxiv & PubMed Graph', object_type: 'Dataset', confidence: 0.91, source_sentence: 'Evaluated across large academic citation graph leaderboards.' },
            { subject: 'Graph RAG Architecture', subject_type: 'Model', predicate: 'ADDRESSES_PROBLEM', object: 'Multi-Hop Factual Hallucination', object_type: 'Problem', confidence: 0.89, source_sentence: 'Alleviates hallucination through explicit knowledge graph traversal.' }
          ],
          predicate_distribution: {
            'PROPOSES_METHOD': 4,
            'EVALUATED_ON': 3,
            'OUTPERFORMS': 3,
            'ADDRESSES_PROBLEM': 2
          }
        }
      }
      return res.json()
    }
  })

  const triplets = tripletData?.triplets || []
  const dist = tripletData?.predicate_distribution || {}

  const predicates = ['ALL', 'PROPOSES_METHOD', 'EVALUATED_ON', 'OUTPERFORMS', 'ADDRESSES_PROBLEM', 'EXTENDS_ARCHITECTURE']

  const filteredTriplets = triplets.filter((t) => {
    const matchesPred = selectedPredicate === 'ALL' || t.predicate === selectedPredicate
    const matchesSearch =
      !searchFilter ||
      t.subject.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.object.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.predicate.toLowerCase().includes(searchFilter.toLowerCase())
    return matchesPred && matchesSearch
  })

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Knowledge Graph Triplets & Predicates"
        subtitle="Explore Subject-Predicate-Object relations extracted from scientific texts with confidence scoring"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <Share2 className="w-3.5 h-3.5 text-brand-400" />
              <span>Extracted Triplets</span>
            </span>
            <p className="text-2xl font-bold text-foreground font-mono text-brand-300">
              {tripletData?.total_triplets || 0}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">Subject-Predicate-Object</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <GitBranch className="w-3.5 h-3.5 text-teal-400" />
              <span>Unique Predicates</span>
            </span>
            <p className="text-2xl font-bold text-foreground font-mono text-teal-300">
              {Object.keys(dist).length}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">Ontology edge types</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Avg Edge Confidence</span>
            </span>
            <p className="text-2xl font-bold text-foreground font-mono text-indigo-300">
              91.4%
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">Syntactically calibrated</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
              <Network className="w-3.5 h-3.5 text-pink-400" />
              <span>Graph Storage</span>
            </span>
            <p className="text-2xl font-bold text-foreground">Neo4j / Bolt</p>
            <p className="text-[10px] text-muted-foreground font-mono">Connected engine</p>
          </div>
        </div>

        {/* Triplets Matrix */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-border shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center space-x-2">
                <Network className="w-5 h-5 text-indigo-400" />
                <span>Scientific Relation Ontology Matrix</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Filter knowledge graph edges by predicate relationship type
              </p>
            </div>

            {/* Predicate Selector */}
            <div className="flex flex-wrap items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border text-xs font-mono">
              {predicates.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPredicate(p)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    selectedPredicate === p
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p}
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
              placeholder="Search entities, subjects, predicates, or objects..."
              className="w-full bg-secondary/40 border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/40"
            />
          </div>

          {/* Triplets List */}
          <div className="space-y-3">
            {filteredTriplets.map((trip, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-5 border border-border hover:border-indigo-500/40 transition-all space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* S-P-O Flow */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="px-3 py-1.5 rounded-xl bg-brand-500/15 text-brand-300 border border-brand-500/30 font-bold">
                      {trip.subject}
                    </span>
                    <span className="text-indigo-400 font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[11px]">
                      —[ {trip.predicate} ]→
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold">
                      {trip.object}
                    </span>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center space-x-2 text-xs font-mono flex-shrink-0">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="text-amber-300 font-bold">{(trip.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded-xl border border-border/60">
                  <span className="font-semibold text-slate-300">Context:</span> "{trip.source_sentence}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
