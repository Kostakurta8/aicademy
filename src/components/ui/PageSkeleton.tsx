'use client'

interface PageSkeletonProps {
  title?: boolean
  cards?: number
  className?: string
}

export default function PageSkeleton({ title = true, cards = 3, className = '' }: PageSkeletonProps) {
  return (
    <div className={`p-6 md:p-8 max-w-5xl mx-auto animate-pulse ${className}`}>
      {title && (
        <div className="mb-8">
          <div className="h-8 w-48 bg-surface-raised rounded-lg mb-3" />
          <div className="h-4 w-72 bg-surface-raised rounded-lg" />
        </div>
      )}
      <div className="space-y-4">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="rounded-2xl border border-border-subtle bg-surface p-6">
            <div className="h-5 w-40 bg-surface-raised rounded mb-3" />
            <div className="h-4 w-full bg-surface-raised rounded mb-2" />
            <div className="h-4 w-3/4 bg-surface-raised rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
