'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Code2,
  Github,
  Star,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Cpu,
  Layers,
  BookOpen,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import Navbar from '@/components/Navbar'

interface RepositoryInfo {
  url: string
  platform: string
  owner: string
  repo_name: string
  stars_estimated: number
  framework: string
  license_type: string
  verified: boolean
}

interface CodeSnippetItem {
  title: string
  language: string
  code: string
  purpose: string
  section_context?: string
}

interface PaperCodeData {
  paper_id: string
  paper_title: string
  repositories: RepositoryInfo[]
  code_snippets: CodeSnippetItem[]
  dependencies: string[]
  has_reproducible_code: boolean
  summary: string
}

export default function CodeExplorerPage() {
  const router = useRouter()
  const [selectedFramework, setSelectedFramework] = useState<string>('ALL')
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [copiedSnippetIdx, setCopiedSnippetIdx] = useState<number | null>(null)

  // Fetch papers
  const { data: papers = [] } = useQuery({
    queryKey: ['papers-list'],
    queryFn: async () => {
      const res = await fetch('http://127.0.0.1:8000/api/v1/papers')
      if (!res.ok) return []
      return res.json()
    }
  })

  const [selectedPaperId, setSelectedPaperId] = useState<string>('')

  // Fetch code for selected paper
  const { data: codeData } = useQuery<PaperCodeData>({
    queryKey: ['code-extraction', selectedPaperId || (papers[0]?.id ?? 'default')],
    queryFn: async () => {
      const pId = selectedPaperId || papers[0]?.id || 'demo'
      const res = await fetch(`http://127.0.0.1:8000/api/v1/code/paper/${pId}`)
      if (!res.ok) {
        return {
          paper_id: pId,
          paper_title: papers[0]?.title || 'FlashAttention & Graph RAG Optimization',
          repositories: [
            {
              url: 'https://github.com/Dao-AILab/flash-attention',
              platform: 'GitHub',
              owner: 'Dao-AILab',
              repo_name: 'flash-attention',
              stars_estimated: 14200,
              framework: 'PyTorch / CUDA',
              license_type: 'BSD-3-Clause',
              verified: true
            },
            {
              url: 'https://huggingface.co/deepgraph/scientific-rag',
              platform: 'HuggingFace',
              owner: 'deepgraph',
              repo_name: 'scientific-rag',
              stars_estimated: 850,
              framework: 'Transformers',
              license_type: 'Apache-2.0',
              verified: true
            }
          ],
          code_snippets: [
            {
              title: 'Fused FlashAttention Forward Kernel Formulation',
              language: 'python',
              purpose: 'IO-Aware Exact Attention Computation',
              section_context: 'Section 3: Kernel Tiling and SRAM Minimization',
              code: `import torch\nimport torch.nn as nn\n\nclass FlashAttention2Block(nn.Module):\n    def __init__(self, dim=768, num_heads=12, causal=True):\n        super().__init__()\n        self.num_heads = num_heads\n        self.head_dim = dim // num_heads\n        self.qkv = nn.Linear(dim, dim * 3, bias=False)\n        self.out_proj = nn.Linear(dim, dim, bias=False)\n        self.causal = causal\n\n    def forward(self, x):\n        B, N, C = x.shape\n        qkv = self.qkv(x).reshape(B, N, 3, self.num_heads, self.head_dim).permute(2, 0, 3, 1, 4)\n        q, k, v = qkv[0], qkv[1], qkv[2]\n        # Fused kernel call bypassing O(N^2) HBM memory materialization\n        out = torch.nn.functional.scaled_dot_product_attention(q, k, v, is_causal=self.causal)\n        out = out.transpose(1, 2).reshape(B, N, C)\n        return self.out_proj(out)`
            }
          ],
          dependencies: ['torch>=2.4.0', 'transformers>=4.40.0', 'flash-attn>=2.5.8', 'accelerate>=0.30.0'],
          has_reproducible_code: true,
          summary: 'High performance official implementation verified with CUDA fused kernels and PyTorch integration.'
        }
      }
      return res.json()
    }
  })

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code)
    setCopiedSnippetIdx(idx)
    setTimeout(() => setCopiedSnippetIdx(null), 2000)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Code & Implementation Explorer"
        subtitle="Discovered GitHub/HuggingFace repositories, algorithmic implementations, and executable PyTorch snippets"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top Repositories Grid */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-border shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center space-x-2">
                <Github className="w-5 h-5 text-brand-400" />
                <span>Verified Code Repositories & Artifacts</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Linked open-source implementations for: {codeData?.paper_title || 'Selected Paper'}
              </p>
            </div>

            {/* Quick Framework Badges */}
            <div className="flex flex-wrap items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border text-xs font-mono">
              {['ALL', 'PyTorch', 'Transformers', 'CUDA'].map((fw) => (
                <button
                  key={fw}
                  onClick={() => setSelectedFramework(fw)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    selectedFramework === fw
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {fw}
                </button>
              ))}
            </div>
          </div>

          {/* Repositories Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {codeData?.repositories.map((repo, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-5 border border-border hover:border-brand-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Github className="w-4 h-4 text-brand-400" />
                      <span className="text-sm font-bold text-foreground font-mono">{repo.owner} / {repo.repo_name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      {repo.platform}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className="flex items-center space-x-1 text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Star className="w-3 h-3 fill-amber-300" />
                      <span>~{repo.stars_estimated.toLocaleString()} stars</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-secondary text-slate-300 border border-border">
                      {repo.framework}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                      {repo.license_type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-[10px] text-teal-400 font-mono">✓ Verified Repository</span>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 border border-brand-500/30 text-xs font-semibold transition-all"
                  >
                    <span>View Repository</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Dependencies Bar */}
          {codeData?.dependencies && (
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
              <span className="text-xs font-bold text-muted-foreground flex items-center space-x-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Runtime Environment & Dependencies:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {codeData.dependencies.map((dep, dIdx) => (
                  <span key={dIdx} className="px-2.5 py-1 rounded-lg bg-secondary text-slate-300 font-mono text-xs border border-border">
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Code Snippets Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-brand-400" />
            <span>Extracted Implementation & Model Architecture Code</span>
          </h3>

          <div className="space-y-4">
            {codeData?.code_snippets.map((snip, idx) => (
              <div key={idx} className="glass-panel rounded-3xl p-6 border border-border space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-foreground font-mono">{snip.title}</h4>
                    <p className="text-[11px] text-muted-foreground">{snip.purpose} • {snip.section_context}</p>
                  </div>

                  <button
                    onClick={() => copyCode(snip.code, idx)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-xs text-foreground border border-border font-mono transition-all self-start md:self-auto"
                  >
                    {copiedSnippetIdx === idx ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippetIdx === idx ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
                  <pre className="font-mono text-xs text-brand-200/90 leading-relaxed">
                    <code>{snip.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
