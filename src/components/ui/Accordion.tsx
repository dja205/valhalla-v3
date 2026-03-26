import { motion, AnimatePresence } from 'framer-motion';
import { accordionOpen } from '@/lib/motion';
import { useState, useCallback } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  subtitle?: string;
  badge?: React.ReactNode;
}

export function Accordion({ title, children, defaultOpen = false, subtitle, badge }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
  }, []);

  return (
    <div className="border border-bg-raised rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        className="w-full px-4 py-3 bg-bg-surface hover:bg-bg-raised transition-colors flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-inset"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-medium text-text-primary truncate">{title}</span>
          {subtitle && (
            <span className="text-sm text-text-muted truncate hidden sm:inline">{subtitle}</span>
          )}
          {badge}
        </div>
        <span 
          className={`text-text-muted transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            variants={accordionOpen}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden"
          >
            <div className="p-4 bg-bg-base border-t border-bg-raised">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
