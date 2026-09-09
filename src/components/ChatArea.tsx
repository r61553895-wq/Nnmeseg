import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Search, 
  Pin, 
  Info, 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  MicOff,
  MoreVertical, 
  Check, 
  CheckCheck, 
  Reply, 
  Forward, 
  Edit3, 
  Trash2, 
  Copy, 
  X, 
  Image as ImageIcon, 
  FileText, 
  Download,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Conversation, Message, User, MessageAttachment, AppSettings } from '../types';
import { VoicePlayer } from './VoicePlayer';
import { UserAvatar } from './UserAvatar';
import { createSyntheticVoiceBlobUrl } from '../utils/audioVoiceHelper';
import { translations } from '../utils/i18n';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUser: User;
  settings: AppSettings;
  typingUsers: string[];
  onBackToSidebar: () => void;
  onSendMessage: (text: string, attachments?: MessageAttachment[], replyTo?: Message['replyTo']) => void;
  onEditMessage: (messageId: string, text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onTogglePinMessage: (messageId: string) => void;
  onForwardMessage: (message: Message) => void;
  onOpenImage: (url: string, name?: string) => void;
  onToggleRightPanel: () => void;
  onStartCall: () => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '✨', '🚀', '👏', '🎯', '💡'];
const PICKER_CATEGORIES: Record<string, string[]> = {
  'Reactions': ['👍', '👎', '❤️', '🔥', '✨', '🚀', '👏', '🙌', '💯', '🎉'],
  'Smileys': ['😀', '😎', '🤩', '🤔', '🧐', '😴', '🫡', '🤝', '⚡', '🌟'],
  'Objects': ['📎', '📁', '💻', '🎧', '📸', '🔒', '🔑', '☕', '🚀', '🎨'],
};

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  currentUser,
  settings,
  typingUsers,
  onBackToSidebar,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onToggleReaction,
  onTogglePinMessage,
  onForwardMessage,
  onOpenImage,
  onToggleRightPanel,
  onStartCall,
}) => {
  const t = translations[settings.language || 'ru'];
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // In-chat search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);

  // Highlight flash target
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUsers.length]);

  // Voice recording timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRecordingVoice) {
      setVoiceSeconds(0);
      timer = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  if (!conversation) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#0b0c10] text-zinc-400 p-8 select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#141620] border border-zinc-800 flex items-center justify-center text-zinc-300 mb-4 shadow-xl">
          <Send size={24} className="opacity-40" />
        </div>
        <h3 className="text-base font-semibold text-zinc-200 tracking-tight">Your conversations will appear here</h3>
        <p className="text-xs text-zinc-500 mt-1.5 max-w-sm text-center leading-relaxed">
          Select a chat from the left sidebar or press <kbd className="font-mono text-zinc-400 bg-zinc-800 px-1 py-0.5 rounded">Cmd+K</kbd> to launch a direct dialogue.
        </p>
      </div>
    );
  }

  const otherUser = conversation.type === 'direct'
    ? conversation.participants.find((p) => p.id !== currentUser.id)
    : null;

  const chatTitle = conversation.type === 'group' ? conversation.name : otherUser?.name || 'Contact';
  const chatAvatar = conversation.type === 'group' ? conversation.avatar : otherUser?.avatar;
  const isOnline = conversation.type === 'direct' ? otherUser?.online : false;

  // Search matches
  const matchedMessageIds = searchQuery.trim()
    ? messages.filter((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase())).map((m) => m.id)
    : [];

  const handleSend = () => {
    if (!inputText.trim() && !editingMessage) return;

    if (editingMessage) {
      onEditMessage(editingMessage.id, inputText.trim());
      setEditingMessage(null);
      setInputText('');
      return;
    }

    onSendMessage(
      inputText.trim(),
      undefined,
      replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderId === currentUser.id ? 'You' : (otherUser?.name || 'Participant'),
            text: replyingTo.text,
          }
        : undefined
    );

    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachImagePreset = (presetType: 'architectural' | 'code' | 'minimal') => {
    setShowAttachMenu(false);
    let sampleDoc: MessageAttachment = {
      id: `att_${Date.now()}`,
      type: 'file',
      url: '#',
      name: 'vesper_schematic.json',
      size: '24 KB',
    };

    if (presetType === 'code') {
      sampleDoc = {
        id: `att_${Date.now()}`,
        type: 'file',
        url: '#',
        name: 'syntax_engine.ts',
        size: '18 KB',
      };
    } else if (presetType === 'minimal') {
      sampleDoc = {
        id: `att_${Date.now()}`,
        type: 'file',
        url: '#',
        name: 'editorial_spec.pdf',
        size: '142 KB',
      };
    }

    onSendMessage('Document specification attached:', [sampleDoc]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const url = URL.createObjectURL(file);

    const attachment: MessageAttachment = {
      id: `att_local_${Date.now()}`,
      type: isImage ? 'image' : 'file',
      url,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      mimeType: file.type,
    };

    onSendMessage(isImage ? 'Attached photo:' : `Shared document: ${file.name}`, [attachment]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowAttachMenu(false);
  };

  const startVoiceRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.start(100);
      setIsRecordingVoice(true);
      setVoiceSeconds(0);
    } catch (err) {
      console.warn('Microphone permission not granted or stream failed:', err);
      // Fallback: start timer and generate playable synthetic voice note
      setIsRecordingVoice(true);
      setVoiceSeconds(0);
    }
  };

  const handleCancelVoice = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsRecordingVoice(false);
    setVoiceSeconds(0);
    audioChunksRef.current = [];
  };

  const handleSendVoiceNote = () => {
    const dur = Math.max(1, voiceSeconds);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        let blobUrl = '';
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          blobUrl = URL.createObjectURL(blob);
        } else {
          blobUrl = createSyntheticVoiceBlobUrl(dur);
        }

        const voiceAtt: MessageAttachment = {
          id: `att_voice_${Date.now()}`,
          type: 'audio',
          url: blobUrl,
          name: `${t.voiceNote} (${dur}s)`,
          duration: dur,
        };

        onSendMessage('', [voiceAtt]);
        setIsRecordingVoice(false);
        setVoiceSeconds(0);
        audioChunksRef.current = [];
      };
      try {
        mediaRecorderRef.current.stop();
      } catch {
        const blobUrl = createSyntheticVoiceBlobUrl(dur);
        const voiceAtt: MessageAttachment = {
          id: `att_voice_${Date.now()}`,
          type: 'audio',
          url: blobUrl,
          name: `${t.voiceNote} (${dur}s)`,
          duration: dur,
        };
        onSendMessage('', [voiceAtt]);
        setIsRecordingVoice(false);
        setVoiceSeconds(0);
      }
    } else {
      const blobUrl = createSyntheticVoiceBlobUrl(dur);
      const voiceAtt: MessageAttachment = {
        id: `att_voice_${Date.now()}`,
        type: 'audio',
        url: blobUrl,
        name: `${t.voiceNote} (${dur}s)`,
        duration: dur,
      };
      onSendMessage('', [voiceAtt]);
      setIsRecordingVoice(false);
      setVoiceSeconds(0);
    }
  };

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`message-bubble-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(msgId);
      setTimeout(() => setHighlightedMessageId(null), 1800);
    }
  };

  const pinnedMessage = messages.find((m) => m.id === conversation.pinnedMessageId || m.isPinned);

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0b0c10] overflow-hidden relative" id="chat-area-container">
      {/* Top Header */}
      <header className="h-16 px-4 flex items-center justify-between border-b border-zinc-800/80 bg-[#101217]/95 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button for mobile view */}
          <button
            id="chat-back-btn"
            onClick={onBackToSidebar}
            className="md:hidden p-2 -ml-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Avatar & presence */}
          <div className="relative shrink-0 cursor-pointer" onClick={onToggleRightPanel}>
            <UserAvatar
              name={chatTitle || 'Chat'}
              size="md"
              isGroup={conversation.type === 'group'}
              online={isOnline}
              showStatus={conversation.type === 'direct'}
            />
          </div>

          <div className="min-w-0 cursor-pointer" onClick={onToggleRightPanel}>
            <h2 className="text-sm font-semibold text-zinc-100 truncate tracking-tight">{chatTitle}</h2>
            <div className="text-xs text-zinc-400 truncate flex items-center gap-1.5">
              {typingUsers.length > 0 ? (
                <span className="text-blue-400 font-medium flex items-center gap-1 animate-pulse">
                  <span>typing</span>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                  </span>
                </span>
              ) : conversation.type === 'group' ? (
                <span>{conversation.participantIds.length} members</span>
              ) : isOnline ? (
                <span className="text-emerald-400">online</span>
              ) : (
                <span>{otherUser?.lastSeen || 'offline'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Icons */}
        <div className="flex items-center gap-1 text-zinc-400">
          <button
            id="chat-search-toggle"
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-2 rounded-lg transition-colors ${
              searchOpen ? 'bg-zinc-800 text-blue-400' : 'hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Search inside conversation"
          >
            <Search size={17} />
          </button>

          <button
            id="chat-call-btn"
            onClick={onStartCall}
            className="p-2 rounded-lg hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Start secure call"
          >
            <Phone size={17} />
          </button>

          <button
            id="chat-info-btn"
            onClick={onToggleRightPanel}
            className="p-2 rounded-lg hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Chat intelligence & media"
          >
            <Info size={17} />
          </button>
        </div>
      </header>

      {/* Pinned Message Strip (if exists) */}
      {pinnedMessage && (
        <div 
          id="pinned-message-bar"
          onClick={() => scrollToMessage(pinnedMessage.id)}
          className="px-4 py-2 bg-[#141824] border-b border-zinc-800/80 flex items-center justify-between cursor-pointer hover:bg-[#181d2c] transition-colors shrink-0 z-10"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1 rounded bg-blue-500/10 text-blue-400 shrink-0">
              <Pin size={13} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">
                Pinned Message
              </span>
              <p className="text-xs text-zinc-300 truncate">{pinnedMessage.text}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePinMessage(pinnedMessage.id);
            }}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors"
            title="Unpin"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* In-Chat Search Bar */}
      {searchOpen && (
        <div className="px-4 py-2 bg-[#121520] border-b border-zinc-800/90 flex items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-2 flex-1">
            <Search size={15} className="text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="Find in chat..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveSearchIndex(0);
              }}
              autoFocus
              className="w-full bg-transparent text-xs text-zinc-100 focus:outline-none placeholder-zinc-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {matchedMessageIds.length > 0 ? (
              <span>
                {activeSearchIndex + 1} of {matchedMessageIds.length}
              </span>
            ) : searchQuery ? (
              <span>No matches</span>
            ) : null}

            {matchedMessageIds.length > 0 && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => {
                    const next = (activeSearchIndex - 1 + matchedMessageIds.length) % matchedMessageIds.length;
                    setActiveSearchIndex(next);
                    scrollToMessage(matchedMessageIds[next]);
                  }}
                  className="p-1 hover:bg-zinc-800 rounded"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => {
                    const next = (activeSearchIndex + 1) % matchedMessageIds.length;
                    setActiveSearchIndex(next);
                    scrollToMessage(matchedMessageIds[next]);
                  }}
                  className="p-1 hover:bg-zinc-800 rounded"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-1 text-zinc-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" id="messages-scroll-view">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
              <Smile size={20} />
            </div>
            <p className="text-sm font-medium text-zinc-300">Channel initialized</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              This channel is end-to-end sealed. Send the first greeting or share project files.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMe = message.senderId === currentUser.id;
            const prevMessage = messages[index - 1];
            const nextMessage = messages[index + 1];

            const isSameSenderAsPrev = prevMessage && prevMessage.senderId === message.senderId;
            const isSameSenderAsNext = nextMessage && nextMessage.senderId === message.senderId;

            // Sender entity
            const senderUser = isMe
              ? currentUser
              : conversation.participants.find((p) => p.id === message.senderId);

            const isHighlighted = highlightedMessageId === message.id;

            return (
              <div
                key={message.id}
                id={`message-bubble-${message.id}`}
                className={`group relative flex flex-col ${isMe ? 'items-end' : 'items-start'} ${
                  isSameSenderAsPrev ? 'mt-1' : 'mt-4'
                }`}
              >
                {/* Consecutive grouping: only show sender name on first message of group */}
                {!isMe && conversation.type === 'group' && !isSameSenderAsPrev && (
                  <span className="text-[11px] font-semibold text-zinc-400 mb-1 ml-11">
                    {senderUser?.name || 'Participant'}
                  </span>
                )}

                <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%]`}>
                  {/* Avatar for incoming: only on last message of group */}
                  {!isMe && (
                    <div className="w-8 shrink-0 mb-0.5">
                      {!isSameSenderAsNext ? (
                        <UserAvatar
                          name={senderUser?.name || 'User'}
                          size="sm"
                        />
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`relative px-4 py-2.5 rounded-2xl text-sm transition-all duration-300 ${
                      isHighlighted ? 'ring-2 ring-blue-400 shadow-lg shadow-blue-500/20' : ''
                    } ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-sm shadow-sm'
                        : 'bg-[#161922] text-zinc-100 border border-zinc-800/80 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {/* Forwarded Tag */}
                    {message.forwardedFrom && (
                      <div className="text-[10px] tracking-wide uppercase font-semibold text-zinc-400 flex items-center gap-1 mb-1 pb-1 border-b border-white/10">
                        <Forward size={11} /> Forwarded from {message.forwardedFrom.senderName}
                      </div>
                    )}

                    {/* Inline Reply Quote */}
                    {message.replyTo && (
                      <div
                        onClick={() => scrollToMessage(message.replyTo!.id)}
                        className={`mb-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer border-l-2 transition-opacity hover:opacity-90 ${
                          isMe
                            ? 'bg-blue-700/70 border-white/70 text-blue-100'
                            : 'bg-zinc-800/80 border-blue-500 text-zinc-300'
                        }`}
                      >
                        <div className="font-semibold text-[11px] truncate">
                          {message.replyTo.senderName}
                        </div>
                        <div className="truncate opacity-80">{message.replyTo.text}</div>
                      </div>
                    )}

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {message.attachments.map((att) => {
                          if (att.type === 'audio') {
                            return (
                              <VoicePlayer
                                key={att.id}
                                url={att.url}
                                duration={att.duration}
                                isMe={isMe}
                              />
                            );
                          }
                          return (
                            <div
                              key={att.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border ${
                                isMe
                                  ? 'bg-blue-700/50 border-blue-500/40 text-white'
                                  : 'bg-[#131620] border-zinc-800 text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileText size={18} className={isMe ? 'text-blue-200' : 'text-blue-400'} />
                                <div className="min-w-0">
                                  <div className="text-xs font-medium truncate">{att.name}</div>
                                  {att.size && (
                                    <div className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-zinc-500'}`}>
                                      {att.size}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <a
                                href={att.url}
                                download={att.name}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isMe ? 'hover:bg-blue-600' : 'hover:bg-zinc-800'
                                }`}
                              >
                                <Download size={14} />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Text content */}
                    {message.text && (
                      <p className="whitespace-pre-wrap break-words leading-relaxed select-text">
                        {message.text}
                      </p>
                    )}

                    {/* Meta Footer: Timestamp & Read Status */}
                    <div
                      className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] font-mono select-none ${
                        isMe ? 'text-blue-200' : 'text-zinc-400'
                      }`}
                    >
                      {message.editedAt && <span>(edited)</span>}
                      <span>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && (
                        <span>
                          {message.status === 'read' ? (
                            <CheckCheck size={13} className="text-blue-200 inline" />
                          ) : message.status === 'delivered' ? (
                            <CheckCheck size={13} className="text-blue-300/80 inline" />
                          ) : message.status === 'sent' ? (
                            <Check size={13} className="text-blue-300/80 inline" />
                          ) : (
                            <span className="text-[9px] animate-pulse">●</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Microinteraction Floating Action Menu (Pill) on hover */}
                  <div
                    className={`absolute -top-3.5 ${
                      isMe ? 'right-2' : 'left-10 md:left-12'
                    } hidden group-hover:flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-[#181b26] border border-zinc-700 shadow-xl z-20 text-zinc-300`}
                  >
                    {/* Common Quick Reactions */}
                    {COMMON_EMOJIS.slice(0, 3).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onToggleReaction(message.id, emoji)}
                        className="text-xs hover:scale-125 transition-transform p-0.5"
                      >
                        {emoji}
                      </button>
                    ))}

                    <span className="w-px h-3 bg-zinc-700 mx-0.5" />

                    <button
                      onClick={() => setReplyingTo(message)}
                      className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
                      title="Reply"
                    >
                      <Reply size={12} />
                    </button>

                    <button
                      onClick={() => onForwardMessage(message)}
                      className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
                      title="Forward"
                    >
                      <Forward size={12} />
                    </button>

                    <button
                      onClick={() => onTogglePinMessage(message.id)}
                      className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
                      title={message.isPinned ? 'Unpin' : 'Pin message'}
                    >
                      <Pin size={12} />
                    </button>

                    <button
                      onClick={() => {
                        if (message.text) navigator.clipboard.writeText(message.text);
                      }}
                      className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
                      title="Copy text"
                    >
                      <Copy size={12} />
                    </button>

                    {isMe && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMessage(message);
                            setInputText(message.text);
                            textareaRef.current?.focus();
                          }}
                          className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
                          title="Edit"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => onDeleteMessage(message.id)}
                          className="p-1 rounded hover:bg-zinc-700 text-rose-400 hover:text-rose-300"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Reactions list below bubble */}
                {message.reactions && message.reactions.length > 0 && (
                  <div
                    className={`flex flex-wrap items-center gap-1 mt-1 ${
                      isMe ? 'mr-1 justify-end' : 'ml-10 justify-start'
                    }`}
                  >
                    {message.reactions.map((r) => {
                      const hasReacted = r.userIds.includes(currentUser.id);
                      return (
                        <button
                          key={r.emoji}
                          onClick={() => onToggleReaction(message.id, r.emoji)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                            hasReacted
                              ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                              : 'bg-[#161922] border border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <span className="text-xs">{r.emoji}</span>
                          <span className="text-[11px] font-mono font-medium">{r.userIds.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator at bottom */}
      {typingUsers.length > 0 && (
        <div className="px-5 py-1.5 text-xs text-zinc-400 flex items-center gap-2 bg-[#0d0f15]/80 shrink-0">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
          </div>
          <span>{typingUsers.join(', ')} is typing...</span>
        </div>
      )}

      {/* Composer Area */}
      <div className="p-3 bg-[#101218] border-t border-zinc-800/80 shrink-0 relative">
        {/* Replying Preview Banner */}
        {replyingTo && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-[#171b26] border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Reply size={14} className="text-blue-400 shrink-0" />
              <div className="text-xs truncate">
                <span className="font-semibold text-blue-400">
                  Replying to {replyingTo.senderId === currentUser.id ? 'yourself' : otherUser?.name || 'User'}:
                </span>{' '}
                <span className="text-zinc-300">{replyingTo.text}</span>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-zinc-400 hover:text-zinc-200 p-1 rounded"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Editing Preview Banner */}
        {editingMessage && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-[#171b26] border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Edit3 size={14} className="text-amber-400 shrink-0" />
              <div className="text-xs truncate text-zinc-300">
                <span className="font-semibold text-amber-400">Editing message:</span> {editingMessage.text}
              </div>
            </div>
            <button
              onClick={() => {
                setEditingMessage(null);
                setInputText('');
              }}
              className="text-zinc-400 hover:text-zinc-200 p-1 rounded"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Voice Note Recording Status */}
        {isRecordingVoice ? (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-mono font-medium">{t.recordingVoice} {voiceSeconds}s</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelVoice}
                className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSendVoiceNote}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Mic size={13} />
                <span>{t.sendVoice}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2 bg-[#161822] border border-zinc-800 rounded-2xl p-1.5 focus-within:border-zinc-600 transition-colors">
            {/* Attachment Button & Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="relative">
              <button
                id="composer-attach-btn"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title={t.attachPhoto}
              >
                <Paperclip size={18} />
              </button>

              {/* Attach Dropdown Menu */}
              {showAttachMenu && (
                <div className="absolute bottom-12 left-0 w-56 p-1.5 rounded-xl bg-[#141722] border border-zinc-800 shadow-2xl z-30 text-xs text-zinc-200 divide-y divide-zinc-800/40">
                  <div className="pb-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-800 text-left transition-colors"
                    >
                      <Paperclip size={15} className="text-blue-400" />
                      <span>{t.attachLocal}</span>
                    </button>
                  </div>
                  <div className="pt-1">
                    <span className="px-2 py-1 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
                      {t.sampleAssets}
                    </span>
                    <button
                      onClick={() => handleAttachImagePreset('architectural')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-left text-zinc-300"
                    >
                      <FileText size={14} className="text-emerald-400" />
                      <span>{t.vesperSchematic}</span>
                    </button>
                    <button
                      onClick={() => handleAttachImagePreset('code')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-left text-zinc-300"
                    >
                      <FileText size={14} className="text-cyan-400" />
                      <span>{t.codeSpec}</span>
                    </button>
                    <button
                      onClick={() => handleAttachImagePreset('minimal')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-left text-zinc-300"
                    >
                      <FileText size={14} className="text-purple-400" />
                      <span>{t.editorialVisual}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              id="message-composer-input"
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.writeMessage}
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 resize-none py-2 px-2 focus:outline-none max-h-32 leading-relaxed"
            />

            {/* Emoji Picker Popover */}
            <div className="relative">
              <button
                id="composer-emoji-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title={t.emojis}
              >
                <Smile size={18} />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-12 right-0 w-64 p-3 rounded-2xl bg-[#141722] border border-zinc-800 shadow-2xl z-30 space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      {t.emojis}
                    </span>
                    <button
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {Object.entries(PICKER_CATEGORIES).map(([cat, emojis]) => (
                    <div key={cat}>
                      <span className="text-[10px] text-zinc-500 font-medium block mb-1">{cat}</span>
                      <div className="grid grid-cols-5 gap-1">
                        {emojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setInputText((prev) => prev + emoji);
                              textareaRef.current?.focus();
                            }}
                            className="p-1.5 text-base hover:bg-zinc-800 rounded-lg transition-transform hover:scale-120"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Voice record button if input is empty, otherwise Send button */}
            {inputText.trim() || editingMessage ? (
              <button
                id="composer-send-btn"
                onClick={handleSend}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 transition-transform active:scale-95"
                title={t.send}
              >
                <Send size={18} />
              </button>
            ) : (
              <button
                id="composer-voice-btn"
                onClick={startVoiceRecording}
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title={t.recordVoice}
              >
                <Mic size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
