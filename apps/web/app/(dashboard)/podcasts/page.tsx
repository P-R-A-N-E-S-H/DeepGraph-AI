'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  Copy,
  Check,
  Radio,
  BookOpen,
  Layers,
  Flame,
  MessageSquare,
  ArrowRight,
  Clock,
  Mic,
  Activity
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { podcastService, PodcastScriptResponse, DialogueTurn, PodcastPreset } from '@/services/podcasts'

export default function PodcastsPage() {
  const [activePreset, setActivePreset] = useState<string>('vit-vs-resnet')
  const [customTopic, setCustomTopic] = useState<string>('')
  const [selectedTurnIndex, setSelectedTurnIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0)
  const [enableVoiceTTS, setEnableVoiceTTS] = useState<boolean>(true)
  const [copiedScript, setCopiedScript] = useState<boolean>(false)

  // Fetch Presets
  const { data: presets } = useQuery({
    queryKey: ['podcast-presets'],
    queryFn: () => podcastService.getPresets(),
  })

  // Generate Podcast Mutation
  const generateMutation = useMutation({
    mutationFn: (params: { topic?: string; style?: string }) => podcastService.generatePodcast(params),
  })

  const script: PodcastScriptResponse | undefined = generateMutation.data

  // Initial generation on load
  useEffect(() => {
    generateMutation.mutate({ topic: 'Vision Transformers vs Convolutional Networks: The Inductive Bias Trade-off', style: 'debate' })
  }, [])

  // Web Speech API Synthesis
  const synthRef = useRef<SpeechSynthesis | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  // Play dialogue step by step
  useEffect(() => {
    if (!isPlaying || !script || !script.dialogue || selectedTurnIndex >= script.dialogue.length) {
      if (isPlaying && script && selectedTurnIndex >= script.dialogue.length) {
        setIsPlaying(false)
        setSelectedTurnIndex(0)
      }
      return
    }

    const currentTurn = script.dialogue[selectedTurnIndex]

    if (enableVoiceTTS && synthRef.current) {
      synthRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(currentTurn.text)
      utterance.rate = playbackSpeed

      // Adjust pitch for Dr. Aris vs Dr. Nova
      if (currentTurn.speaker === 'Dr. Aris') {
        utterance.pitch = 1.05
      } else {
        utterance.pitch = 0.92
      }

      utterance.onend = () => {
        if (isPlaying) {
          setSelectedTurnIndex((prev) => prev + 1)
        }
      }

      utterance.onerror = () => {
        // Fallback timer if speech synthesis fails
        const wordCount = currentTurn.text.split(' ').length
        const durationMs = Math.max(3000, (wordCount / (2.8 * playbackSpeed)) * 1000)
        const timer = setTimeout(() => {
          if (isPlaying) setSelectedTurnIndex((prev) => prev + 1)
        }, durationMs)
        return () => clearTimeout(timer)
      }

      synthRef.current.speak(utterance)
    } else {
      // Simulation mode without TTS
      const wordCount = currentTurn.text.split(' ').length
      const durationMs = Math.max(2500, (wordCount / (3.2 * playbackSpeed)) * 1000)
      const timer = setTimeout(() => {
        if (isPlaying) setSelectedTurnIndex((prev) => prev + 1)
      }, durationMs)
      return () => clearTimeout(timer)
    }
  }, [isPlaying, selectedTurnIndex, playbackSpeed, enableVoiceTTS, script])

  const togglePlay = () => {
    if (isPlaying) {
      if (synthRef.current) synthRef.current.cancel()
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
    }
  }

  const handleCopyScript = () => {
    if (!script) return
    const textScript = script.dialogue
      .map((d) => `[${d.timestamp_formatted}] ${d.speaker} (${d.speaker_title}):\n${d.text}\n`)
      .join('\n')
    navigator.clipboard.writeText(textScript)
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }

  const currentSpeaker = script?.dialogue?.[selectedTurnIndex]?.speaker || 'Dr. Aris'

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="AI Research Audio Briefings & Podcast Studio"
        subtitle="NotebookLM-style interactive multi-host audio discussions explaining research papers, trade-offs, and math intuitions"
      />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Preset Selector & Custom Topic Input */}
        <div className="glass-panel rounded-3xl p-6 md:p-7 border border-border shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center space-x-2">
                <Radio className="w-5 h-5 text-brand-400" />
                <span>Select Briefing Theme or Generate Custom Episode</span>
              </h3>
              <p className="text-xs text-muted-foreground">Synthesizes multi-paper debates between Dr. Aris (Lead Host) & Dr. Nova (Critical Scientist)</p>
            </div>

            {/* Voice Toggle */}
            <button
              onClick={() => setEnableVoiceTTS(!enableVoiceTTS)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                enableVoiceTTS
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 shadow-sm'
                  : 'bg-secondary text-muted-foreground border-border'
              }`}
            >
              {enableVoiceTTS ? <Volume2 className="w-4 h-4 text-brand-400" /> : <VolumeX className="w-4 h-4" />}
              <span>Web Speech TTS: {enableVoiceTTS ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {presets?.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActivePreset(p.id)
                  generateMutation.mutate({ topic: p.title, style: p.style })
                  setSelectedTurnIndex(0)
                  setIsPlaying(false)
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  activePreset === p.id
                    ? 'bg-gradient-to-br from-brand-500/20 via-teal-500/10 to-indigo-500/10 border-brand-500/50 shadow-lg'
                    : 'bg-secondary/40 hover:bg-secondary/70 border-border/70 text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {p.duration_minutes} MIN • {p.style.toUpperCase()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-foreground mt-2 line-clamp-1">{p.title}</h4>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
              </button>
            ))}
          </div>

          {/* Custom Topic Bar */}
          <div className="flex items-center space-x-3 pt-2">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Or enter custom research topic (e.g., FlashAttention-2 vs Standard Attention benchmarks)..."
              className="flex-1 bg-secondary/60 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-500/50"
            />
            <button
              onClick={() => {
                if (customTopic.trim()) {
                  setActivePreset('custom')
                  generateMutation.mutate({ topic: customTopic.trim(), style: 'deep_dive' })
                  setSelectedTurnIndex(0)
                  setIsPlaying(false)
                }
              }}
              disabled={generateMutation.isPending || !customTopic.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-brand-500/25 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>{generateMutation.isPending ? 'Generating Episode...' : 'Generate Episode'}</span>
              </span>
            </button>
          </div>
        </div>

        {/* Audio Player Studio & Host Cards */}
        {script && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Studio: Hosts & Controls (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Dual Host Avatar Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Dr. Aris */}
                <div
                  className={`rounded-3xl p-5 border transition-all text-center space-y-3 relative overflow-hidden ${
                    currentSpeaker === 'Dr. Aris' && isPlaying
                      ? 'bg-gradient-to-b from-brand-500/20 to-slate-900 border-brand-400 shadow-xl shadow-brand-500/20 scale-[1.02]'
                      : 'bg-card/70 border-border/80 opacity-80'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-tr from-brand-600 to-teal-400 p-0.5 shadow-lg flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-lg font-bold text-brand-300">
                      DA
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Dr. Aris</h4>
                    <p className="text-[10px] text-brand-400 font-mono">Lead Research Host</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground italic leading-tight">
                    Intuition, broad implications & conceptual bridges
                  </p>
                  {currentSpeaker === 'Dr. Aris' && isPlaying && (
                    <div className="flex items-center justify-center space-x-1 pt-1">
                      <span className="w-1 h-3 bg-brand-400 rounded-full animate-bounce" />
                      <span className="w-1 h-5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1 h-3 bg-brand-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  )}
                </div>

                {/* Dr. Nova */}
                <div
                  className={`rounded-3xl p-5 border transition-all text-center space-y-3 relative overflow-hidden ${
                    currentSpeaker === 'Dr. Nova' && isPlaying
                      ? 'bg-gradient-to-b from-indigo-500/20 to-slate-900 border-indigo-400 shadow-xl shadow-indigo-500/20 scale-[1.02]'
                      : 'bg-card/70 border-border/80 opacity-80'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-tr from-indigo-600 to-purple-400 p-0.5 shadow-lg flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-lg font-bold text-indigo-300">
                      DN
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Dr. Nova</h4>
                    <p className="text-[10px] text-indigo-400 font-mono">Principal Scientist & Critic</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground italic leading-tight">
                    Math, complexity bounds & architectural edge cases
                  </p>
                  {currentSpeaker === 'Dr. Nova' && isPlaying && (
                    <div className="flex items-center justify-center space-x-1 pt-1">
                      <span className="w-1 h-3 bg-indigo-400 rounded-full animate-bounce" />
                      <span className="w-1 h-5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Player Console */}
              <div className="glass-panel rounded-3xl p-6 border border-border shadow-xl space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>{script.dialogue[selectedTurnIndex]?.timestamp_formatted || '00:00'}</span>
                    <span>
                      Turn {selectedTurnIndex + 1} of {script.dialogue.length}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-secondary/80 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-teal-300 rounded-full transition-all duration-300"
                      style={{
                        width: `${((selectedTurnIndex + 1) / script.dialogue.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Primary Player Controls */}
                <div className="flex items-center justify-between">
                  {/* Speed Selector */}
                  <div className="flex items-center space-x-1 bg-secondary/80 p-1 rounded-xl border border-border text-[11px] font-mono">
                    {[1.0, 1.25, 1.5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2 py-0.5 rounded-lg transition-all ${
                          playbackSpeed === spd
                            ? 'bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  {/* Playback Buttons */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedTurnIndex((prev) => Math.max(0, prev - 1))}
                      disabled={selectedTurnIndex === 0}
                      className="p-2.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all disabled:opacity-40"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>

                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all"
                    >
                      {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                    </button>

                    <button
                      onClick={() => setSelectedTurnIndex((prev) => Math.min(script.dialogue.length - 1, prev + 1))}
                      disabled={selectedTurnIndex >= script.dialogue.length - 1}
                      className="p-2.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all disabled:opacity-40"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Reset */}
                  <button
                    onClick={() => {
                      if (synthRef.current) synthRef.current.cancel()
                      setSelectedTurnIndex(0)
                      setIsPlaying(false)
                    }}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
                    title="Restart Episode"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chapters List */}
              <div className="glass-panel rounded-3xl p-5 border border-border space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Episode Chapters</span>
                </h4>
                <div className="space-y-2">
                  {script.chapters.map((ch, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        // Find turn closest to start_seconds
                        const turnIdx = script.dialogue.findIndex(
                          (t) => t.timestamp_seconds >= ch.start_seconds
                        )
                        if (turnIdx !== -1) {
                          setSelectedTurnIndex(turnIdx)
                        }
                      }}
                      className="w-full p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/70 border border-border/60 text-left flex items-center justify-between text-xs transition-all group"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-semibold text-foreground group-hover:text-brand-300 truncate">
                          {ch.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{ch.summary}</p>
                      </div>
                      <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 ml-2">
                        {ch.start_formatted}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Takeaways */}
              <div className="glass-panel rounded-3xl p-5 border border-border space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-brand-400" />
                  <span>Core Research Takeaways</span>
                </h4>
                <ul className="space-y-2">
                  {script.key_takeaways.map((tk, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-200 bg-secondary/30 p-3 rounded-xl border border-border/60 flex items-start space-x-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                      <span>{tk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Studio: Interactive Dialogue Stream (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">{script.title}</h3>
                  <p className="text-xs text-muted-foreground">{script.subtitle}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-all"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
                  </button>
                </div>
              </div>

              {/* Transcript Scroll Container */}
              <div className="space-y-3 max-h-[750px] overflow-y-auto pr-2">
                {script.dialogue.map((turn, idx) => {
                  const isActive = idx === selectedTurnIndex
                  const isAris = turn.speaker === 'Dr. Aris'

                  return (
                    <div
                      key={turn.turn_id}
                      onClick={() => {
                        setSelectedTurnIndex(idx)
                        if (!isPlaying) setIsPlaying(true)
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? isAris
                            ? 'bg-gradient-to-r from-brand-500/20 via-teal-500/10 to-transparent border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-400/40'
                            : 'bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-400/40'
                          : 'bg-card/40 hover:bg-secondary/40 border-border/70 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isAris
                                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {isAris ? 'DA' : 'DN'}
                          </span>
                          <span className="text-xs font-bold text-foreground">{turn.speaker}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            • {turn.speaker_title}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {turn.tone}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                            {turn.timestamp_formatted}
                          </span>
                        </div>
                      </div>

                      <p
                        className={`text-xs md:text-sm leading-relaxed ${
                          isActive ? 'text-foreground font-medium' : 'text-slate-300'
                        }`}
                      >
                        {turn.text}
                      </p>

                      {turn.citations && turn.citations.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-border/40 flex items-center space-x-2 text-[10px] text-muted-foreground font-mono">
                          <BookOpen className="w-3 h-3 text-teal-400" />
                          <span>Grounded in: {turn.citations.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
