'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FolderKanban,
  Plus,
  BookOpen,
  FileText,
  Download,
  Sparkles,
  Tag,
  Save,
  CheckCircle2,
  Search,
  Eye,
  Edit3,
  Copy,
  Check,
  Trash2
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import StreamingMarkdown from '@/components/StreamingMarkdown'
import { workspaceService, WorkspaceItem, ResearchNoteItem } from '@/services/workspaces'
import { formatDate } from '@/lib/utils'

export default function WorkspacesPage() {
  const queryClient = useQueryClient()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('default-ws')
  const [newWsName, setNewWsName] = useState('')
  const [newWsDesc, setNewWsDesc] = useState('')
  const [isCreatingWs, setIsCreatingWs] = useState(false)
  const [copiedDossier, setCopiedDossier] = useState(false)

  // Note creation form state
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteTagInput, setNoteTagInput] = useState('')
  const [notePreviewMode, setNotePreviewMode] = useState<'edit' | 'preview'>('edit')
  const [noteSearchQuery, setNoteSearchQuery] = useState('')

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces-list'],
    queryFn: () => workspaceService.listWorkspaces(),
  })

  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ['workspace-notes', selectedWorkspaceId],
    queryFn: () => workspaceService.listNotes(selectedWorkspaceId),
    enabled: !!selectedWorkspaceId,
  })

  const createWsMutation = useMutation({
    mutationFn: () => workspaceService.createWorkspace(newWsName, newWsDesc),
    onSuccess: (ws) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces-list'] })
      setSelectedWorkspaceId(ws.id)
      setIsCreatingWs(false)
      setNewWsName('')
      setNewWsDesc('')
    },
  })

  const createNoteMutation = useMutation({
    mutationFn: () => {
      const tags = noteTagInput.split(',').map(t => t.trim()).filter(Boolean)
      return workspaceService.createNote(selectedWorkspaceId, noteTitle, noteContent, tags)
    },
    onSuccess: () => {
      refetchNotes()
      setNoteTitle('')
      setNoteContent('')
      setNoteTagInput('')
    },
  })

  const handleExportMarkdown = async () => {
    try {
      const md = await workspaceService.exportMarkdown(selectedWorkspaceId)
      const blob = new Blob([md], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DeepGraph_Workspace_Dossier.md`
      a.click()
    } catch (err) {
      console.error('Failed to export markdown:', err)
    }
  }

  const handleCopyMarkdown = async () => {
    try {
      const md = await workspaceService.exportMarkdown(selectedWorkspaceId)
      navigator.clipboard.writeText(md)
      setCopiedDossier(true)
      setTimeout(() => setCopiedDossier(false), 2000)
    } catch (err) {
      console.error('Failed to copy markdown:', err)
    }
  }

  const currentWsList = workspaces && workspaces.length > 0 ? workspaces : [
    {
      id: 'default-ws',
      name: 'Foundation Vision Architectures',
      description: 'Curated research on CNNs, Vision Transformers, and Scaling Laws',
      document_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]

  const currentNotesList: ResearchNoteItem[] = notes && notes.length > 0 ? notes : [
    {
      id: 'note-1',
      workspace_id: 'default-ws',
      title: 'Inductive Biases vs. Data Scaling Trade-off',
      content: `### Core Empirical Findings\n\nConvolutional neural networks maintain strong spatial inductive priors (**translation invariance** and **locality**) that make them sample efficient on small datasets ($<10^6$ samples).\n\n$$\\text{Complexity}_{\\text{ViT}} = \\mathcal{O}(N^2 \\cdot D)$$\n\nVision Transformers achieve superior asymptotic capacity when paired with $100M+$ pretraining images by learning arbitrary receptive fields across attention layers.`,
      tags: ['ViT', 'CNN', 'Inductive Bias', 'Complexity'],
      citations: [{ paper_title: 'Vision Transformers & ResNet', page: 3, section: 'Methodology' }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  const filteredNotes = currentNotesList.filter(n => {
    const q = noteSearchQuery.toLowerCase()
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
    )
  })

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Research Workspaces & Notebook"
        subtitle="Organize paper collections, record synthesis notes, and export publication-ready dossiers"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Workspace Management Header */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Workspace:</span>
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="bg-slate-950/70 border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-teal-500"
                >
                  {currentWsList.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentWsList.find(w => w.id === selectedWorkspaceId)?.description || 'Research workspace and dossier studio'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsCreatingWs(!isCreatingWs)}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-xs font-semibold text-foreground transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" />
              <span>New Workspace</span>
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-xs font-semibold text-foreground transition-all active:scale-95"
              title="Copy Dossier Markdown"
            >
              {copiedDossier ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDossier ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleExportMarkdown}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dossier (MD)</span>
            </button>
          </div>
        </div>

        {/* Modal / Panel for Creating New Workspace */}
        {isCreatingWs && (
          <div className="glass-card rounded-2xl p-6 border border-teal-500/30 space-y-4 shadow-xl animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider">Create New Research Workspace</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <input
                type="text"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="Workspace Name (e.g. Efficient Multimodal RAG)..."
                className="bg-slate-950/60 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-teal-500 shadow-inner"
              />
              <input
                type="text"
                value={newWsDesc}
                onChange={(e) => setNewWsDesc(e.target.value)}
                placeholder="Description / Scientific Goals..."
                className="bg-slate-950/60 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-teal-500 shadow-inner"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsCreatingWs(false)}
                className="px-4 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => createWsMutation.mutate()}
                disabled={!newWsName.trim() || createWsMutation.isPending}
                className="px-5 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-all shadow"
              >
                Create Workspace
              </button>
            </div>
          </div>
        )}

        {/* Research Notebook Form & Notes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Note Creation Form (1 col) */}
          <div className="glass-panel rounded-3xl p-6 border border-border space-y-5 h-fit shadow-xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-foreground">Add Research Note</h3>
              </div>
              <div className="flex items-center space-x-1 bg-secondary/50 p-0.5 rounded-lg border border-border text-[11px]">
                <button
                  type="button"
                  onClick={() => setNotePreviewMode('edit')}
                  className={`px-2 py-0.5 rounded font-medium transition-all ${
                    notePreviewMode === 'edit' ? 'bg-card text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setNotePreviewMode('preview')}
                  className={`px-2 py-0.5 rounded font-medium transition-all ${
                    notePreviewMode === 'preview' ? 'bg-card text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">Note Title</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Attention Complexity vs. FlashAttention IO"
                  className="w-full mt-1 bg-slate-950/60 border border-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none focus:border-teal-500 shadow-inner"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">Synthesis & Technical Content (Markdown & LaTeX)</label>
                {notePreviewMode === 'edit' ? (
                  <textarea
                    rows={6}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write your research synthesis, math formulas, or empirical takeaways..."
                    className="w-full mt-1 bg-slate-950/60 border border-border rounded-xl p-3.5 text-xs text-foreground focus:outline-none focus:border-teal-500 shadow-inner"
                  />
                ) : (
                  <div className="w-full mt-1 min-h-[140px] p-3.5 rounded-xl bg-slate-950/40 border border-border/80 text-xs overflow-y-auto max-h-60">
                    {noteContent ? (
                      <StreamingMarkdown content={noteContent} />
                    ) : (
                      <span className="text-muted-foreground italic">Type something in edit mode to see preview...</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={noteTagInput}
                  onChange={(e) => setNoteTagInput(e.target.value)}
                  placeholder="e.g. ViT, FlashAttention, Complexity"
                  className="w-full mt-1 bg-slate-950/60 border border-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none focus:border-teal-500 shadow-inner"
                />
              </div>

              <button
                onClick={() => createNoteMutation.mutate()}
                disabled={!noteTitle.trim() || !noteContent.trim() || createNoteMutation.isPending}
                className="w-full py-3 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-teal-500/20 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to Research Notebook</span>
              </button>
            </div>
          </div>

          {/* Saved Notes Feed (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-foreground">
                Workspace Research Notes ({filteredNotes.length})
              </h3>

              <div className="relative w-64">
                <Search className="w-3 h-3 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={noteSearchQuery}
                  onChange={(e) => setNoteSearchQuery(e.target.value)}
                  placeholder="Filter notes by title or tags..."
                  className="w-full bg-slate-950/60 border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-teal-500 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="glass-card rounded-3xl p-6 border border-border space-y-4 shadow-xl relative"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-base font-bold text-foreground">{note.title}</h4>
                    <span className="text-[10px] text-muted-foreground font-mono bg-secondary/80 px-2.5 py-1 rounded-lg border border-border">
                      {formatDate(note.created_at)}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/50 border border-border/80">
                    <StreamingMarkdown content={note.content} />
                  </div>

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {note.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-secondary/80 text-teal-300 text-[10px] font-medium border border-border">
                          <Tag className="w-2.5 h-2.5 text-teal-400" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {note.citations && note.citations.length > 0 && (
                    <div className="pt-3 border-t border-border/60 text-[11px] text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Grounded References: {note.citations.map((c: any) => c.paper_title || 'Paper').join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
