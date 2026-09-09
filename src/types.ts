export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  email?: string;
  bio?: string;
  online: boolean;
  lastSeen?: string;
  statusMessage?: string;
  isContact?: boolean;
  phone?: string;
  role?: 'admin' | 'member';
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'audio';
  url: string;
  name: string;
  size?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  waveform?: number[];
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachments?: MessageAttachment[];
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  forwardedFrom?: {
    senderName: string;
  };
  reactions: MessageReaction[];
  createdAt: string;
  editedAt?: string;
  readBy: string[];
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  isPinned?: boolean;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  description?: string;
  participantIds: string[];
  participants: User[];
  lastMessage?: Message;
  updatedAt: string;
  unreadCount: number;
  pinnedMessageId?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  createdBy?: string;
}

export type RightPanelMode = 'info' | 'media' | 'files' | 'members' | 'pinned' | null;

export interface AppSettings {
  language: 'ru' | 'en';
  theme: 'dark' | 'light' | 'system';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  sendOnEnter: boolean;
  compactMode: boolean;
  presenceStatus: 'online' | 'away' | 'dnd' | 'invisible';
}
