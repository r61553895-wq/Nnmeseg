import React, { useState } from 'react';
import { X, Check, User as UserIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from '../UserAvatar';
import { User } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSaveProfile: (updates: Partial<User>) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [statusMessage, setStatusMessage] = useState(currentUser.statusMessage || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name: name.trim(),
      username: username.trim().toLowerCase().replace(/\s+/g, '_'),
      bio: bio.trim(),
      statusMessage: statusMessage.trim(),
      avatar: '',
      phone: phone.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <AnimatePresence>
      <div 
        id="profile-modal-overlay"
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
            <h3 className="text-base font-semibold text-zinc-100">Your Vesper Profile</h3>
            <button
              id="close-profile-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
            {/* Avatar visual identifier */}
            <div className="flex flex-col items-center gap-2">
              <UserAvatar
                name={name || 'User'}
                size="xl"
              />
              <span className="text-xs text-zinc-400">
                Visual profile generated from display name
              </span>
            </div>

            {/* Fields */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Display Name
              </label>
              <input
                id="profile-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#171b26] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Handle / Username
              </label>
              <div className="flex items-center bg-[#171b26] border border-zinc-800 rounded-xl px-3.5 py-2">
                <span className="text-zinc-500 text-sm mr-1">@</span>
                <input
                  id="profile-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-transparent text-sm text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Status Message
              </label>
              <input
                id="profile-status-input"
                type="text"
                placeholder="e.g. In flow state ✦"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                className="w-full bg-[#171b26] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Bio
              </label>
              <textarea
                id="profile-bio-input"
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief craft note or role..."
                className="w-full bg-[#171b26] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/60 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Phone Number (Encrypted)
              </label>
              <input
                id="profile-phone-input"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#171b26] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/60"
              />
            </div>

            {/* Actions */}
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
                id="submit-profile-btn"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-md shadow-blue-900/30 flex items-center gap-1.5 transition-all"
              >
                {savedNotice ? (
                  <>
                    <Check size={16} /> Saved
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
