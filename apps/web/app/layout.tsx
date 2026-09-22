import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'DeepGraph AI — Turn Research Papers into Connected Intelligence Graphs',
  description: 'Production-grade research intelligence platform with hybrid vector-graph semantic retrieval and citation-verified multi-agent reasoning.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
