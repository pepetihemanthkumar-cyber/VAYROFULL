/**
 * DriveEase — Centralized Premium Motion & Transition System
 * 
 * Easing: Apple/Liquid-Glass curve cubic-bezier(0.22, 1, 0.36, 1)
 * Timing Standards:
 * - Micro interactions: 120–180ms
 * - Buttons / Inputs: 150–220ms
 * - Dropdowns: 200–280ms
 * - Modals: 250–350ms
 * - Page transitions: 300–450ms
 * - Large layout: 350–500ms
 */

export const motionTiming = {
  micro: 0.16,
  btn: 0.18,
  dropdown: 0.22,
  card: 0.28,
  modal: 0.28,
  pageEnter: 0.34,
  pageExit: 0.22,
  layout: 0.36,
}

export const easing = [0.22, 1, 0.36, 1]
export const easeOut = [0.22, 1, 0.36, 1]

export const smoothSpring = {
  type: 'spring',
  stiffness: 340,
  damping: 32,
  mass: 0.8,
}

export const fastSpring = {
  type: 'spring',
  stiffness: 380,
  damping: 36,
  mass: 0.6,
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: easing } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: easing } },
}

export const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, delay, ease: easing },
  }),
  exit: { opacity: 0, y: -4, transition: { duration: 0.18, ease: easing } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.24, delay, ease: easing },
  }),
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.16, ease: easing } },
}

export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: easing },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.22, ease: easing },
  },
}

export const glassHover = {
  rest: { y: 0, scale: 1, transition: { duration: 0.18, ease: easing } },
  hover: { y: -1, scale: 1.002, transition: { duration: 0.18, ease: easing } },
  tap: { y: 0, scale: 0.985, transition: { duration: 0.12, ease: easing } },
}

export const glassButtonHover = {
  rest: { y: 0, scale: 1, transition: { duration: 0.18, ease: easing } },
  hover: { y: -1, scale: 1, transition: { duration: 0.18, ease: easing } },
  tap: { y: 0, scale: 0.985, transition: { duration: 0.12, ease: easing } },
}

export const modalTransition = {
  hidden: { opacity: 0, scale: 0.985, y: 6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.26, ease: easing },
  },
  exit: { opacity: 0, scale: 0.99, y: 4, transition: { duration: 0.18, ease: easing } },
}

export const backdropTransition = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: easing } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: easing } },
}

export const quickViewBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: easeOut } },
}

export const quickViewModalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.32, ease: easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 10,
    transition: { duration: 0.2, ease: easeOut },
  },
}

export const quickViewImageVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, delay: 0.05, ease: easeOut },
  },
}

export const dropdownTransition = {
  hidden: { opacity: 0, scale: 0.98, y: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: easing },
  },
  exit: { opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.15, ease: easing } },
}

export const chipTransition = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.18, ease: easing } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.14, ease: easing } },
}

export const accordionTransition = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto', transition: { duration: 0.24, ease: easing } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.18, ease: easing } },
}

export const tabTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: easing } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15, ease: easing } },
}
