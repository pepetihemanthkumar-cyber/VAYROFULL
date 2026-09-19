import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Component } from 'react'
import vayroLogo from '../../assets/branding/vayro-logo.jpg'
import { GlassButton } from '../ui/GlassButton'
import { GlassCard } from '../ui/GlassCard'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('VAYRO ErrorBoundary caught an exception:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-boundary-screen" role="alert">
          <GlassCard className="error-boundary-card">
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <a href="/dashboard" className="brand brand--md" aria-label="VAYRO — Go to Dashboard">
                <img src={vayroLogo} alt="VAYRO" className="brand-logo-img" />
              </a>
            </div>
            <div className="error-boundary-icon-wrap">
              <AlertTriangle size={28} strokeWidth={2} aria-hidden="true" />
            </div>

            <p className="eyebrow">Application Recovery</p>
            <h2>Something went wrong.</h2>
            <p className="error-boundary-description">
              We couldn&apos;t load this part of VAYRO. Your account data and active bookings are safe.
            </p>

            <div className="error-boundary-actions">
              <GlassButton onClick={() => window.location.reload()}>
                <RefreshCw size={15} aria-hidden="true" /> Try again
              </GlassButton>
              <GlassButton
                variant="secondary"
                onClick={() => {
                  this.handleReset()
                  window.location.href = '/dashboard'
                }}
              >
                Return to Dashboard
              </GlassButton>
            </div>
          </GlassCard>
        </main>
      )
    }

    return this.props.children
  }
}
