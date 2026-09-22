'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  FileText,
  Network,
  MessageSquare,
  GitCompare,
  Lightbulb,
  Upload,
  ArrowRight,
  Sparkles,
  Command,
  Settings,
  X
} from 'lucide-react'

interface CommandItem {
  id: string
  title: string
  subtitle: string
  category: 'Actions' | 'Papers' | 'Entities' | 'Navigation'
  icon: any
  href: string
}

const STATIC_COMMANDS: CommandItem[] = [
  {
    id: 'nav-chat',
    title: 'Ask AI Research Assistant',
    subtitle: 'Ask technical questions with citation verification',
    category: 'Actions',
    icon: MessageSquare,
    href: '/chat'
  },
  {
    id: 'nav-graph',
    title: 'Explore Knowledge Graph',
    subtitle: 'Interactive React Flow visualizer',
    category: 'Navigation',
    icon: Network,
    href: '/graph'
  },
  {
    id: 'nav-compare',
    title: 'Compare Research Papers',
    subtitle: 'Multi-paper side-by-side comparative matrix',
    category: 'Navigation',
    icon: GitCompare,
    href: '/compare'
  },
  {
    id: 'nav-gaps',
    title: 'Discover Research Gaps',
    subtitle: 'Explore limitations, open problems and frontiers',
    category: 'Navigation',
    icon: Lightbulb,
    href: '/gaps'
  },
  {
    id: 'nav-upload',
    title: 'Upload Paper PDF',
    subtitle: 'Ingest research PDF into knowledge graph',
    category: 'Actions',
    icon: Upload,
    href: '/documents'
  },
  {
    id: 'nav-settings',
    title: 'Client Configuration & Settings',
    subtitle: 'Configure LLM providers, API keys, and RAG sliders',
    category: 'Navigation',
    icon: Settings,
    href: '/settings'
  },
  {
    id: 'paper-resnet',
    title: 'Deep Residual Learning for Image Recognition',
    subtitle: 'He et al. • ResNet-50 • 94.2% Top-1 Accuracy • ImageNet',
    category: 'Papers',
    icon: FileText,
    href: '/chat?q=Explain Deep Residual Learning for Image Recognition'
  },
  {
    id: 'paper-vit',
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
    subtitle: 'Dosovitskiy et al. • ViT-B/16 • Self-Attention • JFT-300M',
    category: 'Papers',
    icon: FileText,
    href: '/chat?q=Explain Vision Transformers for Image Recognition at Scale'
  },
  {
    id: 'ent-attention',
    title: 'Self-Attention Mechanism',
    subtitle: 'Entity (Method) • Quadratic complexity O(N^2) • Global receptive field',
    category: 'Entities',
    icon: Sparkles,
    href: '/graph'
  },
  {
    id: 'ent-imagenet',
    title: 'ImageNet Dataset',
    subtitle: 'Entity (Dataset) • 1,000 Classes • Standard Vision Benchmark',
    category: 'Entities',
    icon: Network,
    href: '/graph'
  }
]

export default function CommandPalette() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Listen for Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const filtered = query.trim()
    ? STATIC_COMMANDS.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : STATIC_COMMANDS

  const handleSelect = (item: CommandItem) => {
    setIsOpen(false)
    setQuery('')
    router.push(item.href)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden glass-panel divide-y divide-border/80 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 flex items-center space-x-3">
          <Search className="w-5 h-5 text-brand-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
              } else if (e.key === 'Enter' && filtered[selectedIndex]) {
                handleSelect(filtered[selectedIndex])
              }
            }}
            placeholder="Search papers, entities, datasets, or type a query..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon
              const isSelected = idx === selectedIndex

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-500/15 border border-brand-500/30 text-foreground'
                      : 'hover:bg-secondary/40 text-muted-foreground border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-brand-500/20 text-brand-300' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-secondary text-muted-foreground">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <ArrowRight className="w-4 h-4 text-brand-400 flex-shrink-0 ml-2" />
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <p>No results found for "{query}".</p>
              <button
                onClick={() => handleSelect({
                  id: 'query-search',
                  title: `Ask: "${query}"`,
                  subtitle: 'Send question to AI Research Assistant',
                  category: 'Actions',
                  icon: MessageSquare,
                  href: `/chat?q=${encodeURIComponent(query)}`
                })}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-slate-950 font-bold text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask DeepGraph AI</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-secondary/20 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center space-x-3">
            <span>Navigation: <kbd className="px-1 py-0.5 rounded bg-secondary border border-border">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-secondary border border-border">↓</kbd></span>
            <span>Select: <kbd className="px-1 py-0.5 rounded bg-secondary border border-border">Enter</kbd></span>
          </div>
          <span>Close: <kbd className="px-1 py-0.5 rounded bg-secondary border border-border">Esc</kbd></span>
        </div>
      </div>
    </div>
  )
}
