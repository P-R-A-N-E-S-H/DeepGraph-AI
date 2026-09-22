'use client'

import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  GitCompare,
  FileText,
  Sparkles,
  CheckCircle2,
  Download,
  Loader2,
  AlertCircle,
  Search,
  Check,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import ComparisonTable from '@/components/ComparisonTable'
import { documentService } from '@/services/documents'
import { compareService, PaperComparisonResponse } from '@/services/analytics'

export default function ComparePage() {
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([])
  const [comparisonResult, setComparisonResult] = useState<PaperComparisonResponse | null>(null)
  const [searchFilter, setSearchFilter] = useState('')

  const { data: documents } = useQuery({
    queryKey: ['documents-list'],
    queryFn: () => documentService.listDocuments(),
  })

  const compareMutation = useMutation({
    mutationFn: (paperIds: string[]) => compareService.comparePapers(paperIds),
    onSuccess: (data) => {
      setComparisonResult(data)
    },
  })

  const togglePaper = (docId: string) => {
    setSelectedPaperIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  const handleSelectAll = () => {
    if (documents) {
      setSelectedPaperIds(documents.map(d => d.id))
    }
  }

  const handleClearSelection = () => {
    setSelectedPaperIds([])
  }

  const handleRunComparison = () => {
    if (selectedPaperIds.length >= 2) {
      compareMutation.mutate(selectedPaperIds)
    }
  }

  const handlePresetSelect = (indices: number[]) => {
    if (documents && documents.length > 0) {
      const ids = indices
        .map(i => documents[i % documents.length]?.id)
        .filter(Boolean)
      setSelectedPaperIds(ids)
      if (ids.length >= 2) {
        compareMutation.mutate(ids)
      }
    }
  }

  const filteredDocs = (documents || []).filter(doc => {
    const q = searchFilter.toLowerCase()
    return (
      doc.filename.toLowerCase().includes(q) ||
      (doc.paper_title && doc.paper_title.toLowerCase().includes(q)) ||
      (doc.author_names && doc.author_names.some(a => a.toLowerCase().includes(q)))
    )
  })

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Multi-Paper Comparison Matrix"
        subtitle="Side-by-side comparative analysis of methods, datasets, architectures, and results"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Paper Selection Card */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-border space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <GitCompare className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Select Research Papers for Comparative Matrix
                </h3>
              </div>
              <p className="text-xs text-muted-foreground pl-10">
                Choose 2 or more publications to synthesize deep architectural differences, benchmarks, and trade-offs.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleRunComparison}
                disabled={selectedPaperIds.length < 2 || compareMutation.isPending}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/20 active:scale-95"
              >
                {compareMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Comparative Matrix...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Compare {selectedPaperIds.length} Selected Papers</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Preset Pairs */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Presets:</span>
            </span>
            <button
              onClick={() => handlePresetSelect([0, 1])}
              className="px-3 py-1 rounded-lg bg-secondary/70 hover:bg-secondary border border-border text-xs text-foreground font-medium transition-all"
            >
              Transformers vs. ResNet
            </button>
            <button
              onClick={() => handlePresetSelect([1, 2])}
              className="px-3 py-1 rounded-lg bg-secondary/70 hover:bg-secondary border border-border text-xs text-foreground font-medium transition-all"
            >
              Vision Transformers vs. ConvNets
            </button>
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 rounded-lg bg-secondary/70 hover:bg-secondary border border-border text-xs text-teal-400 font-semibold transition-all"
            >
              Select All ({documents?.length || 0})
            </button>
            {selectedPaperIds.length > 0 && (
              <button
                onClick={handleClearSelection}
                className="px-3 py-1 rounded-lg text-xs text-rose-400 hover:text-rose-300 transition-all font-medium"
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* Search Filter for Papers */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter papers by title, author, or keyword..."
              className="w-full bg-slate-950/60 border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-teal-500/60 shadow-inner"
            />
          </div>

          {/* Paper Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {filteredDocs.map((doc) => {
              const isSelected = selectedPaperIds.includes(doc.id)
              return (
                <div
                  key={doc.id}
                  onClick={() => togglePaper(doc.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3 group relative ${
                    isSelected
                      ? 'border-teal-500/80 bg-teal-500/15 text-foreground shadow-lg shadow-teal-500/10'
                      : 'border-border/80 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:border-border'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    isSelected
                      ? 'bg-teal-400 border-teal-400 text-slate-950 font-bold'
                      : 'border-muted-foreground/40 group-hover:border-muted-foreground'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-bold text-foreground truncate group-hover:text-teal-300 transition-colors">
                      {doc.paper_title || doc.filename}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {doc.author_names?.slice(0, 2).join(', ') || 'Extracted Authors'}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-muted-foreground/80 font-mono pt-1">
                      <span className="px-1.5 py-0.5 rounded bg-background/60 border border-border/60">
                        {doc.status}
                      </span>
                      <span>{doc.filename}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Comparative Matrix Results */}
        {comparisonResult ? (
          <ComparisonTable data={comparisonResult} />
        ) : (
          <div className="py-20 text-center text-xs text-muted-foreground space-y-4 border border-dashed border-border/80 rounded-3xl glass-panel">
            <div className="w-12 h-12 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto text-teal-400">
              <GitCompare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-foreground text-sm">No comparison matrix generated yet</p>
              <p className="max-w-md mx-auto text-muted-foreground leading-relaxed">
                Select 2 or more research papers above and click <span className="text-teal-400 font-semibold">"Compare Selected Papers"</span> to automatically synthesize architecture paradigms, benchmark tables, and limitations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
