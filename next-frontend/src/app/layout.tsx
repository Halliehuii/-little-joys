import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '幸福小事日记 - Little Joys Journal',
  description: '记录生活中的美好瞬间和幸福小事',
}

interface RootLayoutProps {
  children: React.ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-br from-journal-yellow via-journal-pink to-journal-light-pink">
        {children}
      </body>
    </html>
  )
}

export default RootLayout 