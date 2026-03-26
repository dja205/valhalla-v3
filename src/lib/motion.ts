import type { Variants } from 'framer-motion';

const prefersReducedMotion = () => 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const stageTransition: Variants = {
  hidden: { opacity: 0, y: prefersReducedMotion() ? 0 : 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: prefersReducedMotion() ? 0 : 0.3 }
  },
  exit: { 
    opacity: 0, 
    y: prefersReducedMotion() ? 0 : -20,
    transition: { duration: prefersReducedMotion() ? 0 : 0.2 }
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
