'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Network,
  Share2,
  Maximize2,
  Database,
  Layers,
  Sparkles,
  Info,
  GitBranch,
  Cpu
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import GraphCanvas from '@/components/GraphCanvas'
import { graphService } from '@/services/graph'

export default function GraphPage() {
  const { data: analytics } = useQuery({
    queryKey: ['graph-analytics'],
    queryFn: () => graphService.getAnalytics(),
  })

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Knowledge Graph Visualizer & Reasoner"
        subtitle="Explore semantic connections, multi-hop citations, and empirical model benchmarks across papers"
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Knowledge Graph KPI Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-border space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold">Graph Nodes</span>
              <Network className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-brand-300">
              {analytics?.total_nodes || 24}
            </div>
            <p className="text-[10px] text-muted-foreground">Papers, Models, Datasets & Concepts</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold">Semantic Edges</span>
              <GitBranch className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-400">
              {analytics?.total_edges || 48}
            </div>
            <p className="text-[10px] text-muted-foreground">CITES, USES, EVALUATED_ON, ACHIEVES</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold">Extracted Models</span>
              <Cpu className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-violet-400">
              {analytics?.label_counts?.Model || 6}
            </div>
            <p className="text-[10px] text-muted-foreground">ResNet, ViT, LLaMA, BERT</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold">Datasets & Metrics</span>
              <Database className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-pink-400">
              {(analytics?.label_counts?.Dataset || 5) + (analytics?.label_counts?.Metric || 4)}
            </div>
            <p className="text-[10px] text-muted-foreground">ImageNet, CIFAR-10, Top-1 Accuracy</p>
          </div>
        </div>

        {/* React Flow Graph Visualizer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Interactive Knowledge Graph: Click any node to open properties drawer, inspect benchmark values, or expand neighborhoods.</span>
            </div>
            <span className="font-mono text-[11px] bg-secondary px-2 py-0.5 rounded border border-border">Pan & Zoom Enabled</span>
          </div>

          <GraphCanvas />
        </div>
      </div>
    </div>
  )
}
