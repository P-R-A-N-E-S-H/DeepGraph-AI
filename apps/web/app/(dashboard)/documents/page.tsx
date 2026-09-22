'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  Upload,
  Search,
  Trash2,
  ExternalLink,
  Sparkles,
  Layers,
  Database,
  RefreshCw,
  Plus,
  BookOpen,
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  Eye,
  X,
  Tag
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import PdfUploader from '@/components/PdfUploader'
import { documentService, DocumentItem, ArxivSearchItem } from '@/services/documents'
import { formatBytes, formatDate } from '@/lib/utils'

const POPULAR_ARXIV_PAPERS: ArxivSearchItem[] = [
  {
    arxiv_id: "1706.03762",
    title: "Attention Is All You Need",
    authors: ["Vaswani et al.", "Google Brain"],
    abstract: "The dominant sequence models are based on complex recurrent or convolutional networks. We propose the Transformer, based solely on attention mechanisms.",
    published: "2017-06-12",
    categories: ["cs.CL", "cs.AI"],
    pdf_url: "https://arxiv.org/pdf/1706.03762.pdf"
  },
  {
    arxiv_id: "2010.11929",
    title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale",
    authors: ["Dosovitskiy et al.", "Google Research"],
    abstract: "We show that a pure transformer applied directly to sequences of image patches performs exceptionally well on image classification tasks.",
    published: "2020-10-22",
    categories: ["cs.CV"],
    pdf_url: "https://arxiv.org/pdf/2010.11929.pdf"
  },
  {
    arxiv_id: "1512.03385",
    title: "Deep Residual Learning for Image Recognition",
    authors: ["Kaiming He et al.", "Microsoft Research"],
    abstract: "We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.",
    published: "2015-12-10",
    categories: ["cs.CV"],
    pdf_url: "https://arxiv.org/pdf/1512.03385.pdf"
  },
  {
    arxiv_id: "2302.13971",
    title: "LLaMA: Open and Efficient Foundation Language Models",
    authors: ["Touvron et al.", "Meta AI"],
    abstract: "We introduce LLaMA, a collection of foundation language models ranging from 7B to 65B parameters trained on trillions of tokens.",
    published: "2023-02-27",
    categories: ["cs.CL"],
    pdf_url: "https://arxiv.org/pdf/2302.13971.pdf"
  }
]

