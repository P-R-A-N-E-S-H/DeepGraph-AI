'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Plus, Search, Tag, Trash2, Edit3, Bookmark as BookmarkIcon, CheckCircle2, BookOpen } from 'lucide-react'
import { notesService, ResearchNote, Bookmark } from '@/services/notes'
import { workspaceService, WorkspaceItem } from '@/services/workspaces'

export default function NotesPage() {
  const [notes, setNotes] = useState<ResearchNote[]>([])
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [activeTab, setActiveTab] = useState<'notes' | 'bookmarks'>('notes')
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('all')

  const loadData = async () => {
    try {
      const wsList = await workspaceService.listWorkspaces()
      setWorkspaces(wsList)
      const defaultWs = wsList.length > 0 ? wsList[0].id : ''
      setSelectedWorkspace(defaultWs)

      const notesData = await notesService.listNotes(defaultWs, searchQuery, selectedTag)
      setNotes(notesData)

      const bms = await notesService.listBookmarks()
      setBookmarks(bms)
    } catch (err) {
      console.error('Error loading notes:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSearch = async () => {
    try {
      const notesData = await notesService.listNotes(selectedWorkspace || undefined, searchQuery || undefined, selectedTag || undefined)
      setNotes(notesData)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) return

    try {
      const wsId = selectedWorkspace || (workspaces[0]?.id)
      if (!wsId) return

      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      const newNote = await notesService.createNote(wsId, title, content, tags)
      setNotes([newNote, ...notes])
      setTitle('')
      setContent('')
      setTagsInput('')
      setIsCreating(false)
    } catch (err) {
      console.error('Failed to create note:', err)
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      await notesService.deleteNote(id)
      setNotes(notes.filter(n => n.id !== id))
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || [])))

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-400" />
            Research Notes & Synthesis
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Annotate papers, capture literature insights, and organize collaborative bookmarks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'notes' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Notes ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'bookmarks' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bookmarks ({bookmarks.length})
            </button>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-brand-600/20"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search notes by keyword or paper citation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedTag}
            onChange={(e) => { setSelectedTag(e.target.value); handleSearch(); }}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>#{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Note Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-brand-400" />
              Create Literature Note
            </h3>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Note Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Attention Mechanism Scaling Bottleneck Analysis"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Content (Markdown supported)</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Summarize insights, methodology critiques, or hypothesis..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="transformers, efficiency, sota, gap"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-all"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content View */}
      {activeTab === 'notes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No research notes found</p>
              <p className="text-slate-500 text-sm mt-1">Capture findings by clicking "New Note" above.</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="group bg-slate-900/70 border border-slate-800 hover:border-brand-500/40 rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-brand-950/20"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-base group-hover:text-brand-300 transition-colors line-clamp-1">
                      {note.title}
                    </h3>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-slate-300 text-sm whitespace-pre-wrap line-clamp-4 leading-relaxed font-sans mb-4">
                    {note.content}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(note.tags || []).map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] bg-brand-950/60 text-brand-300 border border-brand-800/40 px-2 py-0.5 rounded-full"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                    <span>Updated {new Date(note.updated_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Synced
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Bookmarks View */
        <div className="space-y-4">
          {bookmarks.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <BookmarkIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No bookmarked papers yet</p>
              <p className="text-slate-500 text-sm mt-1">Bookmark papers from search or graph views to organize collections.</p>
            </div>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-950 border border-brand-800/50 rounded-lg text-brand-400">
                    <BookmarkIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Paper #{bm.paper_id.slice(0, 8)}</h4>
                    <p className="text-xs text-slate-400">Folder: <span className="text-slate-200 capitalize">{bm.folder}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{new Date(bm.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
