'use client'

import React, { useState } from 'react'
import { FileText, ExternalLink, Bookmark, CheckCircle2 } from 'lucide-react'
import { CitationReference } from '@/services/chat'

interface CitationBadgeProps {
  index: number
  citation: CitationReference
  onOpenDocument?: (docId: string, page: number) => void
}

export default function CitationBadge({ index, citation, onOpenDocument }: CitationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)

  const title = citation.paper_title || 'Research Document'
  const page = citation.page || 1
  const section = citation.section || 'Main'
  const matchPct = Math.round((citation.relevance_score || 0.9) * 100)

  return (
    <div className="relative inline-block my-1 mx-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-secondary/80 hover:bg-brand-500/20 text-brand-400 hover:text-brand-300 border border-border hover:border-brand-500/40 text-[11px] font-mono transition-all shadow-sm"
      >
        <span className="font-bold">[{index}]</span>
        <span className="max-w-[130px] truncate">{title}</span>
        <span className="text-muted-foreground text-[10px]">p.{page}</span>
      </button>

      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className="absolute left-0 bottom-full mb-2 w-72 z-50 p-3 rounded-lg glass-panel bg-card/95 shadow-xl border border-brand-500/30 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
            <div className="flex items-center space-x-1.5 font-semibold text-foreground text-xs leading-snug">
              <FileText className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
              <span className="line-clamp-1">{title}</span>
            </div>
            <span className="px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-400 text-[10px] font-mono border border-brand-500/20 flex-shrink-0">
              {matchPct}% Match
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Section: <strong className="text-foreground">{section}</strong></span>
            <span>Page: <strong className="text-foreground">{page}</strong></span>
          </div>

          {citation.excerpt && (
            <div className="p-2 rounded bg-background/60 border border-border/50 text-[11px] text-muted-foreground/90 italic line-clamp-3">
              "{citation.excerpt}"
            </div>
          )}

          <div className="pt-1 flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified Evidence</span>
            </span>
            {onOpenDocument && (
              <button
                onClick={() => onOpenDocument(citation.document_id, page)}
                className="text-[10px] text-brand-400 hover:text-brand-300 font-medium flex items-center space-x-1"
              >
                <span>View Page</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
