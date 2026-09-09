import React, { useState } from 'react';
import { X, Users, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from '../UserAvatar';
import { User } from '../../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onCreateGroup: (name: string, memberIds: string[], description?: string, avatar?: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  users,
  onCreateGroup,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Please select at least 1 participant');
      return;
    }

    onCreateGroup(name.trim(), selectedUserIds, description.trim(), '');
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        id="create-group-modal-overlay"
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
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Users size={18} />
              </div>
              <h3 className="text-base font-semibold text-zinc-100">Create Group</h3>
            </div>
            <button
              id="close-create-group-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
            {/* Group Name & Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Group Name
              </label>
              <input
                id="group-name-input"
                type="text"
                placeholder="e.g. Design Systems Guild"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="w-full bg-[#171b26] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Description (Optional)
              </label>
              <input
                id="group-desc-input"
                type="text"
                placeholder="Topic, mission, or guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#171b26] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
              />
            </div>

            {/* Group Icon Preview */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Group Icon
              </label>
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={name.trim() || 'Group'}
                  size="lg"
                  isGroup={true}
                />
                <span className="text-xs text-zinc-400">
                  {name.trim() ? `Auto-generated visual for "${name.trim()}"` : 'Type a group name to generate visual identifier'}
                </span>
              </div>
            </div>

            {/* Member Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Select Members ({selectedUserIds.length})
                </label>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-800 bg-[#161922] p-1.5 divide-y divide-zinc-800/30">
                {users.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      id={`group-member-toggle-${user.id}`}
                      onClick={() => toggleUser(user.id)}
                      className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          name={user.name}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-zinc-200 truncate">{user.name}</div>
                          <div className="text-xs text-zinc-400 truncate">@{user.username}</div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-zinc-700 bg-zinc-800'
                        }`}
                      >
                        {isSelected && <Check size={13} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && <div className="text-xs text-rose-400 font-medium">{error}</div>}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 mt-2 pt-3 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-create-group-btn"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-md shadow-blue-900/30 transition-all active:scale-95"
              >
                Create Group
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
