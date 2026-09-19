import { cn } from '../../utils/cn'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('glass-skeleton', className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn('glass-skeleton-card', className)} aria-hidden="true">
      <Skeleton className="skeleton-thumb" />
      <div className="skeleton-content">
        <Skeleton className="skeleton-line skeleton-line--title" />
        <Skeleton className="skeleton-line skeleton-line--subtitle" />
        <Skeleton className="skeleton-line skeleton-line--price" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 4, className }) {
  return (
    <div className={cn('glass-skeleton-table', className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          <Skeleton className="skeleton-table-cell" />
          <Skeleton className="skeleton-table-cell" />
          <Skeleton className="skeleton-table-cell" />
          <Skeleton className="skeleton-table-cell" />
        </div>
      ))}
    </div>
  )
}
