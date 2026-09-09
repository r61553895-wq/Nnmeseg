import React from 'react';
import { X, Download, FileText } from 'lucide-react';
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
          className="relative max-w-lg w-full flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between pb-3 text-zinc-300">
            <span className="text-sm font-medium tracking-wide truncate max-w-md">{name || 'Document'}</span>
            <div className="flex items-center gap-2">
              <a
                href={url}
                download={name || 'attachment'}
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

          {/* Document Card */}
          <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl bg-[#141722] p-8 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 mb-4">
              <FileText size={48} />
            </div>
            <div className="text-sm font-medium text-zinc-100 mb-1">{name || 'Attachment'}</div>
            <p className="text-xs text-zinc-500 mb-5">Vesper Secure Document</p>
            <a
              href={url}
              download={name || 'file'}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <Download size={14} />
              Download File
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
