'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Network,
  GitCompare,
  Lightbulb,
  Clock,
  FolderKanban,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Database,
  Cpu,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/documents', label: 'Document Library', icon: FileText, badge: 'PDF & arXiv' },
  { href: '/chat', label: 'AI Research Assistant', icon: MessageSquare, badge: 'LangGraph' },
  { href: '/graph', label: 'Knowledge Graph', icon: Network, badge: 'React Flow' },
  { href: '/compare', label: 'Paper Comparison', icon: GitCompare },
  { href: '/reviews', label: 'Systematic Reviews', icon: Sparkles, badge: 'Synthesis' },
  { href: '/gaps', label: 'Research Gaps', icon: Lightbulb, badge: 'Discovery' },
  { href: '/timeline', label: 'Timeline & Evolution', icon: Clock },
  { href: '/notes', label: 'Notes & Annotations', icon: FolderKanban, badge: 'New' },
  { href: '/workspaces', label: 'Workspaces', icon: Database },
  { href: '/settings', label: 'Client Settings', icon: Settings, badge: 'Config' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-card/90 backdrop-blur-xl border-r border-border flex flex-col h-screen select-none relative z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-teal-300 flex items-center justify-center shadow-lg shadow-brand-500/25 border border-brand-400/30">
          <Network className="w-5 h-5 text-slate-950 font-bold" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold tracking-tight text-foreground text-base">DeepGraph</span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">AI</span>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-1 font-medium">Research Intelligence Graph</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
          Intelligence Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative',
                isActive
                  ? 'bg-gradient-to-r from-brand-500/20 to-teal-500/5 text-brand-300 border border-brand-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-brand-400' : 'text-muted-foreground group-hover:text-foreground')} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-md font-mono',
                  isActive ? 'bg-brand-500/30 text-brand-200 border border-brand-400/30' : 'bg-secondary text-muted-foreground/80 border border-border/50'
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Engine Status & Researcher Footer */}
      <div className="p-4 border-t border-border space-y-3 bg-secondary/30">
        <div className="rounded-xl p-3 bg-background/60 border border-border/80 text-[11px] space-y-2">
          <div className="flex items-center justify-between font-semibold">
            <span className="text-muted-foreground flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              <span>Hybrid Engine</span>
            </span>
            <span className="text-brand-400 font-mono text-[10px] bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">LIVE</span>
          </div>
          <div className="text-[10px] text-muted-foreground leading-snug space-y-0.5 font-mono">
            <p className="text-slate-300">✓ pgvector (Semantic Search)</p>
            <p className="text-slate-300">✓ Neo4j / NetworkX (Graph)</p>
            <p className="text-slate-300">✓ 100% Citation Verifier</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 pt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
            DG
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Lead AI Researcher</p>
            <p className="text-[10px] text-muted-foreground truncate font-mono">researcher@deepgraph.ai</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
