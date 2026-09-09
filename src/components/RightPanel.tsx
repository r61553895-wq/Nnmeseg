import React, { useState } from 'react';
import { 
  X, 
  User, 
  Users, 
  Image as ImageIcon, 
  FileText, 
  Pin, 
  Bell, 
  BellOff, 
  Phone, 
  Share2, 
  ChevronRight,
  Download,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { Conversation, Message, User as UserType, RightPanelMode } from '../types';

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  currentUser: UserType;
  messages: Message[];
  onOpenImage: (url: string, name?: string) => void;
  onScrollToMessage: (messageId: string) => void;
  onUnpinMessage: (messageId: string) => void;
  onSelectUserChat: (userId: string) => void;
  onToggleMute: (convId: string) => void;
  onStartCall: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUser,
  messages,
  onOpenImage,
  onScrollToMessage,
  onUnpinMessage,
  onSelectUserChat,
  onToggleMute,
  onStartCall,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'files' | 'pinned' | 'members'>('info');

  if (!isOpen || !conversation) return null;

  const otherUser = conversation.type === 'direct'
    ? conversation.participants.find((p) => p.id !== currentUser.id)
    : null;

  const displayName = conversation.type === 'group' ? conversation.name : otherUser?.name || 'Contact';
  const displayAvatar = conversation.type === 'group' ? conversation.avatar : otherUser?.avatar;
  const displayHandle = conversation.type === 'group' ? `${conversation.participantIds.length} members` : `@${otherUser?.username || 'user'}`;

  // Extract shared media and files from messages
  const mediaItems: { id: string; url: string; name: string }[] = [];
  const fileItems: { id: string; url: string; name: string; size?: string }[] = [];
  const pinnedMessages = messages.filter((m) => m.isPinned || m.id === conversation.pinnedMessageId);

  messages.forEach((m) => {
    m.attachments?.forEach((att) => {
      if (att.type === 'image') {
        mediaItems.push({ id: att.id, url: att.url, name: att.name });
      } else if (att.type === 'file') {
        fileItems.push({ id: att.id, url: att.url, name: att.name, size: att.size });
      }
    });
  });

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 340, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="h-full border-l border-zinc-800/80 bg-[#0f1118] flex flex-col shrink-0 overflow-hidden select-none z-20"
      id="right-panel-drawer"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/70 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {conversation.type === 'group' ? 'Group Intel' : 'Profile Details'}
        </span>
        <button
          id="close-right-panel-btn"
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Close details"
        >
          <X size={17} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-3 border-b border-zinc-800/60 bg-[#12151e] shrink-0 overflow-x-auto">
        {[
          { key: 'info', label: 'Overview' },
          { key: 'media', label: `Media (${mediaItems.length})` },
          { key: 'files', label: `Files (${fileItems.length})` },
          { key: 'pinned', label: `Pinned (${pinnedMessages.length})` },
          ...(conversation.type === 'group' ? [{ key: 'members', label: 'Members' }] : []),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'info' && (
          <div className="flex flex-col items-center text-center">
            {/* Avatar & status */}
            <div className="relative mb-3">
              <UserAvatar
                name={displayName || 'User'}
                size="xl"
                isGroup={conversation.type === 'group'}
                online={otherUser?.online}
                showStatus={conversation.type === 'direct'}
              />
            </div>

            <h3 className="text-base font-semibold text-zinc-100">{displayName}</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{displayHandle}</p>

            {conversation.type === 'direct' && otherUser?.statusMessage && (
              <div className="mt-2.5 px-3 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/50 text-[11px] text-zinc-300">
                {otherUser.statusMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 my-5 w-full justify-center">
              <button
                id="panel-call-btn"
                onClick={onStartCall}
                className="flex-1 max-w-[120px] py-2 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-zinc-700/50 transition-colors"
              >
                <Phone size={14} className="text-blue-400" /> Call
              </button>

              <button
                id="panel-mute-btn"
                onClick={() => onToggleMute(conversation.id)}
                className={`flex-1 max-w-[120px] py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-colors ${
                  conversation.isMuted
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-zinc-800/80 border-zinc-700/50 hover:bg-zinc-700 text-zinc-200'
                }`}
              >
                {conversation.isMuted ? <BellOff size={14} /> : <Bell size={14} />}
                {conversation.isMuted ? 'Muted' : 'Mute'}
              </button>
            </div>

            {/* Details list */}
            <div className="w-full text-left space-y-3 pt-3 border-t border-zinc-800/60 text-xs">
              {conversation.description && (
                <div>
                  <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold block mb-1">
                    About
                  </span>
                  <p className="text-zinc-300 leading-relaxed">{conversation.description}</p>
                </div>
              )}

              {conversation.type === 'direct' && otherUser?.bio && (
                <div>
                  <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold block mb-1">
                    Bio
                  </span>
                  <p className="text-zinc-300 leading-relaxed">{otherUser.bio}</p>
                </div>
              )}

              {conversation.type === 'direct' && otherUser?.phone && (
                <div>
                  <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold block mb-1">
                    Phone (Verified)
                  </span>
                  <p className="text-zinc-300 font-mono">{otherUser.phone}</p>
                </div>
              )}

              <div>
                <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold block mb-1">
                  Encryption
                </span>
                <p className="text-zinc-400">Ratchet protocol with zero-trust node hashing</p>
              </div>
            </div>
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div>
            {mediaItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                <ImageIcon size={28} className="mx-auto mb-2 opacity-30" />
                No shared photos in this conversation
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {mediaItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#141722] border border-zinc-800 relative flex flex-col items-center justify-center text-center gap-2"
                  >
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                      <FileText size={20} />
                    </div>
                    <span className="text-[11px] text-zinc-300 font-medium truncate max-w-full px-1">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-2">
            {fileItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                <FileText size={28} className="mx-auto mb-2 opacity-30" />
                No attached documents or specifications
              </div>
            ) : (
              fileItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#141722] border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate">{item.name}</div>
                      {item.size && <div className="text-[10px] text-zinc-500">{item.size}</div>}
                    </div>
                  </div>
                  <a
                    href={item.url}
                    download={item.name}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    <Download size={14} />
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pinned Tab */}
        {activeTab === 'pinned' && (
          <div className="space-y-2">
            {pinnedMessages.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                <Pin size={28} className="mx-auto mb-2 opacity-30" />
                No pinned messages in this chat
              </div>
            ) : (
              pinnedMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => onScrollToMessage(msg.id)}
                  className="p-3 rounded-xl bg-[#141722] border border-zinc-800/80 hover:border-blue-500/40 cursor-pointer transition-colors group relative"
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span className="font-semibold text-blue-400 flex items-center gap-1">
                      <Pin size={11} /> Pinned
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnpinMessage(msg.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-1 transition-opacity"
                      title="Unpin message"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 line-clamp-3 leading-relaxed">{msg.text}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && conversation.type === 'group' && (
          <div className="space-y-2">
            {conversation.participants.map((participant) => (
              <div
                key={participant.id}
                onClick={() => onSelectUserChat(participant.id)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <UserAvatar
                      name={participant.name}
                      size="sm"
                      online={participant.online}
                      showStatus={true}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-200 truncate flex items-center gap-1.5">
                      {participant.name}
                      {participant.id === conversation.createdBy && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                          Owner
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">@{participant.username}</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-600 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.aside>
  );
};
