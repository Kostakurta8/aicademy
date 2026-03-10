import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import ThemeProvider from '@/components/layout/ThemeProvider'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import ClientOnly from '@/components/ui/ClientOnly'

// Dynamic imports — code-split overlay/modal components into separate chunks
const ToastContainer = dynamic(() => import('@/components/notifications/ToastContainer'))
const CommandPalette = dynamic(() => import('@/components/layout/CommandPalette'))
const KeyboardShortcuts = dynamic(() => import('@/components/layout/KeyboardShortcuts'))
const AITutor = dynamic(() => import('@/components/ai/AITutor'))
const OnboardingGate = dynamic(() => import('@/components/onboarding/OnboardingGate'))
const GlobalXPToast = dynamic(() => import('@/components/layout/XPBar').then(m => ({ default: m.GlobalXPToast })))
const CelebrationOverlay = dynamic(() => import('@/components/ui/CelebrationOverlay'))

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#8b5cf6',
}

export const metadata: Metadata = {
  title: 'AIcademy — AI Literacy Learning Platform',
  description:
    'Master AI through interactive lessons, sandboxes, and gamified learning. Powered by Groq AI.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AIcademy',
  },
  icons: {
    apple: '/icon-192.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`} suppressHydrationWarning>
        <ClientOnly
          fallback={
            <div className="min-h-screen bg-[#070710] flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple to-blue animate-pulse flex items-center justify-center">
                <span className="text-white font-bold text-xs">AI</span>
              </div>
            </div>
          }
        >
          <ThemeProvider>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg">Skip to main content</a>
            <Sidebar />
            <Navbar />
            <main
              id="main-content"
              role="main"
              className="min-h-screen pt-16 pb-20 md:pb-0 transition-all duration-300 ml-0 md:ml-[260px]"
            >
              {children}
            </main>
            <BottomNav />
            <GlobalXPToast />
            <CelebrationOverlay />
            <ToastContainer />
            <CommandPalette />
            <KeyboardShortcuts />
            <AITutor />
            <OnboardingGate />
          </ThemeProvider>
        </ClientOnly>
      </body>
    </html>
  )
}
