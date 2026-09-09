import React from 'react';
import { X, Download, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageViewerModalProps {
  url: string | null;
  name?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ url, name, onClose }) => {
  if (!url) return null;

  return (
    <AnimatePresence>
      <div 
        id="image-viewer-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between pb-3 text-zinc-300">
            <span className="text-sm font-medium tracking-wide truncate max-w-md">{name || 'Image Preview'}</span>
            <div className="flex items-center gap-2">
              <a
                href={url}
                download={name || 'image'}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition-colors"
                title="Download"
              >
                <Download size={18} />
              </a>
              <button
                id="close-image-viewer-btn"
                onClick={onClose}
                className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Image */}
          <div className="overflow-hidden rounded-xl border border-zinc-800 shadow-2xl bg-black">
            <img
              src={url}
              alt={name || 'Enlarged photo'}
              referrerPolicy="no-referrer"
              className="max-h-[80vh] max-w-full object-contain"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
