import { motion, AnimatePresence } from 'framer-motion';
import { overlayOpen } from '@/lib/motion';
import { useEffect, useRef, useCallback } from 'react';

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Overlay({ isOpen, onClose, title, children }: OverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Focus trap
  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (!overlayRef.current) return;
    
    const focusableElements = overlayRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') handleTabKey(e);
    };
    
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      // Focus the overlay after animation
      setTimeout(() => {
        const closeButton = overlayRef.current?.querySelector('button');
        closeButton?.focus();
      }, 100);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      
      // Restore focus
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, handleTabKey]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayOpen}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/80 z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Modal */}
          <motion.div
            ref={overlayRef}
            variants={overlayOpen}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="overlay-title"
            className="fixed inset-0 md:inset-4 lg:inset-8 bg-bg-surface md:rounded-lg z-50 overflow-auto flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-bg-surface border-b border-bg-raised p-4 flex items-center justify-between z-10">
              <h2 id="overlay-title" className="text-xl font-bold text-text-primary truncate pr-4">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary transition-colors p-2 -mr-2 rounded-lg hover:bg-bg-raised focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4 overflow-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
