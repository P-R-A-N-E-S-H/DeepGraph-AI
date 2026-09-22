'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Database,
  Network,
  Cpu,
  CheckCircle2,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { apiClient } from '@/lib/api'

export default function StatusBar() {
  const { data: dbHealth } = useQuery({
    queryKey: ['health-db'],
    queryFn: () => apiClient<{ status: string; database?: string }>('/health/database'),
    refetchInterval: 15000,
  })

  const { data: graphHealth } = useQuery({
    queryKey: ['health-graph'],
    queryFn: () => apiClient<{ status: string; mode?: string }>('/health/neo4j'),
    refetchInterval: 15000,
  })

  return (
    <div className="flex items-center space-x-3 text-[11px] font-mono">
      <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-secondary/60 border border-border/80 text-muted-foreground shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-foreground">FastAPI</span>
        <span className="text-[10px] text-emerald-400">8000</span>
      </div>

      <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-secondary/60 border border-border/80 text-muted-foreground shadow-sm">
        <Database className="w-3 h-3 text-brand-400" />
        <span>Vector & DB</span>
        <span className="text-[10px] text-brand-300">pgvector</span>
      </div>

      <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-secondary/60 border border-border/80 text-muted-foreground shadow-sm">
        <Network className="w-3 h-3 text-indigo-400" />
        <span>Graph</span>
        <span className="text-[10px] text-indigo-300">Neo4j</span>
      </div>

      <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 shadow-sm">
        <Zap className="w-3 h-3 text-brand-400" />
        <span>LangGraph Agent</span>
      </div>
    </div>
  )
}
