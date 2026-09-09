import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MessageSquare, 
  Users, 
  UserPlus, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  User as UserIcon, 
  Settings, 
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Conversation, User, AppSettings } from '../../types';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  users: User[];
  settings: AppSettings;
  onSelectConversation: (id: string) => void;
  onOpenNewChat: () => void;
  onOpenCreateGroup: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onResetData: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  conversations,
  users,
  settings,
  onSelectConversation,
  onOpenNewChat,
  onOpenCreateGroup,
  onOpenProfile,
  onOpenSettings,
  onToggleTheme,
  onToggleSound,
  onResetData,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build searchable items
  interface CommandItem {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    category: 'Conversations' | 'Actions' | 'People';
    action: () => void;
  }

  const items: CommandItem[] = [];

  // Chats
  conversations.forEach((c) => {
    const title = c.type === 'group' ? c.name || 'Group Chat' : c.participants[0]?.name || 'Chat';
    items.push({
      id: `conv_${c.id}`,
      title,
      subtitle: c.type === 'group' ? `${c.participantIds.length} members` : `@${c.participants[0]?.username || 'direct'}`,
      icon: <MessageSquare size={16} className="text-blue-400" />,
      category: 'Conversations',
      action: () => {
        onSelectConversation(c.id);
        onClose();
      },
    });
  });

  // Action items
  items.push(
    {
      id: 'act_new_chat',
      title: 'Start direct message',
      subtitle: 'Find someone by name or handle',
      icon: <UserPlus size={16} className="text-emerald-400" />,
      category: 'Actions',
      action: () => {
        onClose();
        onOpenNewChat();
      },
    },
    {
      id: 'act_create_group',
      title: 'Create group channel',
      subtitle: 'Build a multi-person guild room',
      icon: <Users size={16} className="text-purple-400" />,
      category: 'Actions',
      action: () => {
        onClose();
        onOpenCreateGroup();
      },
    },
    {
      id: 'act_theme',
      title: `Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} theme`,
      subtitle: 'Refined dual palette',
      icon: settings.theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-400" />,
      category: 'Actions',
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'act_sound',
      title: settings.soundEnabled ? 'Mute synthesized sound effects' : 'Enable synthesized audio feedback',
      subtitle: 'Web Audio micro-haptics',
      icon: settings.soundEnabled ? <VolumeX size={16} className="text-zinc-400" /> : <Volume2 size={16} className="text-blue-400" />,
      category: 'Actions',
      action: () => {
        onToggleSound();
        onClose();
      },
    },
    {
      id: 'act_profile',
      title: 'Edit your profile',
      subtitle: 'Avatar, bio, and status line',
      icon: <UserIcon size={16} className="text-cyan-400" />,
      category: 'Actions',
      action: () => {
        onClose();
        onOpenProfile();
      },
    },
    {
      id: 'act_settings',
      title: 'Preferences & system settings',
      subtitle: 'Delivery receipts, shortcuts, presence',
      icon: <Settings size={16} className="text-zinc-400" />,
      category: 'Actions',
      action: () => {
        onClose();
        onOpenSettings();
      },
    },
    {
      id: 'act_reset',
      title: 'Reset to demo seed data',
      subtitle: 'Restore initial chats and seed messages',
      icon: <RotateCcw size={16} className="text-rose-400" />,
      category: 'Actions',
      action: () => {
        onResetData();
        onClose();
      },
    }
  );

  const filteredItems = items.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return item.title.toLowerCase().includes(q) || (item.subtitle && item.subtitle.toLowerCase().includes(q));
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="command-menu-overlay"
        className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/75 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-xl rounded-2xl bg-[#12141c] border border-zinc-800/90 shadow-2xl overflow-hidden flex flex-col text-zinc-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/80 bg-[#151822]">
            <Search size={18} className="text-zinc-400 shrink-0" />
            <input
              ref={inputRef}
              id="command-menu-input"
              type="text"
              placeholder="Type a command, contact, or jump to conversation..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
            <kbd className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
              ESC
            </kbd>
          </div>

          {/* Results list */}
          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-800/30">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No commands or conversations matching "{query}"
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    id={`cmd-item-${item.id}`}
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-zinc-800/80 text-white' : 'text-zinc-300 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-xs text-zinc-400 truncate">{item.subtitle}</div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <ArrowRight size={14} className="text-blue-400 shrink-0 mr-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#0e1017] border-t border-zinc-800/60 text-[11px] text-zinc-500 font-mono">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
            </div>
            <span>Vesper Command Engine</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
