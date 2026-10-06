'use client'

import React, { useState, useEffect } from 'react'
import {
  Tag as TagIcon,
  Plus,
  X,
  Check,
  Trash2,
  Bookmark,
  Sparkles
} from 'lucide-react'

interface TagItem {
  id: string
  name: string
  color: string
  category: string
  description?: string
  paper_count?: number
}

interface TagManagerModalProps {
  isOpen: boolean
  onClose: () => void
  paperId?: string
  paperTitle?: string
  onTagsUpdated?: () => void
}

export default function TagManagerModal({
  isOpen,
  onClose,
  paperId,
  paperTitle,
  onTagsUpdated
}: TagManagerModalProps) {
  const [tags, setTags] = useState<TagItem[]>([])
  const [assignedTagIds, setAssignedTagIds] = useState<Set<string>>(new Set())
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#6366f1')
  const [newTagCategory, setNewTagCategory] = useState('Methodology')
  const [loading, setLoading] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  const presetColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6']

  const fetchTagsAndAssignments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tags`)
      if (res.ok) {
        const data = await res.json()
        setTags(data)
      }

      if (paperId) {
        const pRes = await fetch(`${API_BASE_URL}/tags/paper/${paperId}`)
        if (pRes.ok) {
          const pData = await pRes.json()
          setAssignedTagIds(new Set(pData.map((t: TagItem) => t.id)))
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchTagsAndAssignments()
    }
  }, [isOpen, paperId])

  if (!isOpen) return null

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
          category: newTagCategory
        })
      })
      if (res.ok) {
        const created = await res.json()
        setTags(prev => [...prev, created])
        setNewTagName('')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleTagAssignment = async (tagId: string) => {
    if (!paperId) return

    const newSet = new Set(assignedTagIds)
    if (newSet.has(tagId)) {
      newSet.delete(tagId)
    } else {
      newSet.add(tagId)
    }
    setAssignedTagIds(newSet)

    try {
      await fetch(`${API_BASE_URL}/tags/paper/${paperId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag_ids: Array.from(newSet)
        })
      })
      if (onTagsUpdated) onTagsUpdated()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <TagIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Paper Tags & Reading Lists</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {paperTitle && (
          <p className="text-xs text-slate-400">
            Categorizing: <span className="text-slate-200 font-medium">"{paperTitle}"</span>
          </p>
        )}

        {/* Existing Tags Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Select Classification Tags</label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {tags.map((tag) => {
              const isAssigned = assignedTagIds.has(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTagAssignment(tag.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    isAssigned
                      ? 'bg-indigo-500/25 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-700/60'
                  }`}
                  style={isAssigned ? { borderColor: tag.color, backgroundColor: `${tag.color}25` } : {}}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.name}</span>
                  {isAssigned && <Check className="w-3.5 h-3.5 ml-1" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Create Tag Section */}
        <form onSubmit={handleCreateTag} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-300 flex items-center space-x-1">
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Create New Tag</span>
          </span>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name (e.g. SOTA Baseline)"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />

            <select
              value={newTagCategory}
              onChange={(e) => setNewTagCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="Methodology">Methodology</option>
              <option value="Benchmark">Benchmark</option>
              <option value="Must-Read">Must-Read</option>
              <option value="Replication">Replication</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-1.5">
              {presetColors.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setNewTagColor(col)}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    newTagColor === col ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !newTagName.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all disabled:opacity-50"
            >
              Add Tag
            </button>
          </div>
        </form>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
