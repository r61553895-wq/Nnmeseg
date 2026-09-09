import React, { useState } from 'react';
import { 
  X, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Send, 
  ShieldCheck, 
  Users, 
  RotateCcw,
  Check,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, User } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  currentUser: User;
  users: User[];
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onSwitchAccount: (usernameOrName: string) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentUser,
  users,
  onUpdateSettings,
  onSwitchAccount,
  onResetData,
}) => {
  const [customLoginName, setCustomLoginName] = useState('');
  const [resetConfirmed, setResetConfirmed] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="settings-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg rounded-2xl bg-[#13161f] border border-zinc-800/90 shadow-2xl overflow-hidden flex flex-col text-zinc-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/70">
            <h3 className="text-base font-semibold text-zinc-100">Vesper Settings</h3>
            <button
              id="close-settings-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5 max-h-[80vh] overflow-y-auto divide-y divide-zinc-800/40">
            {/* Language Selection */}
            <div className="pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-3">
                {settings.language === 'ru' ? 'Язык приложения' : 'Interface Language'}
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="lang-ru-btn"
                  onClick={() => onUpdateSettings({ language: 'ru' })}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    settings.language === 'ru'
                      ? 'bg-zinc-800 border-blue-500 text-white'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🇷🇺</span>
                    <span className="text-xs font-medium">Русский</span>
                  </div>
                  {settings.language === 'ru' && <Check size={14} className="text-blue-400" />}
                </button>
                <button
                  type="button"
                  id="lang-en-btn"
                  onClick={() => onUpdateSettings({ language: 'en' })}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    settings.language === 'en'
                      ? 'bg-zinc-800 border-blue-500 text-white'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🇬🇧</span>
                    <span className="text-xs font-medium">English</span>
                  </div>
                  {settings.language === 'en' && <Check size={14} className="text-blue-400" />}
                </button>
              </div>
            </div>

            {/* Appearance */}
            <div className="pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-3">
                Appearance & Theme
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="theme-dark-btn"
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                    settings.theme === 'dark'
                      ? 'bg-zinc-800/90 border-blue-500/80 text-white shadow-sm'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Moon size={18} className="text-blue-400" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Obsidian Dark</div>
                    <div className="text-[11px] text-zinc-400">Deep graphite surface</div>
                  </div>
                </button>

                <button
                  type="button"
                  id="theme-light-btn"
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                    settings.theme === 'light'
                      ? 'bg-zinc-800/90 border-blue-500/80 text-white shadow-sm'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sun size={18} className="text-amber-400" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Porcelain Slate</div>
                    <div className="text-[11px] text-zinc-400">Crisp high contrast</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Sound & Audio micro-interactions */}
            <div className="pt-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                  <Volume2 size={16} className="text-blue-400" />
                  Synthesized Sound Feedback
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Discrete Web Audio haptics on send, receive, and reaction
                </div>
              </div>
              <button
                type="button"
                id="toggle-sound-btn"
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.soundEnabled ? 'bg-blue-600' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.soundEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Presence status */}
            <div className="pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                Status Presence
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'online', label: 'Online', color: 'bg-emerald-500' },
                  { key: 'away', label: 'Away', color: 'bg-amber-500' },
                  { key: 'dnd', label: 'Do Not Disturb', color: 'bg-rose-500' },
                  { key: 'invisible', label: 'Invisible', color: 'bg-zinc-500' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onUpdateSettings({ presenceStatus: item.key as AppSettings['presenceStatus'] })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      settings.presenceStatus === item.key
                        ? 'bg-zinc-800 border-blue-500 text-white'
                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Enter key behavior */}
            <div className="pt-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                  <Send size={16} className="text-cyan-400" />
                  Send on Enter
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Press Enter to dispatch, Shift+Enter for newline
                </div>
              </div>
              <button
                type="button"
                id="toggle-enter-send-btn"
                onClick={() => onUpdateSettings({ sendOnEnter: !settings.sendOnEnter })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.sendOnEnter ? 'bg-blue-600' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.sendOnEnter ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Persona / Account Switcher for testing */}
            <div className="pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                Simulated Persona / Account Switcher
              </span>
              <p className="text-xs text-zinc-400 mb-3">
                Switch who you are currently typing as to test real-time conversations from both sides:
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { name: 'Roman Vanyn', username: 'roman_v' },
                  { name: 'Elena Rostova', username: 'elena_v' },
                  { name: 'Marcus Thorne', username: 'm_thorne' },
                  { name: 'Sofia Chen', username: 'sofia_chen' },
                ].map((persona) => {
                  const isCurrent = currentUser.username === persona.username;
                  return (
                    <button
                      key={persona.username}
                      type="button"
                      onClick={() => onSwitchAccount(persona.username)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {persona.name} {isCurrent && <Check size={12} />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or enter new name / handle to create session..."
                  value={customLoginName}
                  onChange={(e) => setCustomLoginName(e.target.value)}
                  className="flex-1 bg-[#171b26] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customLoginName.trim()) {
                      onSwitchAccount(customLoginName.trim());
                      setCustomLoginName('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <LogIn size={13} /> Switch
                </button>
              </div>
            </div>

            {/* Reset Data */}
            <div className="pt-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-rose-400 flex items-center gap-1.5">
                  <RotateCcw size={15} />
                  Reset Application Seed
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Clears local storage and restores all original chats and seed assets
                </div>
              </div>
              <button
                type="button"
                id="reset-demo-data-btn"
                onClick={() => {
                  onResetData();
                  setResetConfirmed(true);
                  setTimeout(() => setResetConfirmed(false), 2000);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors"
              >
                {resetConfirmed ? 'Reset Complete!' : 'Reset Data'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
