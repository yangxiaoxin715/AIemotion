import type { Metadata } from 'next'
import './globals.css'
import { PageErrorBoundary } from '@/components/error-boundary'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'AIemotion - 情绪记录与分析',
  description: '基于AI的情绪记录和分析工具，帮助你更好地理解自己的情感世界',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <PageErrorBoundary>
          {children}
          <Toaster />
        </PageErrorBoundary>
      </body>
    </html>
  )
}
