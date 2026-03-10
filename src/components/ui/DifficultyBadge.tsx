interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard'
  showLabel?: boolean
}

const config = {
  easy: { dots: 1, color: 'bg-green', label: 'Easy' },
  medium: { dots: 2, color: 'bg-gold', label: 'Medium' },
  hard: { dots: 3, color: 'bg-red', label: 'Hard' },
}

export default function DifficultyBadge({ difficulty, showLabel = false }: DifficultyBadgeProps) {
  const { dots, color, label } = config[difficulty]

  return (
    <div
      className="inline-flex items-center gap-1.5"
      aria-label={`Difficulty: ${label}`}
      title={label}
    >
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`
              w-2 h-2 rounded-full transition-colors
              ${i <= dots ? color : 'bg-border-subtle'}
            `}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      )}
    </div>
  )
}
