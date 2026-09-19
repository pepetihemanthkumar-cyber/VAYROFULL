import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  left: `${((i * 17) % 94) + 3}%`,
  top: `${((i * 23) % 90) + 5}%`,
  size: (i % 3) + 2,
  duration: 11 + (i % 8) * 2,
  delay: (i % 5) * 1.4,
  color: i % 4 === 0 ? 'rgba(96, 165, 250, 0.85)' : i % 7 === 0 ? 'rgba(239, 68, 68, 0.65)' : 'rgba(255, 255, 255, 0.45)',
}))

export function LiquidBackground() {
  const shouldReduceMotion = useReducedMotion()
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (shouldReduceMotion) return
    let frameId
    function handleMouseMove(e) {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const ox = ((e.clientX - cx) / cx) * 4
      const oy = ((e.clientY - cy) / cy) * 4
      frameId = requestAnimationFrame(() => {
        setMouseOffset({ x: ox, y: oy })
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [shouldReduceMotion])

  const blueGlowAnimation = shouldReduceMotion
    ? {}
    : {
        x: ['-5%', '6%', '-2%', '-5%'],
        y: ['-4%', '5%', '0%', '-4%'],
        scale: [1, 1.12, 0.98, 1],
        opacity: [0.75, 0.95, 0.8, 0.75],
      }

  const redGlowAnimation = shouldReduceMotion
    ? {}
    : {
        x: ['6%', '-4%', '3%', '6%'],
        y: ['5%', '-3%', '1%', '5%'],
        scale: [0.95, 1.08, 1, 0.95],
        opacity: [0.4, 0.7, 0.5, 0.4],
      }

  return (
    <div className="liquid-background" aria-hidden="true">
      {/* LAYER 1: Ambient Base Grid */}
      <div className="motion-bg-base" />

      {/* LAYER 2: Blue Atmospheric Glow (Upper Left) */}
      <motion.div
        className="motion-glow motion-glow--blue"
        animate={blueGlowAnimation}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          transform: `translate3d(${mouseOffset.x * 1.5}px, ${mouseOffset.y * 1.5}px, 0)`,
        }}
      />

      {/* LAYER 3: Red Atmospheric Glow (Lower Right) */}
      <motion.div
        className="motion-glow motion-glow--red"
        animate={redGlowAnimation}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          transform: `translate3d(${mouseOffset.x * -1}px, ${mouseOffset.y * -1}px, 0)`,
        }}
      />

      {/* LAYER 4 & 5: Automotive Light Trails (Flowing Vector SVG matching Reference Image) */}
      {!shouldReduceMotion && (
        <div className="motion-light-trails-svg">
          <svg viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="blueTrailGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.95" />
                <stop offset="40%" stopColor="#1c69d4" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#1c69d4" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="blueTrailGrad2" x1="0%" y1="80%" x2="80%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#1d4ed8" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="redTrailGrad1" x1="100%" y1="100%" x2="30%" y2="0%">
                <stop offset="0%" stopColor="#ff2a55" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#e22718" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="redTrailGrad2" x1="100%" y1="90%" x2="40%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#dc2626" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Blue Trail 1: Primary Lower-Left Road Curve */}
            <path
              d="M -120 920 C 150 780, 420 560, 920 380"
              stroke="url(#blueTrailGrad1)"
              strokeWidth="4"
              strokeLinecap="round"
              className="trail-path trail-path--blue-1"
            />

            {/* Blue Trail 2: Secondary Lower-Left Velocity Stream */}
            <path
              d="M -80 840 C 220 720, 520 500, 1020 320"
              stroke="url(#blueTrailGrad2)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="trail-path trail-path--blue-2"
            />

            {/* Blue Trail 3: Upper-Left Sweeping Arc Curve */}
            <path
              d="M -100 380 C 100 180, 450 60, 950 20"
              stroke="url(#blueTrailGrad1)"
              strokeWidth="2"
              strokeLinecap="round"
              className="trail-path trail-path--blue-1"
            />

            {/* Red Trail 1: Primary Lower-Right Rear Light Curve */}
            <path
              d="M 1560 920 C 1280 820, 980 640, 620 480"
              stroke="url(#redTrailGrad1)"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="trail-path trail-path--red-1"
            />

            {/* Red Trail 2: Secondary Lower-Right Acceleration Line */}
            <path
              d="M 1500 860 C 1220 760, 920 580, 580 440"
              stroke="url(#redTrailGrad2)"
              strokeWidth="2"
              strokeLinecap="round"
              className="trail-path trail-path--red-1"
            />
          </svg>
        </div>
      )}

      {/* LAYER 6: Orbital Curves */}
      <motion.div
        className="motion-orbital-container"
        animate={shouldReduceMotion ? {} : { rotate: 360 }}
        transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
      >
        <div className="motion-orbital-ring motion-orbital-ring--1" />
        <div className="motion-orbital-ring motion-orbital-ring--2" />
      </motion.div>

      {/* LAYER 7: Floating Digital Mobility Particles */}
      {!shouldReduceMotion && (
        <div className="motion-particles-wrap">
          {PARTICLES.map((p) => (
            <motion.span
              key={p.id}
              className="motion-particle"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              }}
              animate={{
                y: [0, -120, -240],
                x: [0, p.id % 2 === 0 ? 15 : -15, 0],
                opacity: [0.1, 0.7, 0.1],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* LAYER 8: Quiet Protection Vignette */}
      <div className="motion-quiet-vignette" />
    </div>
  )
}
