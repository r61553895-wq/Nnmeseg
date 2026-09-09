import React, { useState } from 'react';
import { X, Search, Forward, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Conversation, Message, User } from '../../types';

interface ForwardModalProps {
  isOpen: boolean;
  message: Message | null;
  conversations: Conversation[];
  currentUser: User;
  onClose: () => void;
  onForward: (targetConversationId: string, message: Message) => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  isOpen,
  message,
  conversations,
  currentUser,
  onClose,
  onForward,
}) => {
  const [search, setSearch] = useState('');
  const [forwardedConvId, setForwardedConvId] = useState<string | null>(null);

  if (!isOpen || !message) return null;

  const filtered = conversations.filter((c) => {
    const title = c.type === 'group' ? c.name || '' : c.participants.find((p) => p.id !== currentUser.id)?.name || '';
    return title.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = (convId: string) => {
    setForwardedConvId(convId);
    onForward(convId, message);
    setTimeout(() => {
      setForwardedConvId(null);
      onClose();
    }, 450);
  };

  return (
    <AnimatePresence>
      <div 
        id="forward-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md rounded-2xl bg-[#13161f] border border-zinc-800/90 shadow-2xl overflow-hidden flex flex-col text-zinc-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/70">
            <div className="flex items-center gap-2">
              <Forward size={18} className="text-blue-400" />
              <h3 className="text-base font-semibold text-zinc-100">Forward Message</h3>
            </div>
            <button
              id="close-forward-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Snippet preview of message being forwarded */}
          <div className="px-5 py-3 bg-[#171a24] border-b border-zinc-800/50 text-xs text-zinc-300 italic truncate">
            "{message.text || (message.attachments ? '[Attachment]' : '')}"
          </div>

          {/* Search */}
          <div className="p-3 border-b border-zinc-800/40">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Choose chat or group..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full bg-[#171b26] border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="max-h-72 overflow-y-auto p-2 divide-y divide-zinc-800/20">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">No chats found</div>
            ) : (
              filtered.map((c) => {
                const otherUser = c.type === 'direct' ? c.participants.find((p) => p.id !== currentUser.id) : null;
                const title = c.type === 'group' ? c.name : otherUser?.name || 'Chat';
                const avatar = c.type === 'group' ? c.avatar : otherUser?.avatar;
                const isSent = forwardedConvId === c.id;

                return (
                  <div
                    key={c.id}
                    id={`forward-target-${c.id}`}
                    onClick={() => handleSelect(c.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={title || ''}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-100 truncate">{title}</div>
                        <div className="text-xs text-zinc-400 truncate">
                          {c.type === 'group' ? 'Group channel' : `@${otherUser?.username || 'user'}`}
                        </div>
                      </div>
                    </div>
                    {isSent ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                        <Check size={14} /> Sent
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500 font-medium">Select</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
