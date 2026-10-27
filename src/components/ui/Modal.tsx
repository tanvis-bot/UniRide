import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md'
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-[1200] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px]"
          onClick={onClose} />
        
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className={`relative w-full ${widths[size]} rounded-t-2xl bg-white p-5 shadow-lift sm:rounded-2xl`}>
          
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink-900">{title}</h2>
                {description &&
              <p className="mt-1 text-sm text-slate-500">{description}</p>
              }
              </div>
              <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-slate-400 transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink-800">
              
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            {children && <div className="mt-4">{children}</div>}
            {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
          </motion.div>
        </div>
      }
    </AnimatePresence>,
    document.body
  );
}