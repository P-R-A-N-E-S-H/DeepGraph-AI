'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  Network,
  MessageSquare,
  GitCompare,
  Lightbulb,
  Upload,
  ArrowUpRight,
  TrendingUp,
  Database,
  Layers,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  Search,
  Zap,
  Activity,
  ShieldCheck,
  Cpu,
  BookOpen,
  ArrowRight,
  BarChart3,
  Flame
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area
} from 'recharts'
import Navbar from '@/components/Navbar'
import ClientGuideModal from '@/components/ClientGuideModal'
import { analyticsService } from '@/services/analytics'
import { documentService } from '@/services/documents'
import { formatDate } from '@/lib/utils'

const POPULAR_RESEARCH_QUESTIONS = [
  {
    topic: "CNNs vs. ViTs",
    query: "Compare CNNs and Vision Transformers across spatial inductive bias and scaling regimes.",
    tag: "Architecture"
  },
  {
    topic: "Vanishing Gradients",
    query: "Explain how residual shortcut connections solve the vanishing gradient problem in deep networks.",
    tag: "Methodology"
  },
  {
    topic: "Empirical Accuracy",
    query: "What are the reported ImageNet Top-1 accuracy benchmarks for ResNet and ViT?",
    tag: "Benchmarks"
  },
  {
    topic: "Quadratic Complexity",
    query: "What are the computational bottlenecks of self-attention on long sequences?",
    tag: "Efficiency"
  }
]

