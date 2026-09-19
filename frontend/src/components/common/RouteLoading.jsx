import { Brand } from '../layout/Brand'

export function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-label="Loading VAYRO">
      <Brand variant="system" size="lg" />
      <div className="route-loading-spinner" aria-hidden="true" />
    </div>
  )
}

