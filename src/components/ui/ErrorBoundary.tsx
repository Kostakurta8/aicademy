'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  level?: 'page' | 'component' | 'ai'
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      const level = this.props.level || 'page'

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card padding="lg" className="max-w-md w-full text-center">
            <AlertTriangle size={40} className="text-gold mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              {level === 'ai'
                ? 'AI Feature Error'
                : level === 'component'
                ? 'Component Error'
                : 'Something Went Wrong'}
            </h2>
            <p className="text-sm text-text-secondary mb-2">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            {level === 'ai' && (
              <p className="text-xs text-text-muted mb-4">
                This might be an AI connection issue. Check your Groq API key in Settings.
              </p>
            )}
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button onClick={this.handleRetry} icon={<RotateCcw size={16} />} variant="primary">
                Retry
              </Button>
              <Link href="/dashboard">
                <Button variant="ghost" icon={<Home size={16} />}>Dashboard</Button>
              </Link>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
