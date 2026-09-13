export function VehicleSkeleton() {
  return (
    <div className="vehicle-skeleton" aria-label="Loading vehicles">
      <span className="skeleton-block skeleton-image" />
      <div className="skeleton-body"><span className="skeleton-block skeleton-line skeleton-line--short" /><span className="skeleton-block skeleton-line" /><span className="skeleton-block skeleton-line skeleton-line--medium" /><span className="skeleton-block skeleton-actions" /></div>
    </div>
  )
}
