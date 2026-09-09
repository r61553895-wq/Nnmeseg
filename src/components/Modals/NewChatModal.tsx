import React, { useState } from 'react';
import { X, Search, UserCheck, UserPlus, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../../types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSelectUser: (userId: string) => void;
  onToggleContact: (userId: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  users,
  onSelectUser,
  onToggleContact,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || (u.bio && u.bio.toLowerCase().includes(q));
  });

  return (
    <AnimatePresence>
      <div 
        id="new-chat-modal-overlay"
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
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Direct Message</h3>
              <p className="text-xs text-zinc-400">Search users or start a conversation</p>
            </div>
            <button
              id="close-new-chat-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-zinc-800/40">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="search-users-input"
                type="text"
                placeholder="Search by name, handle or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full bg-[#171b26] border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 transition-colors"
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-800/20">
            {filteredUsers.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500">
                No users found matching "{search}"
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  id={`user-row-${user.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors group"
                >
                  <div 
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    onClick={() => {
                      onSelectUser(user.id);
                      onClose();
                    }}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                      />
                      {user.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#13161f]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-100 flex items-center gap-1.5">
                        <span className="truncate">{user.name}</span>
                        <span className="text-xs text-zinc-500 font-mono">@{user.username}</span>
                      </div>
                      {user.bio && (
                        <div className="text-xs text-zinc-400 truncate">{user.bio}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      id={`toggle-contact-btn-${user.id}`}
                      onClick={() => onToggleContact(user.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        user.isContact
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                      title={user.isContact ? 'In Contacts' : 'Add to Contacts'}
                    >
                      {user.isContact ? <UserCheck size={16} /> : <UserPlus size={16} />}
                    </button>
                    <button
                      id={`start-chat-btn-${user.id}`}
                      onClick={() => {
                        onSelectUser(user.id);
                        onClose();
                      }}
                      className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                      title="Open Chat"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
