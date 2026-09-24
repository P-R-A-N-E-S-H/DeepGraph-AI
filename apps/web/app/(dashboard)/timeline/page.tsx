'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Clock,
  Calendar,
  Layers,
  Sparkles,
  Filter,
  FileText,
  ChevronRight,
  BarChart3,
  GitCommit,
  TrendingUp,
  Cpu,
  ArrowRight,
  Zap
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import Navbar from '@/components/Navbar'
import { analyticsService, TimelineEvent } from '@/services/analytics'

export default function TimelinePage() {
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL')

  const { data: timelineData } = useQuery({
    queryKey: ['research-timeline'],
    queryFn: () => analyticsService.getTimeline(),
  })

  const events: TimelineEvent[] = timelineData?.events || []
  const years: number[] = timelineData?.years || [2015, 2017, 2020, 2023, 2024]

  const methodsList = ['ALL', ...Array.from(new Set(events.map(e => e.method).filter(Boolean)))]

  const filteredEvents = events.filter(e => {
    const matchesYear = selectedYear === null || e.year === selectedYear
    const matchesMethod = selectedMethod === 'ALL' || e.method === selectedMethod
    return matchesYear && matchesMethod
  })

  const chartData = years.map(yr => ({
    year: yr.toString(),
    papers: events.filter(e => e.year === yr).length || 1
  }))

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Research Evolution Timeline"
        subtitle="Chronological trajectory of model architectures, benchmark datasets, and breakthrough methodologies"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Evolution Area Chart */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-border space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <span>Publication & Breakthrough Velocity</span>
              </h3>
              <p className="text-xs text-muted-foreground">Volume of landmark architectures and ingested publications over time</p>
            </div>

            {/* Year Filters */}
            <div className="flex items-center space-x-1.5 bg-secondary/50 p-1 rounded-xl border border-border text-xs">
              <button
                onClick={() => setSelectedYear(null)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  selectedYear === null
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Years
              </button>
              {years.map(yr => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    selectedYear === yr
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTimeline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="papers" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTimeline)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Method Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Methodology:</span>
          </span>
          {methodsList.map(method => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method || 'ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedMethod === method
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {method}
            </button>
          ))}
        </div>

        {/* Chronological Vertical Timeline with Glowing Spine */}
        <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-teal-400 before:via-indigo-500 before:to-pink-500">
          {filteredEvents.map((evt, idx) => (
            <div key={idx} className="relative group">
              {/* Glowing Marker Node */}
              <div className="absolute -left-[30px] top-2 w-5 h-5 rounded-full bg-slate-950 border-2 border-teal-400 group-hover:scale-125 transition-transform flex items-center justify-center shadow-lg shadow-teal-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              </div>

              <div className="glass-card rounded-3xl p-6 md:p-7 border border-border hover:border-teal-500/40 space-y-4 transition-all shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-teal-300 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-xl">
                      {evt.year}
                    </span>
                    {evt.method && (
                      <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl">
                        {evt.method}
                      </span>
                    )}
                  </div>

                  {evt.dataset && (
                    <span className="text-xs text-muted-foreground font-mono bg-secondary/80 px-2.5 py-1 rounded-lg border border-border">
                      Dataset: {evt.dataset}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-base md:text-lg font-bold text-foreground">{evt.title}</h3>
                  <p className="text-xs text-teal-300/80 font-medium">
                    {evt.authors.slice(0, 4).join(', ')}
                  </p>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-border/80">
                  {evt.key_contribution}
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Provenance: Verified Academic Baseline
                  </span>

                  <button
                    onClick={() => router.push(`/chat?q=Explain the breakthrough methodology in ${encodeURIComponent(evt.title)} and how it advanced AI.`)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-teal-500/20 active:scale-95"
                  >
                    <span>Analyze Breakthrough In Chat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
