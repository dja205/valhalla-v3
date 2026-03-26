import { motion, AnimatePresence } from 'framer-motion';
import { accordionOpen } from '@/lib/motion';
import { useState } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-bg-raised rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-bg-surface hover:bg-bg-raised transition-colors flex items-center justify-between text-left"
      >
        <span className="font-medium text-text-primary">{title}</span>
        <span className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}>
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
            <div className="p-4 bg-bg-base">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