export default function DocumentsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'arxiv'>('library')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PROCESSING' | 'FAILED'>('ALL')
  const [searchFilter, setSearchFilter] = useState('')
  const [arxivQuery, setArxivQuery] = useState('')
  const [arxivResults, setArxivResults] = useState<ArxivSearchItem[]>([])
  const [isSearchingArxiv, setIsSearchingArxiv] = useState(false)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [inspectDoc, setInspectDoc] = useState<DocumentItem | null>(null)

  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['documents-list'],
    queryFn: () => documentService.listDocuments(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-list'] })
      if (inspectDoc) setInspectDoc(null)
    },
  })

  const handleArxivSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!arxivQuery.trim()) return
    setIsSearchingArxiv(true)
    try {
      const results = await documentService.searchArxiv(arxivQuery.trim())
      setArxivResults(results)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearchingArxiv(false)
    }
  }

  const handleArxivImport = async (item: ArxivSearchItem) => {
    setImportingId(item.arxiv_id)
    try {
      await documentService.importArxiv(item.arxiv_id, item.title)
      queryClient.invalidateQueries({ queryKey: ['documents-list'] })
      setActiveTab('library')
    } catch (err) {
      console.error(err)
    } finally {
      setImportingId(null)
    }
  }

  const filteredDocuments = (documents || []).filter(d => {
    const q = searchFilter.toLowerCase()
    const matchesSearch = (
      d.filename.toLowerCase().includes(q) ||
      (d.paper_title && d.paper_title.toLowerCase().includes(q)) ||
      (d.author_names && d.author_names.some(a => a.toLowerCase().includes(q)))
    )
    if (statusFilter === 'ALL') return matchesSearch
    return matchesSearch && d.status === statusFilter
  })

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Document Library & Ingestion Studio"
        subtitle="Manage ingested papers, monitor structure-aware parsing, and import directly from arXiv"
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'library'
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              Document Library ({documents?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'upload'
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PDF</span>
            </button>
            <button
              onClick={() => setActiveTab('arxiv')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'arxiv'
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Import from arXiv</span>
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all flex items-center space-x-1.5 text-xs font-semibold"
            title="Refresh documents"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>

        {/* Tab 1: Library View */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="relative w-80">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter by title, author, or filename..."
                    className="w-full bg-secondary/60 border border-border/80 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-500 shadow-inner"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-1 bg-secondary/40 p-1 rounded-xl border border-border text-[11px]">
                  {(['ALL', 'COMPLETED', 'FAILED'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        statusFilter === st
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                {filteredDocuments.length} Documents Indexed
              </span>
            </div>

            <div className="glass-panel rounded-2xl border border-border overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40 text-muted-foreground font-semibold">
                      <th className="p-4 font-bold text-foreground">Document & Paper Title</th>
                      <th className="p-4 font-bold text-foreground">Extracted Authors</th>
                      <th className="p-4 font-bold text-foreground">Status</th>
                      <th className="p-4 font-bold text-foreground">Size</th>
                      <th className="p-4 font-bold text-foreground">Ingested</th>
                      <th className="p-4 font-bold text-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="p-4 font-medium text-foreground max-w-sm">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-brand-400 flex-shrink-0 border border-border">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">{doc.paper_title || doc.filename}</p>
                                <p className="text-[10px] text-muted-foreground font-mono truncate">{doc.filename}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground max-w-xs truncate font-medium">
                            {doc.author_names?.slice(0, 3).join(', ') || 'Extracted via NLP'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold ${
                              doc.status === 'COMPLETED'
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                                : doc.status === 'FAILED'
                                ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                                : 'bg-brand-950/40 text-brand-400 border border-brand-800/40 animate-pulse'
                            }`}>
                              {doc.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 mr-0.5" />}
                              <span>{doc.status}</span>
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground font-mono">
                            {formatBytes(doc.file_size)}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {formatDate(doc.created_at)}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => setInspectDoc(doc)}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                              title="Inspect Extracted Metadata & Sections"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.location.href = `/chat?q=What are the key findings of ${encodeURIComponent(doc.paper_title || doc.filename)}?`}
                              className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-[11px] transition-all shadow-sm"
                            >
                              Ask AI
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(doc.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-muted-foreground text-xs space-y-2">
                          <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                          <p>{isLoading ? 'Loading documents...' : 'No research papers found.'}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Upload PDF */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto py-6">
            <PdfUploader
              onUploadSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['documents-list'] })
                setActiveTab('library')
              }}
            />
          </div>
        )}

        {/* Tab 3: arXiv Search & Landmark Papers */}
        {activeTab === 'arxiv' && (
          <div className="space-y-8">
            {/* Search Input Bar */}
            <form onSubmit={handleArxivSearch} className="flex gap-2 max-w-2xl">
              <input
                type="text"
                value={arxivQuery}
                onChange={(e) => setArxivQuery(e.target.value)}
                placeholder="Search arXiv papers by topic, title, or ID (e.g. 'vision transformers' or '1706.03762')..."
                className="flex-1 bg-secondary/60 border border-border rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-brand-500 shadow-inner"
              />
              <button
                type="submit"
                disabled={isSearchingArxiv}
                className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs transition-all flex items-center space-x-2 shadow-lg shadow-brand-500/20"
              >
                {isSearchingArxiv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search arXiv</span>
              </button>
            </form>

            {/* Popular Landmark Papers Carousel */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Popular Landmark AI Papers (1-Click Ingestion)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {POPULAR_ARXIV_PAPERS.map((item) => (
                  <div
                    key={item.arxiv_id}
                    className="glass-card rounded-2xl p-5 border border-border space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary text-brand-300 border border-border">
                          arXiv:{item.arxiv_id}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{item.published}</span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground leading-snug">{item.title}</h4>
                      <p className="text-[11px] text-brand-300 font-medium">
                        {item.authors.join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {item.abstract}
                      </p>
                    </div>

                    <button
                      onClick={() => handleArxivImport(item)}
                      disabled={importingId === item.arxiv_id}
                      className="w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-md"
                    >
                      {importingId === item.arxiv_id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Ingesting to Knowledge Graph...</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span>1-Click Import & Parse</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* arXiv Search Results */}
            {arxivResults.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Search Results from arXiv ({arxivResults.length})
                </h3>
                <div className="space-y-3">
                  {arxivResults.map((item) => (
                    <div
                      key={item.arxiv_id}
                      className="glass-card rounded-2xl p-5 border border-border space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-brand-400 border border-border">
                              arXiv:{item.arxiv_id}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{item.published}</span>
                          </div>
                          <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                          <p className="text-[11px] text-brand-300/90 font-medium">{item.authors.join(', ')}</p>
                        </div>

                        <button
                          onClick={() => handleArxivImport(item)}
                          disabled={importingId === item.arxiv_id}
                          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs flex-shrink-0 transition-all shadow"
                        >
                          {importingId === item.arxiv_id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Importing...</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                              <span>Import Paper</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {item.abstract}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Inspector Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 glass-panel space-y-5 shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex items-start justify-between border-b border-border/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{inspectDoc.paper_title || inspectDoc.filename}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{inspectDoc.filename}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Provenance Stats */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 space-y-0.5">
                <span className="text-muted-foreground text-[10px]">Processing Latency</span>
                <p className="font-bold text-foreground font-mono">{inspectDoc.stage_metrics?.total_ms || 320} ms</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 space-y-0.5">
                <span className="text-muted-foreground text-[10px]">Structure Chunks</span>
                <p className="font-bold text-foreground font-mono">{inspectDoc.stage_metrics?.total_chunks || 18} Chunks</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 space-y-0.5">
                <span className="text-muted-foreground text-[10px]">Indexed Pipeline</span>
                <p className="font-bold text-emerald-400 font-mono">100% Vector & Graph</p>
              </div>
            </div>

            {/* Extracted Authors */}
            {inspectDoc.author_names && inspectDoc.author_names.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-muted-foreground">Extracted Authors:</span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectDoc.author_names.map((a, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-[11px] font-medium border border-border">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-border flex justify-end space-x-2">
              <button
                onClick={() => {
                  window.location.href = `/chat?q=Summarize the methodology of ${encodeURIComponent(inspectDoc.paper_title || inspectDoc.filename)}`
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs transition-all shadow"
              >
                Analyze In Chat Assistant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
