import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { LoaderCircle } from 'lucide-react'
import { glassHover } from '../../animations/variants'
import { cn } from '../../utils/cn'

const componentCache = new Map()

function getMotionComponent(as) {
  if (as === 'button') return motion.button
  if (as === 'a') return motion.a
  if (typeof as === 'string' && motion[as]) return motion[as]
  if (!componentCache.has(as)) {
    componentCache.set(as, motion.create(as))
  }
  return componentCache.get(as)
}

export const GlassButton = forwardRef(function GlassButton(
  {
    as = 'button',
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    type = 'button',
    disabled,
    ...props
  },
  ref,
) {
  const Component = getMotionComponent(as)

  return (
    <Component
      ref={ref}
      type={as === 'button' ? type : undefined}
      className={cn('glass-button', `glass-button--${variant}`, `glass-button--${size}`, className)}
      variants={glassHover}
      initial="rest"
      animate="rest"
      whileHover={!disabled && !loading ? 'hover' : undefined}
      whileTap={!disabled && !loading ? 'tap' : undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />}
      {children}
    </Component>
  )
})

