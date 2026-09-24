'use client'

import React, { useState, useEffect, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Search,
  Filter,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
  Info,
  Maximize2,
  RefreshCw,
  GitBranch,
  Route,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react'
import { graphService, GraphNode, GraphEdge, SubgraphResponse, CentralityResponse, CommunitiesResponse } from '@/services/graph'

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string; glow: string }> = {
  Paper: { bg: 'rgba(20, 184, 166, 0.18)', border: '#14b8a6', text: '#2dd4bf', dot: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)' },
  Author: { bg: 'rgba(99, 102, 241, 0.18)', border: '#6366f1', text: '#818cf8', dot: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' },
  Model: { bg: 'rgba(139, 92, 246, 0.18)', border: '#8b5cf6', text: '#a78bfa', dot: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
  Dataset: { bg: 'rgba(236, 72, 153, 0.18)', border: '#ec4899', text: '#f472b6', dot: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' },
  Method: { bg: 'rgba(234, 179, 8, 0.18)', border: '#eab308', text: '#facc15', dot: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' },
  Metric: { bg: 'rgba(16, 185, 129, 0.18)', border: '#10b981', text: '#34d399', dot: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
  Task: { bg: 'rgba(14, 165, 233, 0.18)', border: '#0ea5e9', text: '#38bdf8', dot: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.4)' },
}

interface GraphCanvasProps {
  initialTypes?: string[]
}

export default function GraphCanvas({ initialTypes }: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [activeTypes, setActiveTypes] = useState<string[]>(initialTypes || ['Paper', 'Model', 'Dataset', 'Method', 'Author', 'Task', 'Metric'])
  const [searchQuery, setSearchQuery] = useState('')
  const [depth, setDepth] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [centralityData, setCentralityData] = useState<CentralityResponse | null>(null)
  const [communitiesData, setCommunitiesData] = useState<CommunitiesResponse | null>(null)

  const loadCentralityAndCommunities = async () => {
    try {
      const [c, comm] = await Promise.all([
        graphService.getCentrality(),
        graphService.getCommunities()
      ])
      setCentralityData(c)
      setCommunitiesData(comm)
    } catch (e) {
      console.error('Failed to load centrality/communities:', e)
    }
  }

  const loadGraphData = async () => {
    setIsLoading(true)
    try {
      const data: SubgraphResponse = await graphService.getSubgraph(activeTypes, 250)
      
      const totalNodes = data.nodes.length
      const centerX = 450
      const centerY = 320
      const radius = Math.min(480, Math.max(220, totalNodes * 28))

      const rfNodes: Node[] = data.nodes.map((n, idx) => {
        const angle = (idx / Math.max(1, totalNodes)) * 2 * Math.PI
        const isPaper = n.label === 'Paper'
        const r = isPaper ? radius * 0.42 : radius * (0.75 + (idx % 3) * 0.15)
        const x = centerX + r * Math.cos(angle)
        const y = centerY + r * Math.sin(angle)
        const theme = TYPE_COLORS[n.label] || TYPE_COLORS['Paper']
        
        const isHighlighted = searchQuery && (
          (n.properties.name || n.properties.title || n.id).toLowerCase().includes(searchQuery.toLowerCase())
        )

        return {
          id: n.id,
          position: { x, y },
          data: {
            label: (
              <div className="flex items-center space-x-2 px-1.5 py-1">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
                  style={{ backgroundColor: theme.dot, boxShadow: `0 0 8px ${theme.glow}` }}
                />
                <span className="text-xs font-bold truncate max-w-[130px]">
                  {n.properties.name || n.properties.title || n.id}
                </span>
              </div>
            ),
            raw: n
          },
          style: {
            background: isHighlighted ? 'rgba(45, 212, 191, 0.35)' : theme.bg,
            border: `2px solid ${isHighlighted ? '#2dd4bf' : theme.border}`,
            color: theme.text,
            borderRadius: '10px',
            padding: '4px 10px',
            fontSize: '11px',
            boxShadow: isHighlighted ? `0 0 25px ${theme.glow}` : '0 6px 20px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)'
          }
        }
      })

      const rfEdges: Edge[] = data.edges.map((e, idx) => ({
        id: `e-${e.source}-${e.target}-${idx}`,
        source: e.source,
        target: e.target,
        label: e.relation,
        animated: true,
        style: { stroke: 'rgba(45, 212, 191, 0.45)', strokeWidth: 1.8 },
        labelStyle: { fill: '#94a3b8', fontSize: '9px', fontWeight: 700 },
        labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8, rx: 4, ry: 4 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#14b8a6', width: 14, height: 14 }
      }))

      setNodes(rfNodes)
      setEdges(rfEdges)
    } catch (err) {
      console.error('Failed to load graph data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadGraphData()
  }, [activeTypes, searchQuery])

  const toggleType = (type: string) => {
    setActiveTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    if (node.data?.raw) {
      setSelectedNode(node.data.raw)
    }
  }

  const expandNeighborhood = async (nodeId: string) => {
    try {
      const neighborData = await graphService.getNeighbors(nodeId, depth + 1)
      setSelectedNode(prev => prev ? { ...prev, properties: { ...prev.properties, neighborCount: neighborData.nodes.length } } : null)
      setDepth(d => d + 1)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="relative w-full h-[680px] bg-card/50 backdrop-blur-md rounded-2xl border border-border overflow-hidden flex shadow-2xl">
      {/* React Flow Canvas */}
      <div className="flex-1 h-full relative">
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-card/90 backdrop-blur-xl border border-border/90 rounded-2xl p-2 shadow-2xl">
          {/* Quick Node Search */}
          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search graph..."
              className="w-full bg-secondary/70 border border-border/80 rounded-xl pl-8 pr-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Node Type Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {Object.keys(TYPE_COLORS).map(type => {
              const active = activeTypes.includes(type)
              const theme = TYPE_COLORS[type]
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all flex items-center space-x-1.5 ${
                    active
                      ? 'bg-secondary text-foreground border border-border shadow-sm'
                      : 'opacity-35 hover:opacity-75 text-muted-foreground'
                  }`}
                  style={active ? { borderColor: theme.border } : {}}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.dot }} />
                  <span>{type}</span>
                </button>
              )
            })}
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          <button
            onClick={() => {
              setShowAnalytics(!showAnalytics)
              if (!centralityData) loadCentralityAndCommunities()
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              showAnalytics ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Graph Analytics</span>
          </button>

          <button
            onClick={loadGraphData}
            title="Reload Knowledge Graph"
            className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Analytics & Communities Drawer Overlay */}
        {showAnalytics && (
          <div className="absolute top-16 left-4 z-20 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4 max-h-[560px] overflow-y-auto animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase text-brand-400 font-mono">Centrality & Clusters</span>
              <button onClick={() => setShowAnalytics(false)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Top Influencers */}
            <div>
              <h4 className="text-xs font-bold text-white mb-2">Top Influencer Entities (PageRank)</h4>
              <div className="space-y-1.5">
                {(centralityData?.top_influencers || []).slice(0, 5).map((inf, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-slate-200 font-medium truncate max-w-[170px]">{inf.name}</span>
                    <span className="text-[10px] font-mono text-brand-300 font-bold">{(inf.score * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clusters */}
            <div>
              <h4 className="text-xs font-bold text-white mb-2">
                Knowledge Communities ({communitiesData?.total_communities || 0})
              </h4>
              <div className="space-y-2">
                {(communitiesData?.communities || []).slice(0, 4).map((comm) => (
                  <div key={comm.cluster_id} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between font-medium text-slate-100 mb-1">
                      <span>{comm.cluster_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{comm.size} nodes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.2}
          maxZoom={2.5}
        >
          <Background color="#1e293b" gap={24} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const raw = n.data?.raw as GraphNode
              const theme = raw ? TYPE_COLORS[raw.label] : null
              return theme ? theme.dot : '#64748b'
            }}
            maskColor="rgba(10, 15, 30, 0.75)"
            className="!bg-card/95 !border-border !rounded-xl !shadow-xl"
          />
        </ReactFlow>
      </div>

      {/* Slide-out Entity Inspector Panel */}
      {selectedNode && (
        <div className="w-88 border-l border-border bg-card/98 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 shadow-2xl z-20">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <span
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono shadow-sm"
                style={{
                  backgroundColor: TYPE_COLORS[selectedNode.label]?.bg || 'rgba(255,255,255,0.1)',
                  color: TYPE_COLORS[selectedNode.label]?.text || '#fff',
                  border: `1.5px solid ${TYPE_COLORS[selectedNode.label]?.border || '#fff'}`
                }}
              >
                {selectedNode.label}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight leading-snug">
                {selectedNode.properties.name || selectedNode.properties.title || selectedNode.id}
              </h3>
              {selectedNode.properties.year && (
                <p className="text-xs text-brand-400 font-semibold mt-1 font-mono">
                  Publication Year: {selectedNode.properties.year}
                </p>
              )}
            </div>

            {selectedNode.properties.venue && (
              <div className="text-xs text-muted-foreground p-3 rounded-xl bg-secondary/40 border border-border/80">
                <span className="font-semibold text-foreground">Publication Venue: </span>
                <span>{selectedNode.properties.venue}</span>
              </div>
            )}

            {selectedNode.properties.value && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-1">
                <span className="font-bold text-emerald-400">Reported Benchmark Result: </span>
                <p className="font-mono text-foreground font-bold text-sm">
                  {selectedNode.properties.value} {selectedNode.properties.unit || ''}
                </p>
              </div>
            )}

            {/* Neighborhood Expansion Action */}
            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center space-x-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Neighborhood Expansion</span>
                </span>
                <span className="text-[10px] font-mono text-brand-300">Depth {depth}</span>
              </div>
              <button
                onClick={() => expandNeighborhood(selectedNode.id)}
                className="w-full py-1.5 px-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground transition-all flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3 h-3 text-brand-400" />
                <span>Expand 2-Hop Connections</span>
              </button>
            </div>

            {/* Properties JSON View */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Extracted Provenance Metadata
              </p>
              <pre className="p-3 rounded-xl bg-background/80 border border-border text-[11px] font-mono text-slate-300 overflow-x-auto">
                {JSON.stringify(selectedNode.properties, null, 2)}
              </pre>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-2">
            <button
              onClick={() => window.location.href = `/chat?q=Tell me everything about ${encodeURIComponent(selectedNode.properties.name || selectedNode.id)} based on ingested papers`}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Query DeepGraph AI Assistant</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
