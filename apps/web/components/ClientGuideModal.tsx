'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  FileText,
  MessageSquare,
  Network,
  GitCompare,
  Lightbulb,
  Upload,
  CheckCircle2,
  ArrowRight,
  X,
  ShieldCheck,
  Zap,
  BookOpen,
  Download
} from 'lucide-react'

interface ClientGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

const GUIDE_STEPS = [
  {
    step: "01",
    title: "Ingest Research PDFs & arXiv Papers",
    subtitle: "Structure-aware parsing with page, section, and citation tracking",
    description: "Upload local PDF files or click 'Import from arXiv' with any arXiv ID or keyword. The multi-stage pipeline automatically extracts Title, Authors, Abstract, Section Headings, Entities (Models, Datasets, Metrics), and Bibliography citations.",
    badge: "Document Library",
    icon: Upload,
    color: "text-teal-400"
  },
  {
    step: "02",
    title: "Ask Natural Language Questions with Citation Proof",
    subtitle: "7-node LangGraph orchestrator guarantees 100% grounded answers",
    description: "Ask cross-paper questions in the AI Research Assistant. The orchestrator plans sub-queries, executes weighted hybrid vector + graph retrieval, synthesizes evidence, and strictly verifies every factual statement against retrieved chunks.",
    badge: "AI Research Assistant",
    icon: MessageSquare,
    color: "text-indigo-400"
  },
  {
    step: "03",
    title: "Explore the Multi-Hop Knowledge Graph",
    subtitle: "Interactive React Flow graph visualizer and entity reasoner",
    description: "Navigate semantic connections between papers, model architectures (e.g. ResNet, ViT, LLaMA), benchmark datasets (ImageNet, CIFAR-10), and empirical metrics. Click any node to open the properties drawer and expand 2-hop neighborhoods.",
    badge: "Knowledge Graph",
    icon: Network,
    color: "text-purple-400"
  },
  {
    step: "04",
    title: "Compare Methodologies & Discover Research Gaps",
    subtitle: "Structured side-by-side matrices and experiment hypothesis formulation",
    description: "Generate multi-paper comparative tables across architectures, training objectives, and scaling limits. Discover author-reported limitations and click 'Formulate Experiment Plan' to draft new scientific hypotheses.",
    badge: "Matrix & Gaps",
    icon: GitCompare,
    color: "text-pink-400"
  },
  {
    step: "05",
    title: "Export Research Dossiers & Citations",
    subtitle: "Publication-ready Markdown, BibTeX, and synthesized reports",
    description: "Organize paper collections in custom workspaces, write synthesis notes with LaTeX formula support, and export comprehensive research dossiers with full bibliographic grounding with 1 click.",
    badge: "Workspaces & Export",
    icon: Download,
    color: "text-emerald-400"
  }
]

export default function ClientGuideModal({ isOpen, onClose }: ClientGuideModalProps) {
  const [activeStep, setActiveStep] = useState(0)

  if (!isOpen) return null

  const current = GUIDE_STEPS[activeStep]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-card border border-border rounded-3xl p-6 md:p-8 glass-panel space-y-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border/80 pb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base md:text-lg font-bold text-foreground">DeepGraph AI — Client Quickstart Guide</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">v1.0</span>
              </div>
              <p className="text-xs text-muted-foreground">Comprehensive walkthrough for researchers, engineers, and client teams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-5 gap-2 relative z-10">
          {GUIDE_STEPS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`p-2.5 rounded-2xl border text-left transition-all space-y-1 ${
                activeStep === idx
                  ? 'bg-teal-500/15 border-teal-500/60 text-foreground shadow-sm'
                  : 'bg-secondary/40 border-border/70 text-muted-foreground hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold">{s.step}</span>
                {activeStep > idx && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </div>
              <p className="text-[11px] font-bold truncate leading-tight">{s.badge}</p>
            </button>
          ))}
        </div>

        {/* Active Step Content Card */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-border/80 space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center ${current.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Step {current.step}</span>
                <h4 className="text-base font-bold text-foreground">{current.title}</h4>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-xl border border-teal-500/20">
              {current.badge}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 relative z-10">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Citation Grounding • Zero Hallucination Guarantee</span>
          </div>

          <div className="flex items-center space-x-2">
            {activeStep > 0 && (
              <button
                onClick={() => setActiveStep(prev => prev - 1)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition-all"
              >
                Previous
              </button>
            )}
            {activeStep < GUIDE_STEPS.length - 1 ? (
              <button
                onClick={() => setActiveStep(prev => prev + 1)}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-all shadow-md shadow-teal-500/20 active:scale-95"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-all shadow-md shadow-teal-500/20 active:scale-95"
              >
                <span>Start Researching</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
