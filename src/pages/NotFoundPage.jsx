import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AuthLayout } from '../components/layout/AuthLayout'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassCard } from '../components/ui/GlassCard'

export default function NotFoundPage() {
  return (
    <AuthLayout eyebrow="404" title="This route has moved on." description="The page you were looking for is not available in this workspace.">
      <GlassCard className="auth-card not-found-card"><GlassButton as={Link} to="/dashboard" variant="secondary"><ArrowLeft size={17} aria-hidden="true" /> Return to VAYRO</GlassButton></GlassCard>
    </AuthLayout>
  )
}
