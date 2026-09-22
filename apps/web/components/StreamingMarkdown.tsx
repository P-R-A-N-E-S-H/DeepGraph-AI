'use client'

import React from 'react'

interface StreamingMarkdownProps {
  content: string
}

export default function StreamingMarkdown({ content }: StreamingMarkdownProps) {
  if (!content) return null

  // Split lines to process basic markdown structures
  const lines = content.split('\n')

  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={idx} className="h-1" />
        }

        // Heading 3 ###
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm font-bold text-brand-300 pt-2 border-b border-border/40 pb-1">
              {trimmed.replace('### ', '')}
            </h4>
          )
        }

        // Heading 2 ##
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-foreground pt-3 border-b border-border/60 pb-1">
              {trimmed.replace('## ', '')}
            </h3>
          )
        }

        // Heading 1 #
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-lg font-bold text-foreground pt-4 pb-1">
              {trimmed.replace('# ', '')}
            </h2>
          )
        }

        // Bullet point - or *
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.substring(2)
          return (
            <div key={idx} className="flex items-start space-x-2 pl-2">
              <span className="text-brand-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
              <div className="flex-1">
                {renderFormattedText(itemText)}
              </div>
            </div>
          )
        }

        // Numbered list 1.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-2">
              <span className="text-brand-400 font-mono text-xs font-bold mt-0.5">{numMatch[1]}.</span>
              <div className="flex-1">
                {renderFormattedText(numMatch[2])}
              </div>
            </div>
          )
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-muted-foreground/95">
            {renderFormattedText(line)}
          </p>
        )
      })}
    </div>
  )
}

function renderFormattedText(text: string): React.ReactNode {
  // Replace bold **text**
  const parts = text.split(/(\*\*.*?\*\*|\`.*?\`|\$.*?\$)/g)

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-foreground font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-secondary text-brand-300 font-mono text-xs border border-border">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      return (
        <span key={i} className="px-1 py-0.5 font-mono text-xs text-teal-300 italic bg-teal-950/40 rounded border border-teal-800/40">
          {part.slice(1, -1)}
        </span>
      )
    }
    return part
  })
}
