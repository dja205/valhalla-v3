import { motion, AnimatePresence } from 'framer-motion';
import { overlayOpen } from '@/lib/motion';
import { useEffect } from 'react';

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Overlay({ isOpen, onClose, title, children }: OverlayProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={overlayOpen}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/80 z-40"
            onClick={onClose}
          />
          <motion.div
            variants={overlayOpen}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-4 md:inset-8 bg-bg-surface rounded-lg z-50 overflow-auto"
          >
            <div className="sticky top-0 bg-bg-surface border-b border-bg-raised p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