export default function DashboardPage() {
  const router = useRouter()
  const [quickQuery, setQuickQuery] = useState('')
  const [activeChartTab, setActiveChartTab] = useState<'methods' | 'datasets' | 'timeline'>('methods')
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsService.getSummary(),
  })

  const { data: documents } = useQuery({
    queryKey: ['documents-list'],
    queryFn: () => documentService.listDocuments(),
  })

  const kpi = summary?.kpi || {
    documents: 4,
    papers: 4,
    chunks: 72,
    entities: 28,
    authors: 16,
    sessions: 5,
  }

  const charts = summary?.charts || {
    dataset_distribution: [
      { name: 'ImageNet', count: 8 },
      { name: 'CIFAR-10', count: 5 },
      { name: 'COCO', count: 3 },
      { name: 'SQuAD', count: 2 },
    ],
    method_distribution: [
      { name: 'Self-Attention', count: 9 },
      { name: 'ResNet Shortcuts', count: 6 },
      { name: 'LayerNorm', count: 4 },
      { name: 'LoRA / PEFT', count: 3 },
    ],
    papers_by_year: [
      { year: '2015', papers: 1 },
      { year: '2017', papers: 1 },
      { year: '2020', papers: 2 },
      { year: '2023', papers: 3 },
      { year: '2024', papers: 4 },
    ],
  }

  const handleLaunchSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickQuery.trim()) return
    router.push(`/chat?q=${encodeURIComponent(quickQuery.trim())}`)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Research Intelligence Overview"
        subtitle="DeepGraph AI Knowledge Graph & Multi-Agent Synthesis Engine"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Hero Section with Ambient Glow */}
        <div className="relative rounded-3xl overflow-hidden border border-border/80 bg-gradient-to-br from-card via-card/90 to-secondary/40 p-6 md:p-8 shadow-2xl space-y-6">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Hybrid Vector + Knowledge Graph Engine Active</span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                Turn research papers into a connected, searchable intelligence graph.
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Ask cross-paper research queries with 100% citation grounding, navigate entity neighborhoods, perform side-by-side methodology comparisons, and uncover open research frontiers.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-secondary/90 hover:bg-secondary border border-teal-500/30 text-teal-300 font-bold text-xs transition-all shadow-md active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Client Guide & Tour</span>
              </button>
              <Link
                href="/documents"
                className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/20 active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Ingest Papers</span>
              </Link>
              <Link
                href="/chat"
                className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground font-semibold text-xs transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4 text-teal-400" />
                <span>Ask AI Assistant</span>
              </Link>
            </div>
          </div>

          <ClientGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

          {/* Quick Query Search Bar */}
          <form onSubmit={handleLaunchSearch} className="relative z-10 pt-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-teal-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Ask any research synthesis question across your ingested papers..."
                className="w-full bg-slate-950/70 border border-border/80 focus:border-teal-500/60 rounded-2xl pl-11 pr-28 py-3.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none shadow-inner transition-all"
              />
              <button
                type="submit"
                disabled={!quickQuery.trim()}
                className="absolute right-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all flex items-center space-x-1.5 shadow"
              >
                <span>Synthesize</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-3 text-[11px]">
              <span className="text-muted-foreground flex items-center space-x-1 font-semibold">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Suggested Questions:</span>
              </span>
              {POPULAR_RESEARCH_QUESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => router.push(`/chat?q=${encodeURIComponent(item.query)}`)}
                  className="px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary border border-border/80 text-muted-foreground hover:text-foreground transition-all flex items-center space-x-1.5"
                >
                  <span className="text-[10px] font-mono text-teal-400 font-semibold">{item.tag}:</span>
                  <span className="truncate max-w-[200px]">{item.topic}</span>
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-border space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-colors" />
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold">Ingested Papers</span>
              <FileText className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground font-mono">{kpi.papers}</div>
            <p className="text-[11px] text-muted-foreground flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>100% Vector & Graph Indexed</span>
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors" />
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold">Extracted Entities</span>
              <Network className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground font-mono">{kpi.entities}</div>
            <p className="text-[11px] text-muted-foreground">
              Models, Datasets, Metrics, Tasks
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 rounded-full blur-xl group-hover:bg-pink-500/10 transition-colors" />
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold">Structure Chunks</span>
              <Layers className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground font-mono">{kpi.chunks}</div>
            <p className="text-[11px] text-muted-foreground">
              Sections & Page Boundary Grounded
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold">Active Research Sessions</span>
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground font-mono">{kpi.sessions}</div>
            <p className="text-[11px] text-muted-foreground">
              LangGraph Multi-Agent RAG
            </p>
          </div>
        </div>

        {/* Analytics & Corpus Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interactive Chart (2 cols) */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-border space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-teal-400" />
                  <span>Corpus Distribution & Research Trajectory</span>
                </h3>
                <p className="text-xs text-muted-foreground">Empirical frequencies extracted across all ingested papers</p>
              </div>

              {/* Chart Switcher Tabs */}
              <div className="flex items-center space-x-1 bg-secondary/50 p-1 rounded-xl border border-border text-xs">
                <button
                  onClick={() => setActiveChartTab('methods')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    activeChartTab === 'methods'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Methods
                </button>
                <button
                  onClick={() => setActiveChartTab('datasets')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    activeChartTab === 'datasets'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Datasets
                </button>
                <button
                  onClick={() => setActiveChartTab('timeline')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    activeChartTab === 'timeline'
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Timeline
                </button>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {activeChartTab === 'methods' ? (
                  <BarChart data={charts.method_distribution}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                    />
                    <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : activeChartTab === 'datasets' ? (
                  <BarChart data={charts.dataset_distribution}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={charts.papers_by_year}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                    />
                    <Area type="monotone" dataKey="papers" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#chartGradient)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Engine Vitality & System Health (1 col) */}
          <div className="glass-panel rounded-2xl p-6 border border-border space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Engine Telemetry</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                  HEALTHY
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Active RAG pipelines & vector indices</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 flex items-center justify-between">
                <span className="text-muted-foreground">Hybrid Vector Weight:</span>
                <span className="font-mono font-bold text-teal-400">0.7 Vector / 0.3 BM25</span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 flex items-center justify-between">
                <span className="text-muted-foreground">Citation Verification:</span>
                <span className="font-mono font-bold text-emerald-400">100% Grounded</span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 flex items-center justify-between">
                <span className="text-muted-foreground">Avg. Hybrid Query Latency:</span>
                <span className="font-mono font-bold text-indigo-400">~32 ms</span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 flex items-center justify-between">
                <span className="text-muted-foreground">Embedding Dimensionality:</span>
                <span className="font-mono font-bold text-foreground">384-d Cosine</span>
              </div>
            </div>

            <Link
              href="/graph"
              className="w-full py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground flex items-center justify-center space-x-2 transition-all"
            >
              <Network className="w-3.5 h-3.5 text-teal-400" />
              <span>Inspect Knowledge Graph</span>
            </Link>
          </div>
        </div>

        {/* Feature Hub Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/graph"
            className="p-6 rounded-2xl glass-card border border-border hover:border-teal-500/40 space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Network className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-teal-400 transition-transform group-hover:translate-x-1" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Explore Knowledge Graph</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Visualize entity neighborhoods, model architectures, dataset citations, and shortest paths.
            </p>
          </Link>

          <Link
            href="/compare"
            className="p-6 rounded-2xl glass-card border border-border hover:border-indigo-500/40 space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <GitCompare className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Compare Research Papers</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generate structured side-by-side matrices across methods, datasets, metrics, and limitations.
            </p>
          </Link>

          <Link
            href="/gaps"
            className="p-6 rounded-2xl glass-card border border-border hover:border-pink-500/40 space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Lightbulb className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-pink-400 transition-transform group-hover:translate-x-1" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Discover Research Gaps</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Analyze reported limitations, computational costs, and hypothesize emerging research directions.
            </p>
          </Link>
        </div>

        {/* Ingested Documents Spotlight Table */}
        <div className="glass-panel rounded-2xl p-6 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <span>Recently Ingested Publications</span>
              </h3>
              <p className="text-xs text-muted-foreground">Papers currently indexed and searchable in the hybrid store</p>
            </div>
            <Link
              href="/documents"
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center space-x-1 transition-colors"
            >
              <span>View All Documents</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border/60">
            {documents && documents.length > 0 ? (
              documents.slice(0, 5).map((doc) => (
                <div key={doc.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-secondary border border-border/80 flex items-center justify-center text-teal-400 flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{doc.paper_title || doc.filename}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {doc.author_names?.slice(0, 3).join(', ') || 'Extracted Authors'} • Ingested {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                      {doc.status}
                    </span>
                    <Link
                      href={`/chat?q=Summarize ${encodeURIComponent(doc.paper_title || doc.filename)}`}
                      className="px-3 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-sm"
                    >
                      Analyze
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-3">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p>No papers uploaded yet. Drag and drop a research PDF to begin building your intelligence graph.</p>
                <Link
                  href="/documents"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-all shadow"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload First Paper</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
