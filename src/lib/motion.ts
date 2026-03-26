import type { Variants } from 'framer-motion';

const prefersReducedMotion = () => 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const stageTransition: Variants = {
  hidden: { opacity: 0, y: prefersReducedMotion() ? 0 : 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: prefersReducedMotion() ? 0 : 0.3, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    y: prefersReducedMotion() ? 0 : -20,
    transition: { duration: prefersReducedMotion() ? 0 : 0.2, ease: 'easeIn' }
  }
};

export const overlayOpen: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: prefersReducedMotion() ? 0 : 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: prefersReducedMotion() ? 0 : 0.15 }
  }
};

export const accordionOpen: Variants = {
  closed: { 
    height: 0, 
    opacity: 0,
    transition: { duration: prefersReducedMotion() ? 0 : 0.2 }
  },
  open: { 
    height: 'auto', 
    opacity: 1,
    transition: { duration: prefersReducedMotion() ? 0 : 0.3 }
  }
};

// Pipeline stage card enter/exit
export const pipelineStageVariants: Variants = {
  hidden: { opacity: 0, x: prefersReducedMotion() ? 0 : 24 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: prefersReducedMotion() ? 0 : 0.3, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    x: prefersReducedMotion() ? 0 : -24,
    transition: { duration: prefersReducedMotion() ? 0 : 0.2, ease: 'easeIn' }
  }
};

// Job card enter/exit when cards move between stages
export const jobCardVariants: Variants = {
  hidden: { opacity: 0, scale: prefersReducedMotion() ? 1 : 0.92, y: prefersReducedMotion() ? 0 : 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: prefersReducedMotion() ? 0 : 0.3, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    scale: prefersReducedMotion() ? 1 : 0.92,
    y: prefersReducedMotion() ? 0 : -8,
    transition: { duration: prefersReducedMotion() ? 0 : 0.2, ease: 'easeIn' }
  }
};

// Stagger children for a row of stages
export const stageRowVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: prefersReducedMotion() ? 0 : 0.06,
    }
  }
};
