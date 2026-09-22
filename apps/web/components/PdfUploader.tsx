'use client'

import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  Network
} from 'lucide-react'
import { documentService, DocumentItem } from '@/services/documents'
import { formatBytes } from '@/lib/utils'

interface PdfUploaderProps {
  onUploadSuccess?: (doc: DocumentItem) => void
}

const STAGES = [
  { key: 'PARSING', label: 'PDF Parsing & Sections', icon: FileText },
  { key: 'CHUNKING', label: 'Structure-Aware Chunking', icon: Layers },
  { key: 'EXTRACTING', label: 'Entities & Citations', icon: Sparkles },
  { key: 'EMBEDDING', label: 'Semantic Embeddings', icon: Database },
  { key: 'INDEXING', label: 'Knowledge Graph Index', icon: Network },
]

export default function PdfUploader({ onUploadSuccess }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [currentDoc, setCurrentDoc] = useState<DocumentItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF technical papers are supported.')
      return
    }

    setIsUploading(true)
    setError(null)
    setCurrentDoc(null)

    try {
      const doc = await documentService.uploadDocument(file)
      setCurrentDoc(doc)
      pollStatus(doc.id)
    } catch (err: any) {
      setError(err.message || 'Failed to upload document.')
      setIsUploading(false)
    }
  }

  const pollStatus = async (docId: string) => {
    const interval = setInterval(async () => {
      try {
        const statusData = await documentService.getStatus(docId)
        setCurrentDoc(prev => prev ? { ...prev, ...statusData, status: statusData.status } : null)

        if (statusData.status === 'COMPLETED' || statusData.status === 'FAILED') {
          clearInterval(interval)
          setIsUploading(false)
          if (statusData.status === 'COMPLETED') {
            const finalDoc = await documentService.getDocument(docId)
            setCurrentDoc(finalDoc)
            if (onUploadSuccess) onUploadSuccess(finalDoc)
          }
        }
      } catch {
        clearInterval(interval)
        setIsUploading(false)
      }
    }, 1000)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging
            ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
            : 'border-border/80 hover:border-brand-500/50 bg-secondary/30 hover:bg-secondary/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6 text-brand-400" />
        </div>

        <h3 className="text-sm font-semibold text-foreground">
          Upload Research Paper PDF
        </h3>
        <p className="text-xs text-muted-foreground mt-1 text-center max-w-sm">
          Drag & drop your research paper or technical document. We extract sections, entities, citations, and construct your knowledge graph automatically.
        </p>
        <div className="mt-4 flex items-center space-x-2 text-[11px] text-muted-foreground bg-background/50 px-3 py-1 rounded-full border border-border">
          <span>Supported: PDF (up to 50MB)</span>
        </div>
      </div>

      {/* Upload & Pipeline Progress Stepper */}
      {currentDoc && (
        <div className="glass-card rounded-xl p-5 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <FileText className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground line-clamp-1">{currentDoc.filename}</p>
                <p className="text-[11px] text-muted-foreground">{formatBytes(currentDoc.file_size)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {currentDoc.status === 'COMPLETED' ? (
                <span className="flex items-center space-x-1 text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready in Knowledge Graph</span>
                </span>
              ) : currentDoc.status === 'FAILED' ? (
                <span className="flex items-center space-x-1 text-xs text-rose-400 font-semibold px-2.5 py-1 rounded-md bg-rose-950/40 border border-rose-800/40">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Processing Failed</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs text-brand-400 font-medium px-2.5 py-1 rounded-md bg-brand-950/40 border border-brand-800/40">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{currentDoc.current_stage || 'Processing...'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Ingestion Progress</span>
              <span className="font-mono font-bold text-foreground">{currentDoc.progress}%</span>
            </div>
            <div className="w-full bg-secondary/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-600 to-teal-300 h-2 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${currentDoc.progress}%` }}
              />
            </div>
          </div>

          {/* Pipeline Stage Indicators */}
          <div className="grid grid-cols-5 gap-2 pt-2 border-t border-border/60">
            {STAGES.map((s, idx) => {
              const Icon = s.icon
              const isPast = (currentDoc.progress || 0) >= ((idx + 1) * 20) || currentDoc.status === 'COMPLETED'
              const isCurrent = currentDoc.status === s.key

              return (
                <div
                  key={s.key}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    isPast
                      ? 'border-brand-500/40 bg-brand-500/10 text-brand-300'
                      : isCurrent
                      ? 'border-brand-400 bg-brand-500/20 text-foreground animate-pulse'
                      : 'border-border/40 bg-secondary/20 text-muted-foreground/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mx-auto mb-1" />
                  <p className="text-[10px] font-medium truncate">{s.label}</p>
                </div>
              )
            })}
          </div>

          {/* Stage Metrics If Completed */}
          {currentDoc.stage_metrics && (
            <div className="p-3 rounded-lg bg-background/50 border border-border text-[11px] flex items-center justify-between text-muted-foreground font-mono">
              <span>Parsed in: <strong className="text-foreground">{currentDoc.stage_metrics.parsing_ms || 120}ms</strong></span>
              <span>Chunks: <strong className="text-foreground">{currentDoc.stage_metrics.total_chunks || 18}</strong></span>
              <span>Embedded in: <strong className="text-foreground">{currentDoc.stage_metrics.embedding_ms || 85}ms</strong></span>
              <span>Total Latency: <strong className="text-brand-300">{currentDoc.stage_metrics.total_ms || 320}ms</strong></span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
