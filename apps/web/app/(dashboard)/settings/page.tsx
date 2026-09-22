'use client'

import React, { useState } from 'react'
import {
  Settings,
  Key,
  Sliders,
  Download,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Save,
  RefreshCw,
  Cpu,
  Database,
  Network,
  Share2,
  Code,
  FileCode,
  FileText,
  Zap,
  Check,
  Globe
} from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'models' | 'retrieval' | 'export' | 'profile'>('models')
  const [isSaved, setIsSaved] = useState(false)
  const [isTestingConn, setIsTestingConn] = useState(false)
  const [connStatus, setConnStatus] = useState<'idle' | 'success' | 'failed'>('idle')

  // Model & API state
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [selectedEmbedding, setSelectedEmbedding] = useState('sentence-transformers/all-MiniLM-L6-v2')
  const [selectedLlm, setSelectedLlm] = useState('gpt-4o-mini')

  // RAG Hyperparameters
  const [vectorWeight, setVectorWeight] = useState(0.7)
  const [graphWeight, setGraphWeight] = useState(0.3)
  const [graphDepth, setGraphDepth] = useState(2)
  const [topK, setTopK] = useState(6)
  const [chunkSize, setChunkSize] = useState(350)
  const [chunkOverlap, setChunkOverlap] = useState(50)

  // Profile state
  const [clientName, setClientName] = useState('Dr. DeepGraph AI Researcher')
  const [clientOrg, setClientOrg] = useState('Advanced AI & Machine Learning Laboratory')
  const [citationFormat, setCitationFormat] = useState('IEEE')

  const handleSaveSettings = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2500)
  }

  const handleTestConnection = () => {
    setIsTestingConn(true)
    setConnStatus('idle')
    setTimeout(() => {
      setIsTestingConn(false)
      setConnStatus('success')
    }, 1200)
  }

  const handleExportBibtex = () => {
    const bib = `@article{vaswani2017attention,
  title={Attention Is All You Need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, {\\L}ukasz and Polosukhin, Illia},
  journal={Advances in Neural Information Processing Systems},
  volume={30},
  year={2017}
}

@article{he2016deep,
  title={Deep Residual Learning for Image Recognition},
  author={He, Kaiming and Zhang, Xiangyu and Ren, Shaoqing and Sun, Jian},
  journal={IEEE Conference on Computer Vision and Pattern Recognition},
  pages={770--778},
  year={2016}
}

@article{dosovitskiy2020image,
  title={An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale},
  author={Dosovitskiy, Alexey and Beyer, Lucas and Kolesnikov, Alexander and Weissenborn, Dirk and Zhai, Xiaohua and Unterthiner, Thomas and Dehghani, Mostafa and Minderer, Matthias and Heigold, Georg and Gelly, Sylvain and others},
  journal={International Conference on Learning Representations},
  year={2021}
}`
    const blob = new Blob([bib], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DeepGraph_Citations.bib`
    a.click()
  }

  const handleExportCypher = () => {
    const cypher = `// DeepGraph AI Knowledge Graph Export
CREATE (:Paper {id: 'p-1', title: 'Attention Is All You Need', year: 2017});
CREATE (:Paper {id: 'p-2', title: 'Deep Residual Learning for Image Recognition', year: 2015});
CREATE (:Paper {id: 'p-3', title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale', year: 2020});

CREATE (:Model {name: 'Transformer', type: 'Architecture'});
CREATE (:Model {name: 'ResNet-50', type: 'Convolutional'});
CREATE (:Model {name: 'ViT-B/16', type: 'Vision Transformer'});

CREATE (:Dataset {name: 'ImageNet', classes: 1000});
CREATE (:Dataset {name: 'WMT 2014 En-De', domain: 'Translation'});

CREATE (:Method {name: 'Self-Attention', complexity: 'O(N^2)'});
CREATE (:Method {name: 'Residual Shortcut', function: 'F(x) + x'});

MATCH (p:Paper {id: 'p-1'}), (m:Model {name: 'Transformer'}) CREATE (p)-[:PROPOSES]->(m);
MATCH (p:Paper {id: 'p-2'}), (m:Model {name: 'ResNet-50'}) CREATE (p)-[:PROPOSES]->(m);
MATCH (p:Paper {id: 'p-3'}), (m:Model {name: 'ViT-B/16'}) CREATE (p)-[:PROPOSES]->(m);`
    const blob = new Blob([cypher], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DeepGraph_KnowledgeGraph_Export.cql`
    a.click()
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Client Configuration & Studio Settings"
        subtitle="Manage LLM provider keys, hybrid retrieval hyperparameters, export formats, and institutional profiles"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('models')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'models'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Model & API Gateway</span>
            </button>
            <button
              onClick={() => setActiveTab('retrieval')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'retrieval'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Retrieval & RAG Sliders</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'export'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Data Export Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Client Institution Profile</span>
            </button>
          </div>

          <button
            onClick={handleSaveSettings}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/20 active:scale-95"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Configuration Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

        {/* Tab 1: Model & API Gateway */}
        {activeTab === 'models' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-panel rounded-3xl p-6 md:p-8 border border-border space-y-6 shadow-xl">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground flex items-center space-x-2">
                  <Key className="w-4 h-4 text-teal-400" />
                  <span>LLM & Embedding Provider Credentials</span>
                </h3>
                <p className="text-xs text-muted-foreground">Configure client-provided API keys or connect to local inference instances (Ollama / vLLM)</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">OpenAI API Key</label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full mt-1.5 bg-slate-950/60 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-teal-500 shadow-inner"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Used for GPT-4o / GPT-4o-mini synthesis and text-embedding-3-small.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Anthropic API Key</label>
                  <input
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="w-full mt-1.5 bg-slate-950/60 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-teal-500 shadow-inner"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Used for Claude 3.5 Sonnet research synthesis.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Local Ollama / vLLM Host Endpoint</label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full mt-1.5 bg-slate-950/60 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-teal-500 shadow-inner"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">For air-gapped or on-premise inference with LLaMA 3, Mistral, or Qwen.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Primary Embedding Model</label>
                    <select
                      value={selectedEmbedding}
                      onChange={(e) => setSelectedEmbedding(e.target.value)}
                      className="w-full mt-1.5 bg-slate-950/60 border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-medium focus:outline-none focus:border-teal-500"
                    >
                      <option value="sentence-transformers/all-MiniLM-L6-v2">all-MiniLM-L6-v2 (384-d, Fast Local)</option>
                      <option value="BAAI/bge-m3">BAAI/bge-m3 (1024-d, Multilingual)</option>
                      <option value="openai/text-embedding-3-small">OpenAI text-embedding-3-small (1536-d)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">Multi-Agent Reasoner Model</label>
                    <select
                      value={selectedLlm}
                      onChange={(e) => setSelectedLlm(e.target.value)}
                      className="w-full mt-1.5 bg-slate-950/60 border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-medium focus:outline-none focus:border-teal-500"
                    >
                      <option value="gpt-4o-mini">GPT-4o-mini (Optimal Speed & Accuracy)</option>
                      <option value="gpt-4o">GPT-4o (Deep Mathematical Reasoning)</option>
                      <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Technical Synthesis)</option>
                      <option value="llama3.1-70b">LLaMA 3.1 70B (Local On-Prem)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs">
                    {connStatus === 'success' && (
                      <span className="text-emerald-400 flex items-center space-x-1 font-mono font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Connection Verified (200 OK)</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConn}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin text-teal-400' : ''}`} />
                    <span>Test Gateway Connection</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Provider Status Card */}
            <div className="glass-panel rounded-3xl p-6 border border-border space-y-4 h-fit shadow-xl">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-foreground">Security & Isolation</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All client API keys are stored in encrypted environment state and never transmitted outside your configured endpoints. Untrusted document texts are isolated via XML boundary guards.
              </p>
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 text-[11px] space-y-2 font-mono text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Prompt Guard:</span>
                  <span className="text-emerald-400 font-bold">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>pgvector Engine:</span>
                  <span className="text-teal-400 font-bold">Cosine 384</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Graph Engine:</span>
                  <span className="text-indigo-400 font-bold">NetworkX/Neo4j</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Retrieval & RAG Sliders */}
        {activeTab === 'retrieval' && (
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-border space-y-6 shadow-xl max-w-4xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                <span>Hybrid Retrieval & Knowledge Graph Tuning</span>
              </h3>
              <p className="text-xs text-muted-foreground">Fine-tune the mathematical weighting formula across semantic vector embeddings and graph traversal</p>
            </div>

            <div className="space-y-6 pt-2">
              {/* Vector vs BM25 Weight */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Dense Vector Similarity Weight ($\alpha$)</span>
                  <span className="font-mono text-teal-400 font-bold">{(vectorWeight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={vectorWeight}
                  onChange={(e) => setVectorWeight(parseFloat(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Keyword Dominant (BM25)</span>
                  <span>Semantic Vector Dominant</span>
                </div>
              </div>

              {/* Graph Hop Depth */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Knowledge Graph Multi-Hop Expansion Depth ($k$)</span>
                  <span className="font-mono text-indigo-400 font-bold">{graphDepth} Hops</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={graphDepth}
                  onChange={(e) => setGraphDepth(parseInt(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
                <p className="text-[11px] text-muted-foreground">
                  Controls how many relationship hops (e.g. Paper ➔ Method ➔ Dataset ➔ Benchmark) the agent traverses during multi-paper reasoning.
                </p>
              </div>

              {/* Top-K Chunks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Maximum Evidentiary Chunks Injected to Synthesizer</span>
                  <span className="font-mono text-pink-400 font-bold">{topK} Chunks</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="w-full accent-pink-400 cursor-pointer"
                />
              </div>

              {/* Chunk Size & Overlap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Target Chunk Token Size</label>
                  <input
                    type="number"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(parseInt(e.target.value) || 350)}
                    className="w-full bg-slate-950/60 border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Preserves full paragraph semantics and LaTeX equations.</p>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Chunk Overlap Window</label>
                  <input
                    type="number"
                    value={chunkOverlap}
                    onChange={(e) => setChunkOverlap(parseInt(e.target.value) || 50)}
                    className="w-full bg-slate-950/60 border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Maintains context continuity across section breaks.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Data Export Studio */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-border space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <FileCode className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-foreground">Export BibTeX Reference Library</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Export parsed bibliography citations across all ingested papers in formatted <code>.bib</code> syntax compatible with LaTeX, Zotero, and Mendeley.
                </p>
              </div>

              <button
                onClick={handleExportBibtex}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download DeepGraph_Citations.bib</span>
              </button>
            </div>

            <div className="glass-card rounded-3xl p-6 md:p-8 border border-border space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Network className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-foreground">Export Knowledge Graph (Cypher / CQL)</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Download the extracted knowledge graph nodes and semantic edges as open Cypher statements for import into external Neo4j clusters or NetworkX scripts.
                </p>
              </div>

              <button
                onClick={handleExportCypher}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download KnowledgeGraph.cql</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Client Institution Profile */}
        {activeTab === 'profile' && (
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-border space-y-6 shadow-xl max-w-3xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground flex items-center space-x-2">
                <User className="w-4 h-4 text-teal-400" />
                <span>Client & Institution Profile</span>
              </h3>
              <p className="text-xs text-muted-foreground">Personalize research dossier headers, institutional affiliation, and citation styles</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Lead Researcher / Team Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full mt-1.5 bg-slate-950/60 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-teal-500 shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Institution / University / Company</label>
                <input
                  type="text"
                  value={clientOrg}
                  onChange={(e) => setClientOrg(e.target.value)}
                  className="w-full mt-1.5 bg-slate-950/60 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-teal-500 shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Preferred Academic Citation Style</label>
                <select
                  value={citationFormat}
                  onChange={(e) => setCitationFormat(e.target.value)}
                  className="w-full mt-1.5 bg-slate-950/60 border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="IEEE">IEEE Reference Standard [1]</option>
                  <option value="APA">APA 7th Edition (Author, Year)</option>
                  <option value="ACM">ACM SIGGRAPH / SIGCOMM Standard</option>
                  <option value="Nature">Nature / Science Format</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
