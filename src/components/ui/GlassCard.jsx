import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { glassHover } from '../../animations/variants'

export function GlassCard({
  as = 'section',
  children,
  className,
  hover = false,
  ...props
}) {
  const Component = motion[as] || motion.div

  return (
    <Component
      className={cn('glass-card', className)}
      initial="rest"
      animate="rest"
      whileHover={hover ? 'hover' : undefined}
      whileTap={hover ? 'tap' : undefined}
      variants={hover ? glassHover : undefined}
      {...props}
    >
      {children}
    </Component>
  )
}
