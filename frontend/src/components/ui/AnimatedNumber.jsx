import { useEffect, useState } from 'react'
import { useMotionValue, useMotionValueEvent, useSpring } from 'framer-motion'

export function AnimatedNumber({ value = 0, format = (number) => number, initial }) {
  const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0
  const initialNum = initial !== undefined ? initial : numericValue
  const rawValue = useMotionValue(initialNum)
  const springValue = useSpring(rawValue, { stiffness: 280, damping: 28, mass: 0.35 })
  const [displayValue, setDisplayValue] = useState(initialNum)

  useEffect(() => {
    rawValue.set(numericValue)
  }, [rawValue, numericValue])

  useMotionValueEvent(springValue, 'change', (latest) => {
    setDisplayValue(Math.round(latest))
  })

  return <span>{format(displayValue)}</span>
}
