import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  Cpu,
  Database,
  Grid,
  Heart,
  Key,
  Layers,
  Menu,
  Scale,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import { Brand } from '../components/layout/Brand'
import { VehicleImage } from '../components/vehicles/VehicleImage'
import { useAuth } from '../context/AuthContext'
import { bikes, cars, vehicles } from '../data/vehicles'

function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function preloadVehicleImage(vehicle) {
  if (!vehicle) return
  const src =
    vehicle.image ||
    vehicle.images?.primary ||
    (vehicle.images?.gallery && vehicle.images.gallery[0])
  if (src && typeof src === 'string') {
    const img = new Image()
    img.src = src
  }
}

export default function HomePage() {
  const { isAuthenticated, role, logout } = useAuth()
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Default/initial hero vehicle
  const initialHeroVehicle = useMemo(() => {
    return (
      cars.find((c) => c.id === 'land-rover-defender') ||
      cars.find((c) => c.id === 'bmw-x7') ||
      vehicles[0]
    )
  }, [])

  // Shuffled playlist starting with initial hero vehicle
  const [playlist, setPlaylist] = useState(() => {
    if (!vehicles || vehicles.length === 0) return []
    const rest = vehicles.filter((v) => v.id !== initialHeroVehicle.id)
    const shuffledRest = shuffleArray(rest)
    return [initialHeroVehicle, ...shuffledRest]
  })

  const [currentIndex, setCurrentIndex] = useState(0)

  // Current active hero vehicle
  const heroVehicle = playlist[currentIndex] || initialHeroVehicle

  // Preload upcoming vehicle image to prevent flickers
  useEffect(() => {
    if (!playlist || playlist.length <= 1) return
    const nextIndex = (currentIndex + 1) % playlist.length
    preloadVehicleImage(playlist[nextIndex])
  }, [currentIndex, playlist])

  // Continuous auto-rotation every 2 seconds
  useEffect(() => {
    if (!playlist || playlist.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1
        if (nextIndex >= playlist.length) {
          const lastVehicle = playlist[prevIndex]
          let newShuffled = shuffleArray(vehicles)
          if (newShuffled[0]?.id === lastVehicle?.id && newShuffled.length > 1) {
            const temp = newShuffled[0]
            newShuffled[0] = newShuffled[1]
            newShuffled[1] = temp
          }
          setPlaylist(newShuffled)
          return 0
        }
        return nextIndex
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [playlist])

  // Verified fleet statistics
  const carsCount = cars.length
  const bikesCount = bikes.length
  const totalVehiclesCount = vehicles.length

  // Dynamically calculate unique brand count from fleet dataset
  const totalBrandsCount = useMemo(() => {
    return new Set(vehicles.map((v) => v.brand.trim())).size
  }, [])

  // Navigation path helper
  const dashboardPath = role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  }

  return (
    <div className="vayro-home">
      {/* BACKGROUND ATMOSPHERE */}
      <div className="vayro-home-bg" aria-hidden="true">
        <div className="bg-glow bg-glow--blue" />
        <div className="bg-glow bg-glow--red" />
        <div className="bg-grid-overlay" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="home-header">
        <div className="home-header-inner">
          <Brand variant="header" size="md" />

          {/* Desktop Nav */}
          <nav className="desktop-nav" aria-label="Main Navigation">
            <Link to="/vehicles" className="nav-link">
              Vehicles
            </Link>
            <Link to="/cars" className="nav-link">
              Cars
            </Link>
            <Link to="/bikes" className="nav-link">
              Bikes
            </Link>
            <a href="#how-it-works" className="nav-link">
              How It Works
            </a>
            <Link to="/help" className="nav-link">
              Help
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="desktop-actions">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn-secondary-link">
                  Sign In
                </Link>
                <Link to="/vehicles" className="btn-primary-accent">
                  Explore Vehicles
                </Link>
              </>
            ) : (
              <>
                <Link to={dashboardPath} className="btn-primary-accent">
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-logout-header"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <motion.div
            className="mobile-nav-drawer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <nav className="mobile-nav-links">
              <Link
                to="/vehicles"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-link"
              >
                Vehicles
              </Link>
              <Link
                to="/cars"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-link"
              >
                Cars
              </Link>
              <Link
                to="/bikes"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-link"
              >
                Bikes
              </Link>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-link"
              >
                How It Works
              </a>
              <Link
                to="/help"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-link"
              >
                Help
              </Link>
            </nav>
            <div className="mobile-nav-actions">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-mobile-secondary"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/vehicles"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-mobile-primary"
                  >
                    Explore Vehicles →
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-mobile-primary"
                  >
                    Go to Dashboard →
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn-mobile-secondary"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </header>

      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="hero-container">
          <motion.div
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Eyebrow */}
            <motion.div variants={fadeIn} className="hero-eyebrow-wrapper">
              <span className="hero-eyebrow">
                <span className="eyebrow-dot" />
                VAYRO MOBILITY
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeIn} className="hero-title">
              DRIVE YOUR
              <br />
              <span className="title-accent">NEXT JOURNEY.</span>
            </motion.h1>

            {/* Supporting Text */}
            <motion.p variants={fadeIn} className="hero-subtitle">
              Premium cars, bikes and scooters for every journey.
            </motion.p>

            {/* Hero Actions */}
            <motion.div variants={fadeIn} className="hero-actions">
              {!isAuthenticated ? (
                <>
                  <Link to="/vehicles" className="btn-hero-primary">
                    Explore Vehicles <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="btn-hero-secondary">
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  <Link to={dashboardPath} className="btn-hero-primary">
                    Go to Dashboard <ArrowRight size={18} />
                  </Link>
                  <Link to="/vehicles" className="btn-hero-secondary">
                    Explore Vehicles →
                  </Link>
                </>
              )}
            </motion.div>

            {/* Trust Badges */}
            <motion.div variants={fadeIn} className="hero-trust-badges">
              <div className="trust-item">
                <ShieldCheck size={16} className="trust-icon" />
                <span>Verified Fleet</span>
              </div>
              <div className="trust-item">
                <Sparkles size={16} className="trust-icon" />
                <span>Transparent Specifications</span>
              </div>
              <div className="trust-item">
                <Key size={16} className="trust-icon" />
                <span>Seamless Reservations</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Visual Card */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="hero-visual-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroVehicle.id || currentIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.4,
                    ease: 'easeInOut',
                  }}
                  className="hero-visual-content"
                >
                  <div className="hero-image-wrapper">
                    <VehicleImage
                      vehicle={heroVehicle}
                      priority={true}
                      className="hero-vehicle-img"
                    />
                  </div>
                  <div className="hero-card-badge">
                    <span className="badge-brand">{heroVehicle.brand}</span>
                    <span className="badge-model">{heroVehicle.model}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. YOUR JOURNEY STARTS HERE */}
      <section className="journey-starts-section">
        <div className="section-container">
          <motion.div
            className="section-header text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeIn}
          >
            <span className="section-eyebrow">VAYRO MOBILITY PLATFORM</span>
            <h2 className="section-title">YOUR JOURNEY STARTS HERE</h2>
            <p className="journey-starts-subtitle">
              Explore the VAYRO fleet, discover your next vehicle, and manage every reservation from one place.
            </p>
          </motion.div>

          <motion.div
            className="journey-feature-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            {/* Feature 01 */}
            <motion.div
              variants={fadeIn}
              whileHover={{ y: -6 }}
              className="journey-feature-card"
              onClick={() => navigate('/vehicles')}
            >
              <div className="journey-card-num">01</div>
              <div className="journey-card-icon">
                <Compass size={24} />
              </div>
              <h3 className="journey-card-title">EXPLORE THE FLEET</h3>
              <p className="journey-card-desc">
                Browse {carsCount} cars and {bikesCount} bikes & scooters across all categories.
              </p>
              <div className="journey-card-link">
                <span>View All Fleet ({totalVehiclesCount})</span>
                <ChevronRight size={16} />
              </div>
            </motion.div>

            {/* Feature 02 */}
            <motion.div
              variants={fadeIn}
              whileHover={{ y: -6 }}
              className="journey-feature-card"
              onClick={() => navigate('/cars')}
            >
              <div className="journey-card-num">02</div>
              <div className="journey-card-icon">
                <Sliders size={24} />
              </div>
              <h3 className="journey-card-title">CHOOSE YOUR RIDE</h3>
              <p className="journey-card-desc">
                Compare vehicles, check detailed specifications, and view complete vehicle details.
              </p>
              <div className="journey-card-link">
                <span>Browse Categories</span>
                <ChevronRight size={16} />
              </div>
            </motion.div>

            {/* Feature 03 */}
            <motion.div
              variants={fadeIn}
              whileHover={{ y: -6 }}
              className="journey-feature-card"
              onClick={() => navigate(isAuthenticated ? dashboardPath : '/login')}
            >
              <div className="journey-card-num">03</div>
              <div className="journey-card-icon">
                <UserRound size={24} />
              </div>
              <h3 className="journey-card-title">MANAGE YOUR JOURNEY</h3>
              <p className="journey-card-desc">
                Track bookings, active reservations and your VAYRO account from the dashboard.
              </p>
              <div className="journey-card-link">
                <span>{isAuthenticated ? 'Open Dashboard' : 'Sign In to Dashboard'}</span>
                <ChevronRight size={16} />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. SECTION 1 — ABOUT VAYRO */}
      <section className="about-vayro-section">
        <div className="section-container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeIn}
          >
            <span className="section-eyebrow">VAYRO MOBILITY PLATFORM</span>
            <h2 className="section-title">ONE PLATFORM. EVERY JOURNEY.</h2>
          </motion.div>

          <motion.div
            className="about-two-col"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="about-left-col">
              <h3 className="about-headline">
                Mobility,
                <br />
                without the
                <br />
                <span className="text-accent-blue">complexity.</span>
              </h3>
            </motion.div>

            <motion.div variants={fadeIn} className="about-right-col">
              <p className="about-lead">
                VAYRO is a modern vehicle-rental and mobility platform designed to make discovering, comparing, reserving, and managing vehicles simple.
              </p>
              <p className="about-body">
                From everyday city travel to weekend escapes, VAYRO brings cars, motorcycles and scooters together in one clear digital experience.
              </p>
              <div className="about-check-list">
                <div className="about-check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span>Unified cars, motorcycles & scooters fleet</span>
                </div>
                <div className="about-check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span>Comprehensive technical specifications & high-resolution views</span>
                </div>
                <div className="about-check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span>Centralized reservation workspace for customer convenience</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4. SECTION 2 — BUILT FOR MODERN MOBILITY */}
      <section className="capabilities-section">
        <div className="section-container">
          <motion.div
            className="section-header text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeIn}
          >
            <span className="section-eyebrow">PLATFORM CAPABILITIES</span>
            <h2 className="section-title">BUILT FOR MODERN MOBILITY</h2>
          </motion.div>

          <motion.div
            className="capabilities-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="capability-card">
              <span className="capability-num">01</span>
              <div className="capability-icon-box">
                <Grid size={22} />
              </div>
              <h3 className="capability-title">CURATED VEHICLE CATALOGUE</h3>
              <p className="capability-desc">
                Explore a diverse fleet of cars, motorcycles and scooters through one unified platform.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="capability-card">
              <span className="capability-num">02</span>
              <div className="capability-icon-box">
                <Search size={22} />
              </div>
              <h3 className="capability-title">SMART DISCOVERY</h3>
              <p className="capability-desc">
                Browse by vehicle type, explore specifications, compare options and find the right vehicle for your journey.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="capability-card">
              <span className="capability-num">03</span>
              <div className="capability-icon-box">
                <Zap size={22} />
              </div>
              <h3 className="capability-title">SEAMLESS RESERVATIONS</h3>
              <p className="capability-desc">
                Move from vehicle discovery to reservation through a simple, structured booking experience.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="capability-card">
              <span className="capability-num">04</span>
              <div className="capability-icon-box">
                <Layers size={22} />
              </div>
              <h3 className="capability-title">CENTRALIZED MANAGEMENT</h3>
              <p className="capability-desc">
                Manage bookings, reservations, wishlist items, comparisons and account information from your VAYRO workspace.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 5. SECTION 3 — PROJECT SCALE */}
      <section className="stats-section">
        <div className="section-container">
          <motion.div
            className="section-header text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeIn}
          >
            <span className="section-eyebrow">FLEET STATISTICS</span>
            <h2 className="section-title">PROJECT SCALE</h2>
          </motion.div>

          <motion.div
            className="stats-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="stat-card">
              <div className="stat-value">{totalVehiclesCount}</div>
              <div className="stat-label">TOTAL VEHICLES</div>
              <div className="stat-sub">Verified mobility fleet</div>
            </motion.div>

            <motion.div variants={fadeIn} className="stat-card">
              <div className="stat-value">{carsCount}</div>
              <div className="stat-label">CARS</div>
              <div className="stat-sub">Hatchbacks, Sedans & SUVs</div>
            </motion.div>

            <motion.div variants={fadeIn} className="stat-card">
              <div className="stat-value">{bikesCount}</div>
              <div className="stat-label">BIKES & SCOOTERS</div>
              <div className="stat-sub">Cruisers, Sports & Electric</div>
            </motion.div>

            <motion.div variants={fadeIn} className="stat-card">
              <div className="stat-value">{totalBrandsCount}+</div>
              <div className="stat-label">BRANDS</div>
              <div className="stat-sub">Automotive manufacturers</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 6. SECTION 4 — HOW THE PLATFORM WORKS */}
      <section className="how-vayro-section" id="how-it-works">
        <div className="section-container">
          <motion.div
            className="section-header text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeIn}
          >
            <span className="section-eyebrow">RESERVATION PROCESS</span>
            <h2 className="section-title">HOW VAYRO WORKS</h2>
          </motion.div>

          <motion.div
            className="process-steps-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="process-step-card">
              <div className="step-tag">STEP 01</div>
              <h3 className="process-step-title">DISCOVER</h3>
              <p className="process-step-desc">
                Browse the VAYRO vehicle catalogue and explore available cars, bikes and scooters.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="process-step-card">
              <div className="step-tag">STEP 02</div>
              <h3 className="process-step-title">COMPARE</h3>
              <p className="process-step-desc">
                Review vehicle details and compare options before making your decision.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="process-step-card">
              <div className="step-tag">STEP 03</div>
              <h3 className="process-step-title">RESERVE</h3>
              <p className="process-step-desc">
                Choose your preferred vehicle and continue through the reservation process.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="process-step-card">
              <div className="step-tag">STEP 04</div>
              <h3 className="process-step-title">MANAGE</h3>
              <p className="process-step-desc">
                Use your VAYRO dashboard to manage your account and reservations.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 7. SECTION 5 — CUSTOMER EXPERIENCE */}
      <section className="customer-experience-section">
        <div className="section-container">
          <motion.div
            className="section-header text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeIn}
          >
            <span className="section-eyebrow">USER-CENTRIC DESIGN</span>
            <h2 className="section-title">DESIGNED AROUND THE JOURNEY</h2>
          </motion.div>

          <motion.div
            className="experience-cards-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="exp-card">
              <div className="exp-badge">DISCOVER</div>
              <h3 className="exp-title">Seamless Exploration</h3>
              <p className="exp-desc">
                Find vehicles without unnecessary complexity.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="exp-card">
              <div className="exp-badge">DECIDE</div>
              <h3 className="exp-title">Informed Selection</h3>
              <p className="exp-desc">
                Understand the vehicle before you reserve.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="exp-card">
              <div className="exp-badge">MOVE</div>
              <h3 className="exp-title">Effortless Control</h3>
              <p className="exp-desc">
                Keep your journey and reservations organized.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 8. SECTION 6 — TECHNOLOGY / PLATFORM */}
      <section className="tech-platform-section">
        <div className="section-container">
          <motion.div
            className="section-header text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeIn}
          >
            <span className="section-eyebrow">SOFTWARE ARCHITECTURE</span>
            <h2 className="section-title">ENGINEERED FOR A CLEARER EXPERIENCE</h2>
            <p className="tech-subtitle">
              The VAYRO web interface unifies essential customer features into a sleek, responsive digital mobility environment.
            </p>
          </motion.div>

          <motion.div
            className="tech-features-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="tech-item">
              <div className="tech-icon"><Search size={20} /></div>
              <div className="tech-info">
                <h4>Vehicle Discovery</h4>
                <p>Filter across cars, bikes & scooters with real-time category controls.</p>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="tech-item">
              <div className="tech-icon"><Grid size={20} /></div>
              <div className="tech-info">
                <h4>Vehicle Details</h4>
                <p>High-resolution multi-angle image views and technical specifications.</p>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="tech-item">
              <div className="tech-icon"><ShieldCheck size={20} /></div>
              <div className="tech-info">
                <h4>Authentication</h4>
                <p>Secure login system with persistent session storage and protected routes.</p>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="tech-item">
              <div className="tech-icon"><UserRound size={20} /></div>
              <div className="tech-info">
                <h4>User Dashboard</h4>
                <p>Dedicated customer workspace showing active rentals and bookings.</p>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="tech-item">
              <div className="tech-icon"><Clock3 size={20} /></div>
              <div className="tech-info">
                <h4>Booking Management</h4>
                <p>Structured reservation process for scheduling pickup and dropoff.</p>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="tech-item">
              <div className="tech-icon"><Heart size={20} /></div>
              <div className="tech-info">
                <h4>Wishlist</h4>
                <p>Save favorite vehicles for fast access and quick reservation.</p>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="tech-item">
              <div className="tech-icon"><Scale size={20} /></div>
              <div className="tech-info">
                <h4>Vehicle Comparison</h4>
                <p>Side-by-side spec comparisons for evaluating options.</p>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="tech-item">
              <div className="tech-icon"><Cpu size={20} /></div>
              <div className="tech-info">
                <h4>Responsive Experience</h4>
                <p>Optimized for seamless performance across desktop, tablet, and mobile devices.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 9. SECTION 7 — PROJECT VISION */}
      <section className="vision-section">
        <div className="section-container">
          <motion.div
            className="vision-card"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeIn}
          >
            <div className="vision-glow" aria-hidden="true" />
            <span className="section-eyebrow">PROJECT VISION</span>
            <h2 className="vision-title">THE VAYRO VISION</h2>
            <p className="vision-lead">
              "VAYRO is built around a simple idea: vehicle rental should feel clear, modern and effortless."
            </p>
            <p className="vision-body">
              The platform brings discovery, decision-making and reservation management into one connected experience, giving customers a clearer way to move.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 10. SECTION 8 — FINAL CTA */}
      <section className="cta-banner-section">
        <div className="section-container">
          <div className="cta-banner-card">
            <div className="cta-banner-bg">
              <VehicleImage vehicle={heroVehicle} className="cta-bg-img" />
              <div className="cta-banner-overlay" />
            </div>
            <div className="cta-banner-content">
              <h2 className="cta-title">READY FOR THE NEXT JOURNEY?</h2>
              <p className="cta-subtitle">
                Explore the VAYRO platform and discover a clearer way to find your next ride.
              </p>
              <div className="cta-actions-wrap">
                {!isAuthenticated ? (
                  <>
                    <Link to="/vehicles" className="btn-cta-large">
                      Explore Vehicles <ArrowRight size={20} />
                    </Link>
                    <a href="#how-it-works" className="btn-cta-secondary">
                      How It Works
                    </a>
                  </>
                ) : (
                  <>
                    <Link to={dashboardPath} className="btn-cta-large">
                      Go to Dashboard <ArrowRight size={20} />
                    </Link>
                    <Link to="/vehicles" className="btn-cta-secondary">
                      Explore Vehicles →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-main-grid">
            {/* Brand Column */}
            <div className="footer-brand-col">
              <Brand variant="footer" size="md" />
              <p className="footer-tagline">Vehicle Rental & Mobility</p>
              <div className="m-stripe-divider" style={{ width: '120px', marginTop: '16px' }} />
            </div>

            {/* Navigation Column */}
            <div className="footer-links-col">
              <h4 className="footer-col-title">NAVIGATION</h4>
              <ul className="footer-links-list">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/cars">Cars</Link></li>
                <li><Link to="/bikes">Bikes</Link></li>
                <li><Link to="/vehicles">Vehicles</Link></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><Link to="/help">Help</Link></li>
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
                    <li><button type="button" onClick={handleLogout} className="footer-logout-link">Logout</button></li>
                  </>
                )}
              </ul>
            </div>

            {/* Legal Column */}
            <div className="footer-links-col">
              <h4 className="footer-col-title">LEGAL</h4>
              <ul className="footer-links-list">
                <li><span className="footer-static-link">Privacy Policy</span></li>
                <li><span className="footer-static-link">Terms of Service</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-row">
            <p className="footer-copyright">
              © {new Date().getFullYear()} VAYRO. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
