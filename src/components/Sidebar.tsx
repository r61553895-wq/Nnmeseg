import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Settings as SettingsIcon, 
  Command, 
  Pin, 
  BellOff, 
  Check, 
  CheckCheck, 
  Users, 
  Image as ImageIcon, 
  FileText, 
  X,
  Sparkles,
  MessageSquarePlus
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { Conversation, User, AppSettings } from '../types';
import { translations } from '../utils/i18n';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  currentUser: User;
  settings: AppSettings;
  onSelectConversation: (id: string) => void;
  onOpenNewChat: () => void;
  onOpenCreateGroup: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenCommandMenu: () => void;
  onTogglePin: (id: string) => void;
  onToggleMute: (id: string) => void;
  onMarkRead: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  currentUser,
  settings,
  onSelectConversation,
  onOpenNewChat,
  onOpenCreateGroup,
  onOpenProfile,
  onOpenSettings,
  onOpenCommandMenu,
  onTogglePin,
  onToggleMute,
  onMarkRead,
}) => {
  const t = translations[settings.language || 'ru'];
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'direct' | 'groups'>('all');

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (diffDays === 1) {
        return 'Yesterday';
      }
      if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const filteredConversations = conversations.filter((c) => {
    // Filter by type or unread
    if (activeFilter === 'unread' && c.unreadCount === 0) return false;
    if (activeFilter === 'direct' && c.type !== 'direct') return false;
    if (activeFilter === 'groups' && c.type !== 'group') return false;

    // Filter by search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();

    if (c.type === 'group') {
      return (c.name || '').toLowerCase().includes(q) || (c.lastMessage?.text || '').toLowerCase().includes(q);
    }

    const otherUser = c.participants.find((p) => p.id !== currentUser.id);
    return (
      (otherUser?.name || '').toLowerCase().includes(q) ||
      (otherUser?.username || '').toLowerCase().includes(q) ||
      (c.lastMessage?.text || '').toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div className="w-full md:w-80 lg:w-88 h-full bg-[#101218] border-r border-zinc-800/80 flex flex-col shrink-0 select-none">
      {/* Top Header */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-zinc-800/60 shrink-0">
        {/* Brand identity & User profile trigger */}
        <div 
          id="sidebar-profile-trigger"
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 cursor-pointer group py-1 px-1.5 -ml-1.5 rounded-xl hover:bg-zinc-800/60 transition-colors"
          title="View & Edit Profile"
        >
          <div className="relative">
            <UserAvatar
              name={currentUser.name}
              size="sm"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#101218] ${
                settings.presenceStatus === 'online'
                  ? 'bg-emerald-500'
                  : settings.presenceStatus === 'away'
                  ? 'bg-amber-500'
                  : settings.presenceStatus === 'dnd'
                  ? 'bg-rose-500'
                  : 'bg-zinc-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-zinc-100 tracking-tight">Vesper</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 font-semibold tracking-wider">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate max-w-[110px]">
              {currentUser.name}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-zinc-400">
          <button
            id="open-command-menu-btn"
            onClick={onOpenCommandMenu}
            className="p-2 rounded-lg hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Command Menu (Cmd+K)"
          >
            <Command size={16} />
          </button>
          <button
            id="open-new-chat-btn"
            onClick={onOpenNewChat}
            className="p-2 rounded-lg hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Direct Message"
          >
            <MessageSquarePlus size={17} />
          </button>
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-lg hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Settings & Personas"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3.5 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            id="sidebar-search-input"
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161822] border border-zinc-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3.5 pb-2 flex items-center gap-1.5 border-b border-zinc-800/40 shrink-0 overflow-x-auto text-[11px] font-medium text-zinc-400">
        {[
          { key: 'all', label: t.allChats },
          { key: 'unread', label: totalUnread > 0 ? `${t.unread} (${totalUnread})` : t.unread },
          { key: 'direct', label: t.directChats },
          { key: 'groups', label: t.groups },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as typeof activeFilter)}
            className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === tab.key
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'hover:text-zinc-300 hover:bg-zinc-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {filteredConversations.length === 0 ? (
          <div className="py-14 text-center px-4">
            <p className="text-xs text-zinc-400 font-medium">{t.noChatsFound}</p>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
              {t.newChatPrompt}
            </p>
            <button
              onClick={onOpenNewChat}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 text-xs font-medium transition-colors"
            >
              <Plus size={14} /> {t.startChat}
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const otherUser = conv.type === 'direct'
              ? conv.participants.find((p) => p.id !== currentUser.id)
              : null;

            const title = conv.type === 'group' ? conv.name : otherUser?.name || 'Contact';
            const avatar = conv.type === 'group' ? conv.avatar : otherUser?.avatar;
            const isOnline = conv.type === 'direct' ? otherUser?.online : false;

            const isOwnLastMessage = conv.lastMessage?.senderId === currentUser.id;

            return (
              <div
                key={conv.id}
                id={`chat-item-${conv.id}`}
                onClick={() => {
                  onSelectConversation(conv.id);
                  if (conv.unreadCount > 0) {
                    onMarkRead(conv.id);
                  }
                }}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#1a1e2a] text-white shadow-sm'
                    : 'text-zinc-300 hover:bg-[#151722]'
                }`}
              >
                {/* Active left indicator accent */}
                {isActive && (
                  <motion.div
                    layoutId="activeChatIndicator"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full"
                  />
                )}

                {/* Avatar with online indicator */}
                <div className="relative shrink-0">
                  <UserAvatar
                    name={title || 'Chat'}
                    size="md"
                    isGroup={conv.type === 'group'}
                    online={isOnline}
                    showStatus={conv.type === 'direct'}
                  />
                  {conv.type === 'group' && (
                    <span className="absolute bottom-0 right-0 p-0.5 rounded-full bg-zinc-800 text-zinc-300 ring-2 ring-[#101218]">
                      <Users size={10} />
                    </span>
                  )}
                </div>

                {/* Info & Last Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-sm font-semibold truncate text-zinc-100">{title}</span>
                    <span className="text-[11px] text-zinc-400 font-mono shrink-0">
                      {formatTimestamp(conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs text-zinc-400 truncate leading-snug">
                      {isOwnLastMessage && (
                        <span className="text-zinc-500 shrink-0">
                          {conv.lastMessage?.status === 'read' ? (
                            <CheckCheck size={13} className="text-blue-400 inline" />
                          ) : conv.lastMessage?.status === 'delivered' ? (
                            <CheckCheck size={13} className="text-zinc-400 inline" />
                          ) : (
                            <Check size={13} className="text-zinc-400 inline" />
                          )}
                        </span>
                      )}

                      {conv.lastMessage?.attachments && conv.lastMessage.attachments.length > 0 && (
                        <span className="flex items-center gap-0.5 text-zinc-300 font-medium shrink-0">
                          {conv.lastMessage.attachments[0].type === 'image' ? (
                            <ImageIcon size={12} />
                          ) : (
                            <FileText size={12} />
                          )}
                          <span className="text-[11px]">Attachment</span>
                        </span>
                      )}

                      <span className="truncate">
                        {conv.lastMessage?.text || 'No messages yet'}
                      </span>
                    </div>

                    {/* Indicators: unread, pinned, muted */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {conv.isMuted && <BellOff size={12} className="text-zinc-500" />}
                      {conv.isPinned && <Pin size={12} className="text-zinc-400" />}
                      {conv.unreadCount > 0 && (
                        <span className="min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom helper info */}
      <div className="p-3 border-t border-zinc-800/60 bg-[#0d0f15] flex items-center justify-between text-[11px] text-zinc-500">
        <button
          onClick={onOpenCreateGroup}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Users size={13} />
          <span>New Channel</span>
        </button>
        <span className="font-mono text-[10px]">E2E Encrypted</span>
      </div>
    </div>
  );
};
