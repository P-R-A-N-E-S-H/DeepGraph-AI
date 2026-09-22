'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Plus,
  Layers,
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  Bookmark,
  Copy,
  Download,
  Share2,
  Check,
  Zap,
  HelpCircle
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import CitationBadge from '@/components/CitationBadge'
import StreamingMarkdown from '@/components/StreamingMarkdown'
import { chatService, ChatMessage, ChatSession } from '@/services/chat'

const RESEARCH_PROMPTS = [
  {
    category: "Architecture Comparison",
    query: "Compare CNNs and Vision Transformers across spatial inductive bias, data scaling regimes, and computational complexity."
  },
  {
    category: "Limitation Discovery",
    query: "What are the documented limitations and open research gaps of deep convolutional networks for high-resolution image classification?"
  },
  {
    category: "Empirical Benchmarks",
    query: "What are the reported accuracy metrics and benchmark datasets for ResNet and ViT architectures on ImageNet and CIFAR-10?"
  },
  {
    category: "Methodology Synthesis",
    query: "Explain how residual shortcut connections solve the vanishing gradient and network degradation problems in very deep architectures."
  }
]

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-brand-400 mr-2" />
        <span>Loading AI Research Assistant...</span>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}

function ChatContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q')

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [expandedTraceIndex, setExpandedTraceIndex] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    if (initialQuery && !messages.length) {
      handleSendMessage(initialQuery)
    }
  }, [initialQuery])

  const loadSessions = async () => {
    try {
      const data = await chatService.listSessions()
      setSessions(data)
      if (data.length > 0 && !activeSessionId) {
        selectSession(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err)
    }
  }

  const selectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId)
    try {
      const full = await chatService.getSession(sessionId)
      setMessages(full.messages || [])
    } catch (err) {
      console.error(err)
    }
  }

  const startNewSession = () => {
    setActiveSessionId(null)
    setMessages([])
    setInput('')
  }

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleExportMarkdown = (msg: ChatMessage) => {
    let md = `# DeepGraph AI Research Synthesis\n\n`
    md += `${msg.content}\n\n`
    if (msg.citations && msg.citations.length > 0) {
      md += `### Grounded Citations & Sources:\n`
      msg.citations.forEach((c, i) => {
        md += `[${i + 1}] **${c.paper_title || 'Paper'}** — Page ${c.page}, Section: ${c.section}\n`
      })
    }
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DeepGraph_Research_Synthesis.md`
    a.click()
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim() || isLoading) return

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: activeSessionId || '',
      role: 'user',
      content: query,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, tempUserMsg])
    setInput('')
    setIsLoading(true)

    try {
      const resp = await chatService.sendMessage(query, activeSessionId || undefined)
      if (!activeSessionId) {
        setActiveSessionId(resp.session_id)
        loadSessions()
      }
      setMessages(prev => [...prev, resp])
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        session_id: activeSessionId || '',
        role: 'assistant',
        content: `Error generating research answer: ${err.message || 'Server error'}`,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Navbar
        title="AI Research Assistant & Synthesizer"
        subtitle="LangGraph Multi-Agent RAG with Strict Citation Verification"
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sessions Sidebar */}
        <div className="w-68 border-r border-border bg-card/70 backdrop-blur-md flex flex-col justify-between p-4 hidden md:flex">
          <div className="space-y-4">
            <button
              onClick={startNewSession}
              className="w-full py-2.5 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-brand-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Research Session</span>
            </button>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                Recent Conversations
              </p>
              <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-300px)]">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => selectSession(s.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center space-x-2.5 truncate ${
                      activeSessionId === s.id
                        ? 'bg-brand-500/15 text-brand-300 font-semibold border border-brand-500/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                    <span className="truncate">{s.title || 'Research Session'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-[11px] space-y-1.5">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Citation Guard Active</span>
            </div>
            <p className="text-muted-foreground text-[10px] leading-tight">
              Every assertion is verified against retrieved chunks. Zero hallucinated references.
            </p>
          </div>
        </div>

        {/* Chat Stream & Interaction Container */}
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
            {messages.length === 0 ? (
              <div className="py-10 text-center space-y-6 max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-teal-300 border border-brand-400/40 flex items-center justify-center mx-auto text-slate-950 shadow-xl shadow-brand-500/20">
                  <Sparkles className="w-8 h-8 font-bold" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    DeepGraph AI Research Assistant
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-lg mx-auto">
                    Ask cross-paper research questions. The system plans your query, performs hybrid vector + graph retrieval, synthesizes evidence, and strictly verifies citations.
                  </p>
                </div>

                {/* Query Templates Carousel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                  {RESEARCH_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.query)}
                      className="p-4 rounded-2xl glass-card border border-border hover:border-brand-500/50 text-xs transition-all flex flex-col justify-between space-y-3 group text-left"
                    >
                      <div>
                        <span className="text-[10px] font-bold font-mono text-brand-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                        <p className="text-slate-300 font-medium text-xs mt-1 leading-snug">
                          {item.query}
                        </p>
                      </div>
                      <span className="text-[10px] text-brand-400 font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                        <span>Execute Research Query</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.role === 'user'
                return (
                  <div key={msg.id || idx} className={`flex items-start space-x-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-slate-950 flex-shrink-0 shadow-md">
                        <Bot className="w-4 h-4 font-bold" />
                      </div>
                    )}

                    <div className={`space-y-3 max-w-2xl ${
                      isUser
                        ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-slate-950 font-semibold px-4 py-3 rounded-2xl rounded-tr-sm shadow-lg text-xs'
                        : 'glass-panel bg-card/90 p-6 rounded-2xl rounded-tl-sm border border-border shadow-xl space-y-4'
                    }`}>
                      {isUser ? (
                        <p className="leading-relaxed">{msg.content}</p>
                      ) : (
                        <>
                          {/* Multi-Agent Reasoning Trace Stepper */}
                          {msg.reasoning_trace && msg.reasoning_trace.length > 0 && (
                            <div className="border border-border/90 rounded-xl overflow-hidden bg-background/60 text-[11px] shadow-sm">
                              <button
                                onClick={() => setExpandedTraceIndex(expandedTraceIndex === idx ? null : idx)}
                                className="w-full px-3.5 py-2 flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors bg-secondary/40"
                              >
                                <span className="flex items-center space-x-2 font-mono text-[10px] font-bold text-brand-300">
                                  <Layers className="w-3.5 h-3.5 text-brand-400" />
                                  <span>LangGraph Agent Trace ({msg.reasoning_trace.length} Reasoning Steps)</span>
                                </span>
                                {expandedTraceIndex === idx ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>

                              {expandedTraceIndex === idx && (
                                <div className="p-4 space-y-3 border-t border-border/80 divide-y divide-border/50">
                                  {msg.reasoning_trace.map((step, sIdx) => (
                                    <div key={sIdx} className="pt-2 first:pt-0 space-y-1">
                                      <div className="flex items-center space-x-2 font-bold text-brand-300">
                                        <span className="w-2 h-2 rounded-full bg-brand-400" />
                                        <span>{step.agent}</span>
                                      </div>
                                      <p className="text-muted-foreground text-[11px] pl-4">{step.action}</p>
                                      <p className="text-slate-300 text-[10px] pl-4 font-mono italic bg-secondary/30 p-1.5 rounded-lg border border-border/40 mt-1">
                                        {step.output_summary}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Render Synthesized Markdown */}
                          <StreamingMarkdown content={msg.content} />

                          {/* Grounded Citation Badges */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="pt-4 border-t border-border/80 space-y-2.5">
                              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center space-x-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Verified Evidence Citations ({msg.citations.length})</span>
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {msg.citations.map((cit, cIdx) => (
                                  <CitationBadge
                                    key={cIdx}
                                    index={cIdx + 1}
                                    citation={cit}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Toolbar */}
                          <div className="pt-2 flex items-center justify-between border-t border-border/60 text-[11px] text-muted-foreground">
                            <span className="flex items-center space-x-1 text-emerald-400 font-mono text-[10px]">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Grounded in Evidence</span>
                            </span>

                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handleCopy(msg.content, idx)}
                                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all flex items-center space-x-1 text-[11px]"
                                title="Copy answer"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleExportMarkdown(msg)}
                                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all flex items-center space-x-1 text-[11px]"
                                title="Export Markdown"
                              >
                                <Download className="w-3 h-3 text-brand-400" />
                                <span>Export</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )
              })
            )}

            {isLoading && (
              <div className="flex items-start space-x-3.5 justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-slate-950 flex-shrink-0">
                  <Bot className="w-4 h-4 font-bold" />
                </div>
                <div className="p-5 rounded-2xl glass-panel bg-card/90 border border-brand-500/30 space-y-2 text-xs text-muted-foreground flex items-center space-x-3 shadow-xl">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                  <div>
                    <p className="font-semibold text-foreground">LangGraph Multi-Agent Orchestration Active</p>
                    <p className="text-[11px] text-muted-foreground">QueryPlanner ➔ HybridRetriever ➔ GraphReasoner ➔ CitationVerifier</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-border bg-card/80 backdrop-blur-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="max-w-4xl mx-auto flex items-center space-x-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask any research question (e.g. 'Compare computational efficiency of CNNs and Vision Transformers')..."
                className="flex-1 bg-secondary/70 border border-border/80 rounded-2xl px-5 py-3.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-brand-500 shadow-inner"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-slate-950 transition-all font-bold shadow-xl shadow-brand-500/25 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
