'use client'

import React, { useState } from 'react'
import {
  Download,
  Copy,
  Check,
  FileCode,
  X,
  Share2,
  BookMarked
} from 'lucide-react'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  paperIds?: string[]
  workspaceId?: string
  paperTitle?: string
}

export default function ExportDialog({
  isOpen,
  onClose,
  paperIds = [],
  workspaceId,
  paperTitle
}: ExportDialogProps) {
  const [format, setFormat] = useState<'bibtex' | 'ris' | 'csl' | 'apa' | 'ieee'>('bibtex')
  const [copied, setCopied] = useState(false)
  const [previewContent, setPreviewContent] = useState<string>('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  const handleFetchPreview = async (selectedFormat: string) => {
    setLoading(true)
    try {
      let url = ''
      const pIds = paperIds.join(',')
      if (selectedFormat === 'bibtex') {
        url = `${API_BASE_URL}/export/bibtex?paper_ids=${pIds}${workspaceId ? `&workspace_id=${workspaceId}` : ''}`
      } else if (selectedFormat === 'ris') {
        url = `${API_BASE_URL}/export/ris?paper_ids=${pIds}${workspaceId ? `&workspace_id=${workspaceId}` : ''}`
      } else if (selectedFormat === 'csl') {
        url = `${API_BASE_URL}/export/csl-json?paper_ids=${pIds}${workspaceId ? `&workspace_id=${workspaceId}` : ''}`
      } else if (paperIds.length > 0) {
        url = `${API_BASE_URL}/export/paper/${paperIds[0]}/formatted?style=${selectedFormat}`
      }

      if (url) {
        const res = await fetch(url)
        if (selectedFormat === 'csl' || selectedFormat === 'apa' || selectedFormat === 'ieee') {
          const json = await res.json()
          setPreviewContent(typeof json === 'string' ? json : JSON.stringify(json, null, 2))
        } else {
          const txt = await res.text()
          setPreviewContent(txt)
        }
      }
    } catch (err) {
      console.error('Error fetching export preview:', err)
      setPreviewContent('@article{export_error,\n  title = {Failed to generate citation}\n}')
    } finally {
      setLoading(false)
    }
  }

  const handleFormatChange = (newFormat: 'bibtex' | 'ris' | 'csl' | 'apa' | 'ieee') => {
    setFormat(newFormat)
    handleFetchPreview(newFormat)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const ext = format === 'bibtex' ? 'bib' : format === 'ris' ? 'ris' : format === 'csl' ? 'json' : 'txt'
    const blob = new Blob([previewContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `citations_${Date.now()}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-brand-400" />
            <h3 className="text-lg font-semibold text-white">Export Academic Citations</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {paperTitle && (
          <p className="text-xs text-slate-400">
            Exporting reference for: <span className="text-slate-200 font-medium">"{paperTitle}"</span>
          </p>
        )}

        {/* Format Selector */}
        <div className="flex flex-wrap gap-2">
          {(['bibtex', 'ris', 'csl', 'apa', 'ieee'] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFormatChange(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase transition-all ${
                format === f
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {f === 'csl' ? 'CSL-JSON' : f}
            </button>
          ))}
        </div>

        {/* Preview Area */}
        <div className="relative">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 min-h-[160px] max-h-[260px] overflow-auto whitespace-pre-wrap leading-relaxed">
            {loading ? (
              <div className="flex items-center justify-center h-28 text-slate-500 gap-2">
                <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                Formatting citation...
              </div>
            ) : previewContent ? (
              previewContent
            ) : (
              <span className="text-slate-500">Select a format above to preview or download references.</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-[11px] text-slate-500 font-mono">
            Compatible with Zotero, Mendeley, EndNote & LaTeX
          </span>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!previewContent || loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={handleDownload}
              disabled={!previewContent || loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-brand-600/20 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Download .{format === 'bibtex' ? 'bib' : format === 'ris' ? 'ris' : 'json'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
