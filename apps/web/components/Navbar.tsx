'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Search,
  Upload,
  Sparkles,
  Command,
  CheckCircle2,
  Database,
  Network,
  Bell,
  HelpCircle,
  FolderKanban,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  MessageSquare,
  GitCompare,
  Lightbulb,
  Clock,
  Settings
} from 'lucide-react'
import StatusBar from '@/components/StatusBar'
import CommandPalette from '@/components/CommandPalette'
import { cn } from '@/lib/utils'

interface NavbarProps {
  title?: string
  subtitle?: string
  onUploadClick?: () => void
}

const mobileNavItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/documents', label: 'Document Library', icon: FileText },
  { href: '/chat', label: 'AI Assistant', icon: MessageSquare },
  { href: '/graph', label: 'Knowledge Graph', icon: Network },
  { href: '/compare', label: 'Paper Comparison', icon: GitCompare },
  { href: '/gaps', label: 'Research Gaps', icon: Lightbulb },
  { href: '/timeline', label: 'Timeline & Evolution', icon: Clock },
  { href: '/workspaces', label: 'Workspaces & Notes', icon: FolderKanban },
  { href: '/settings', label: 'Client Settings', icon: Settings },
]

export default function Navbar({ title, subtitle, onUploadClick }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/chat?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <>
      <CommandPalette />
      <header className="h-16 bg-card/75 backdrop-blur-xl border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-secondary/80 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div>
            {title && (
              <h1 className="text-sm font-bold text-foreground tracking-tight flex items-center space-x-2">
                <span>{title}</span>
              </h1>
            )}
            {subtitle && <p className="text-[11px] text-muted-foreground line-clamp-1 hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Live Engine Status Indicator (Desktop only) */}
          <div className="hidden xl:block">
            <StatusBar />
          </div>

          {/* Global Search Bar (with Cmd+K trigger hint) */}
          <form onSubmit={handleSearchSubmit} className="relative w-48 sm:w-64 lg:w-80">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or ask (Press ⌘K)..."
              className="w-full bg-secondary/60 border border-border/80 focus:border-teal-500 rounded-xl pl-9 pr-12 sm:pr-14 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none transition-all shadow-inner"
            />
            <div
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true })
                window.dispatchEvent(event)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-background/80 cursor-pointer hover:text-foreground"
            >
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </form>

          {/* Ingest Action Button */}
          <div className="flex items-center space-x-2">
            {onUploadClick ? (
              <button
                onClick={onUploadClick}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/20 active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Paper</span>
              </button>
            ) : (
              <button
                onClick={() => router.push('/documents')}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/20 active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ingest</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-slate-950/90 backdrop-blur-xl md:hidden p-4 space-y-2 animate-in fade-in duration-150">
          <div className="p-2 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
              Intelligence Navigation
            </p>
            {mobileNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  <Icon className="w-4 h-4 text-teal-400" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
