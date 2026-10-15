import { Link, useNavigate } from 'react-router-dom'
import { Brand } from './Brand'
import { useAuth } from '../../context/AuthContext'

export function Footer() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const dashboardPath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <footer className="home-footer">
      <div className="footer-container">
        <div className="footer-main-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Brand size="md" />
            <p className="footer-tagline">
              Precision-engineered fleet reservations across India. Verified luxury vehicles,
              transparent pricing, and seamless airport or depot collection.
            </p>
          </div>

          {/* Navigation Column */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">NAVIGATION</h4>
            <ul className="footer-links-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/cars">Cars</Link></li>
              <li><Link to="/bikes">Bikes</Link></li>
              <li><Link to="/vehicles">Fleet Catalogue</Link></li>
              <li><Link to="/help">Help & Contact</Link></li>
            </ul>
          </div>

          {/* Account Column */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">ACCOUNT</h4>
            <ul className="footer-links-list">
              {!isAuthenticated ? (
                <>
                  <li><Link to="/login">Sign In</Link></li>
                  <li><Link to="/register">Create Account</Link></li>
                </>
              ) : (
                <>
                  <li><Link to={dashboardPath}>Dashboard</Link></li>
                  <li><Link to="/bookings">My Bookings</Link></li>
                  <li><Link to="/profile">Profile Settings</Link></li>
                  <li>
                    <button type="button" onClick={handleLogout} className="footer-logout-link">
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Legal Column */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">LEGAL</h4>
            <ul className="footer-links-list">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/cancellation-policy">Cancellation Policy</Link></li>
              <li><Link to="/rental-conditions">Rental Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-row">
          <p className="footer-copyright">
            © {new Date().getFullYear()} VAYRO Platform. All rights reserved. · Verified Fleet Reservations
          </p>
        </div>
      </div>
    </footer>
  )
}
