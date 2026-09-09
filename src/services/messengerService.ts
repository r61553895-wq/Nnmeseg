import { User, Conversation, Message, MessageAttachment, AppSettings } from '../types';
import { INITIAL_CURRENT_USER, INITIAL_USERS, INITIAL_CONVERSATIONS, INITIAL_MESSAGES } from './mockData';
import { soundFx } from '../utils/audio';

const STORAGE_KEYS = {
  CURRENT_USER: 'vesper_current_user_v1',
  USERS: 'vesper_users_v1',
  CONVERSATIONS: 'vesper_conversations_v1',
  MESSAGES: 'vesper_messages_v1',
  SETTINGS: 'vesper_settings_v1',
};

type EventListener<T> = (data: T) => void;

class MessengerService {
  private currentUser: User;
  private users: User[];
  private conversations: Conversation[];
  private messages: Record<string, Message[]>;
  private settings: AppSettings;
  
  // Realtime listeners
  private messageListeners: Set<EventListener<{ message: Message; conversationId: string }>> = new Set();
  private typingListeners: Set<EventListener<{ conversationId: string; userNames: string[] }>> = new Set();
  private presenceListeners: Set<EventListener<{ userId: string; online: boolean; lastSeen?: string }>> = new Set();
  private conversationListeners: Set<EventListener<Conversation[]>> = new Set();

  private typingTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  private syncChannel: BroadcastChannel | null = null;

  constructor() {
    const rawUser = this.load(STORAGE_KEYS.CURRENT_USER, INITIAL_CURRENT_USER);
    this.currentUser = (rawUser && rawUser.id) ? rawUser : INITIAL_CURRENT_USER;

    const rawUsers = this.load(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.users = Array.isArray(rawUsers) && rawUsers.length > 0 ? rawUsers : INITIAL_USERS;

    const rawConvs = this.load(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);
    this.conversations = Array.isArray(rawConvs) && rawConvs.length > 0 ? rawConvs : INITIAL_CONVERSATIONS;

    const rawMsgs = this.load(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    this.messages = (rawMsgs && typeof rawMsgs === 'object') ? rawMsgs : INITIAL_MESSAGES;

    const rawSettings = this.load<Partial<AppSettings> | null>(STORAGE_KEYS.SETTINGS, null);
    this.settings = {
      language: rawSettings?.language || 'ru',
      theme: rawSettings?.theme || 'dark',
      soundEnabled: rawSettings?.soundEnabled !== false,
      notificationsEnabled: rawSettings?.notificationsEnabled !== false,
      sendOnEnter: rawSettings?.sendOnEnter !== false,
      compactMode: Boolean(rawSettings?.compactMode),
      presenceStatus: rawSettings?.presenceStatus || 'online',
    };

    soundFx.enabled = this.settings.soundEnabled;
    this.syncConversationParticipants();

    // Setup Cross-Tab Realtime Synchronizer
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.syncChannel = new BroadcastChannel('vesper_messenger_sync');
        this.syncChannel.onmessage = (event) => {
          this.handleCrossTabEvent(event.data);
        };
      } catch {
        // BroadcastChannel unavailable fallback
      }
    }
  }

  private broadcast(type: string, payload: unknown) {
    if (this.syncChannel) {
      try {
        this.syncChannel.postMessage({ type, payload, senderId: this.currentUser.id, timestamp: Date.now() });
      } catch {
        // Fallback
      }
    }
  }

  private handleCrossTabEvent(eventData: { type: string; payload: any; senderId: string }) {
    if (!eventData || !eventData.type) return;

    if (eventData.type === 'NEW_MESSAGE') {
      const { message, conversationId } = eventData.payload;
      if (!this.messages[conversationId]) {
        this.messages[conversationId] = [];
      }
      if (!this.messages[conversationId].some((m) => m.id === message.id)) {
        this.messages[conversationId].push(message);
        this.syncConversationParticipants();
        this.emitMessage(message, conversationId);
        this.emitConversations();
        soundFx.playReceived();
      }
    } else if (eventData.type === 'UPDATE_MESSAGE') {
      const { message, conversationId } = eventData.payload;
      const list = this.messages[conversationId];
      if (list) {
        const idx = list.findIndex((m) => m.id === message.id);
        if (idx !== -1) {
          list[idx] = message;
          this.emitMessage(message, conversationId);
        }
      }
    } else if (eventData.type === 'DELETE_MESSAGE') {
      const { messageId, conversationId } = eventData.payload;
      if (this.messages[conversationId]) {
        this.messages[conversationId] = this.messages[conversationId].filter((m) => m.id !== messageId);
        this.syncConversationParticipants();
        this.emitConversations();
      }
    } else if (eventData.type === 'UPDATE_CONVERSATIONS') {
      this.conversations = this.load(STORAGE_KEYS.CONVERSATIONS, this.conversations);
      this.syncConversationParticipants();
      this.emitConversations();
    }
  }

  private load<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  }

  private save(key: string, data: unknown) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Quota or incognito error handling
    }
  }

  private syncConversationParticipants() {
    if (!Array.isArray(this.conversations)) {
      this.conversations = INITIAL_CONVERSATIONS;
    }
    const allUsers = [this.currentUser, ...(Array.isArray(this.users) ? this.users : [])].filter(Boolean);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    this.conversations = this.conversations
      .filter((c): c is Conversation => Boolean(c && c.id))
      .map((c) => {
        const participantIds = Array.isArray(c.participantIds) ? c.participantIds : [];
        const participants = participantIds
          .map((id) => userMap.get(id))
          .filter((u): u is User => Boolean(u));
        
        const convMsgs = (this.messages && c.id && this.messages[c.id]) || [];
        const lastMsg = convMsgs[convMsgs.length - 1];

        return {
          ...c,
          participantIds,
          participants: participants.length > 0 ? participants : (c.participants || []),
          lastMessage: lastMsg || c.lastMessage,
        };
      });
  }

  // --- Auth & Profile ---

  getCurrentUser(): User {
    return this.currentUser;
  }

  updateProfile(updates: Partial<User>): User {
    this.currentUser = { ...this.currentUser, ...updates };
    this.save(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    this.syncConversationParticipants();
    this.emitConversations();
    return this.currentUser;
  }

  loginAs(userOrName: string): User {
    // Switch to one of the mock personas or create a custom one
    const found = this.users.find((u) => u.username.toLowerCase() === userOrName.toLowerCase() || u.name.toLowerCase() === userOrName.toLowerCase());
    if (found) {
      this.currentUser = { ...found, isContact: false };
    } else {
      this.currentUser = {
        id: `usr_${Date.now()}`,
        username: userOrName.toLowerCase().replace(/\s+/g, '_'),
        name: userOrName,
        avatar: '',
        bio: 'Vesper Messenger user',
        online: true,
        statusMessage: 'Available',
      };
    }
    this.save(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    this.syncConversationParticipants();
    this.emitConversations();
    return this.currentUser;
  }

  switchActiveUser(targetUserId: string): User {
    const target = this.users.find((u) => u.id === targetUserId);
    if (!target) return this.currentUser;

    const oldUser = this.currentUser;
    // Replace target in users list with old active user
    this.users = this.users.map((u) => (u.id === targetUserId ? oldUser : u));
    this.currentUser = target;

    this.save(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    this.save(STORAGE_KEYS.USERS, this.users);
    this.syncConversationParticipants();
    this.emitConversations();
    this.broadcast('UPDATE_CONVERSATIONS', {});
    return this.currentUser;
  }

  createContact(name: string, username: string, phone?: string, bio?: string): User {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: username.replace(/^@/, ''),
      name,
      avatar: '',
      bio: bio || 'Vesper Messenger contact',
      phone: phone || '+1 (555) 000-0000',
      online: true,
      isContact: true,
    };
    this.users.push(newUser);
    this.save(STORAGE_KEYS.USERS, this.users);
    this.syncConversationParticipants();
    this.emitConversations();
    this.broadcast('UPDATE_CONVERSATIONS', {});
    return newUser;
  }

  clearChatHistory(conversationId: string) {
    this.messages[conversationId] = [];
    this.conversations = this.conversations.map((c) =>
      c.id === conversationId ? { ...c, lastMessage: undefined, unreadCount: 0 } : c
    );
    this.save(STORAGE_KEYS.MESSAGES, this.messages);
    this.save(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    this.syncConversationParticipants();
    this.emitConversations();
    this.broadcast('UPDATE_CONVERSATIONS', {});
  }

  deleteConversation(conversationId: string) {
    this.conversations = this.conversations.filter((c) => c.id !== conversationId);
    delete this.messages[conversationId];
    this.save(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    this.save(STORAGE_KEYS.MESSAGES, this.messages);
    this.emitConversations();
    this.broadcast('UPDATE_CONVERSATIONS', {});
  }

  // --- Settings ---

  getSettings(): AppSettings {
    return this.settings;
  }

  updateSettings(updates: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...updates };
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
    if (typeof updates.soundEnabled === 'boolean') {
      soundFx.enabled = updates.soundEnabled;
    }
    return this.settings;
  }

  // --- Users & Contacts ---

  getAllUsers(): User[] {
    return this.users;
  }

  getContacts(): User[] {
    return this.users.filter((u) => u.isContact);
  }

  toggleContact(userId: string): boolean {
    this.users = this.users.map((u) => (u.id === userId ? { ...u, isContact: !u.isContact } : u));
    this.save(STORAGE_KEYS.USERS, this.users);
    this.syncConversationParticipants();
    return Boolean(this.users.find((u) => u.id === userId)?.isContact);
  }

  searchUsers(query: string): User[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.users;
    return this.users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || (u.bio && u.bio.toLowerCase().includes(q))
    );
  }

  // --- Conversations ---

  getConversations(): Conversation[] {
    this.syncConversationParticipants();
    return [...this.conversations].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  getConversation(id: string): Conversation | undefined {
    this.syncConversationParticipants();
    return this.conversations.find((c) => c.id === id);
  }

  createOrOpenDirectChat(otherUserId: string): Conversation {
    // Check if direct conversation already exists
    const existing = this.conversations.find(
      (c) => c.type === 'direct' && c.participantIds.includes(this.currentUser.id) && c.participantIds.includes(otherUserId)
    );

    if (existing) {
      return existing;
    }

    const otherUser = this.users.find((u) => u.id === otherUserId);
    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      type: 'direct',
      participantIds: [this.currentUser.id, otherUserId],
      participants: [this.currentUser, ...(otherUser ? [otherUser] : [])],
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
    };

    this.conversations.unshift(newConv);
    this.messages[newConv.id] = [];
    this.save(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    this.save(STORAGE_KEYS.MESSAGES, this.messages);
    this.emitConversations();
    return newConv;
  }

  createGroupChat(name: string, memberIds: string[], description?: string, avatar?: string): Conversation {
    const participantIds = Array.from(new Set([this.currentUser.id, ...memberIds]));
    const newConv: Conversation = {
      id: `grp_${Date.now()}`,
      type: 'group',
      name,
      description: description || 'Group discussion in Vesper.',
      avatar: avatar || '',
      participantIds,
      participants: [],
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
      createdBy: this.currentUser.id,
    };

    this.conversations.unshift(newConv);
    this.messages[newConv.id] = [
      {
        id: `sys_${Date.now()}`,
        conversationId: newConv.id,
        senderId: this.currentUser.id,
        text: `Group "${name}" was created.`,
        createdAt: new Date().toISOString(),
        readBy: [this.currentUser.id],
        reactions: [],
      }
    ];

    this.save(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    this.save(STORAGE_KEYS.MESSAGES, this.messages);
    this.syncConversationParticipants();
    this.emitConversations();
    return newConv;
  }

  togglePinConversation(conversationId: string) {
    this.conversations = this.conversations.map((c) =>
      c.id === conversationId ? { ...c, isPinned: !c.isPinned } : c
    );
    this.save(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    this.emitConversations();
  }

  toggleMuteConversation(conversationId: string) {
    this.conversations = this.conversations.map((c) =>
      c.id === conversationId ? { ...c, isMuted: !c.isMuted } : c
    );
    this.save(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    this.emitConversations();
  }

  markConversationAsRead(conversationId: string) {
    let changed = false;
    this.conversations = this.conversations.map((c) => {
      if (c.id === conversationId && c.unreadCount > 0) {
        changed = true;
        return { ...c, unreadCount: 0 };
      }
      return c;
    });

    const msgs = this.messages[conversationId] || [];
    msgs.forEach((m) => {
      if (!m.readBy.includes(this.currentUser.id)) {
        m.readBy.push(this.currentUser.id);
        m.status = 'read';
        changed = true;
      }
    });

    if (changed) {
      this.save(STORAGE_KEYS.CONVERSATIONS, this.conversations);
      this.save(STORAGE_KEYS.MESSAGES, this.messages);
      this.emitConversations();
    }
  }

  // --- Messages ---

  getMessages(conversationId: string): Message[] {
    return this.messages[conversationId] || [];
  }

  sendMessage(
    conversationId: string,
    text: string,
    attachments?: MessageAttachment[],
    replyTo?: Message['replyTo']
  ): Message {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId,
      senderId: this.currentUser.id,
      text: text.trim(),
      attachments,
      replyTo,
      reactions: [],
      createdAt: new Date().toISOString(),
      readBy: [this.currentUser.id],
      status: 'sending',
    };

    if (!this.messages[conversationId]) {
      this.messages[conversationId] = [];
    }
    this.messages[conversationId].push(newMessage);

    // Update conversation last message & time
    this.conversations = this.conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessage: newMessage,
          updatedAt: newMessage.createdAt,
        };
      }
      return c;
    });

    this.save(STORAGE_KEYS.MESSAGES, this.messages);
    this.save(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    
    // Play sent sound
    soundFx.playSent();

    // Optimistic status advance: sent -> delivered
    setTimeout(() => {
      newMessage.status = 'sent';
      this.save(STORAGE_KEYS.MESSAGES, this.messages);
      this.emitMessage(newMessage, conversationId);
    }, 250);

    setTimeout(() => {
      newMessage.status = 'delivered';
      this.save(STORAGE_KEYS.MESSAGES, this.messages);
      this.emitMessage(newMessage, conversationId);
    }, 600);

    this.broadcast('NEW_MESSAGE', { message: newMessage, conversationId });
    this.emitMessage(newMessage, conversationId);
    this.emitConversations();

    // Trigger simulated real-time counterpart reaction / typing / reply
    this.triggerRealtimeSimulation(conversationId, text);

    return newMessage;
  }

  editMessage(conversationId: string, messageId: string, newText: string): Message | null {
    const list = this.messages[conversationId];
    if (!list) return null;
    const msg = list.find((m) => m.id === messageId);
    if (!msg || msg.senderId !== this.currentUser.id) return null;

    msg.text = newText.trim();
    msg.editedAt = new Date().toISOString();

    this.save(STORAGE_KEYS.MESSAGES, this.messages);
    this.broadcast('UPDATE_MESSAGE', { message: msg, conversationId });
    this.emitMessage(msg, conversationId);
    return msg;
  }

  deleteMessage(conversationId: string, messageId: string): boolean {
    const list = this.messages[conversationId];
    if (!list) return false;
    this.messages[conversationId] = list.filter((m) => m.id !== messageId);
    
    // Update last message if needed
    const remaining = this.messages[conversationId];
    this.conversations = this.conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessage: remaining[remaining.length - 1],
        };
      }
      return c;
    });

    this.save(STORAGE_KEYS.MESSAGES, this.messages);
    this.save(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    this.broadcast('DELETE_MESSAGE', { messageId, conversationId });
    this.emitConversations();
    return true;
  }

  toggleReaction(conversationId: string, messageId: string, emoji: string) {
    const list = this.messages[conversationId];
    if (!list) return;
    const msg = list.find((m) => m.id === messageId);
    if (!msg) return;

    soundFx.playReaction();

    const existingReaction = msg.reactions.find((r) => r.emoji === emoji);
    if (existingReaction) {
      if (existingReaction.userIds.includes(this.currentUser.id)) {
        existingReaction.userIds = existingReaction.userIds.filter((id) => id !== this.currentUser.id);
        if (existingReaction.userIds.length === 0) {
          msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        existingReaction.userIds.push(this.currentUser.id);
      }
    } else {
      msg.reactions.push({ emoji, userIds: [this.currentUser.id] });
    }

    this.save(STORAGE_KEYS.MESSAGES, this.messages);
    this.broadcast('UPDATE_MESSAGE', { message: msg, conversationId });
    this.emitMessage(msg, conversationId);
  }

  togglePinMessage(conversationId: string, messageId: string) {
    const list = this.messages[conversationId];
    if (!list) return;
    const msg = list.find((m) => m.id === messageId);
    if (!msg) return;

    msg.isPinned = !msg.isPinned;
    
    this.conversations = this.conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          pinnedMessageId: msg.isPinned ? msg.id : undefined,
        };
      }
      return c;
    });

    this.save(STORAGE_KEYS.MESSAGES, this.messages);
    this.save(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    this.broadcast('UPDATE_MESSAGE', { message: msg, conversationId });
    this.emitMessage(msg, conversationId);
    this.emitConversations();
  }

  forwardMessage(targetConversationId: string, message: Message) {
    const sender = this.users.find((u) => u.id === message.senderId) || this.currentUser;
    const forwardedMessage: Message = {
      id: `msg_fwd_${Date.now()}`,
      conversationId: targetConversationId,
      senderId: this.currentUser.id,
      text: message.text,
      attachments: message.attachments,
      forwardedFrom: {
        senderName: sender.name,
      },
      reactions: [],
      createdAt: new Date().toISOString(),
      readBy: [this.currentUser.id],
      status: 'sent',
    };

    if (!this.messages[targetConversationId]) {
      this.messages[targetConversationId] = [];
    }
    this.messages[targetConversationId].push(forwardedMessage);

    this.conversations = this.conversations.map((c) => {
      if (c.id === targetConversationId) {
        return {
          ...c,
          lastMessage: forwardedMessage,
          updatedAt: forwardedMessage.createdAt,
        };
      }
      return c;
    });

    this.save(STORAGE_KEYS.MESSAGES, this.messages);
    this.save(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    soundFx.playSent();
    this.emitMessage(forwardedMessage, targetConversationId);
    this.emitConversations();
  }

  // --- Real-Time Simulation Engine ---

  private triggerRealtimeSimulation(conversationId: string, userText: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    // Pick responder
    const otherParticipantIds = conv.participantIds.filter((id) => id !== this.currentUser.id);
    if (otherParticipantIds.length === 0) return;

    const responderId = otherParticipantIds[0];
    const responder = this.users.find((u) => u.id === responderId);
    if (!responder) return;

    // 1. Show typing status after 1.2s
    setTimeout(() => {
      this.emitTyping(conversationId, [responder.name]);
    }, 1100);

    // 2. Generate natural, contextual replies
    setTimeout(() => {
      this.emitTyping(conversationId, []);

      let replyText = '';
      const lower = userText.toLowerCase();
      const isRussian = /[а-яё]/i.test(userText);

      if (isRussian) {
        if (lower.includes('привет') || lower.includes('хай') || lower.includes('здравствуй') || lower.includes('салют')) {
          replyText = `Привет, ${this.currentUser.name}! Рад тебя слышать в Vesper. Все функции мессенджера работают молниеносно!`;
        } else if (lower.includes('как дела') || lower.includes('как ты')) {
          replyText = `Отлично! Тестирую мгновенную доставку, реакции и запись голосовых сообщений. Как у тебя дела?`;
        } else if (lower.includes('что делаешь') || lower.includes('чем занят')) {
          replyText = `Проверяю работу чатов, синхронизацию между вкладками и закрепленные сообщения. Всё летает!`;
        } else if (lower.includes('тест') || lower.includes('проверка')) {
          replyText = `Проверка связи прошла успешно! Сообщение получено в реальном времени, статус доставки обновлен.`;
        } else if (lower.includes('голос') || lower.includes('войс') || lower.includes('аудио') || lower.includes('микрофон')) {
          replyText = `Да, здесь можно нажать на микрофон и записать настоящее аудиосообщение с микрофона, а затем слушать через интерактивный плеер!`;
        } else if (lower.includes('файл') || lower.includes('фото') || lower.includes('картинка') || lower.includes('скриншот')) {
          replyText = `Файлы и фотографии отлично отображаются! Можно кликнуть по фото, чтобы развернуть во весь экран или скачать.`;
        } else if (lower.includes('кто ты') || lower.includes('ты кто')) {
          replyText = `Я ${responder.name} из твоих контактов. Ты также можешь переключиться на мой профиль через быстрое переключение сверху и писать от моего имени!`;
        } else if (lower.includes('спасибо') || lower.includes('благодарю')) {
          replyText = `Пожалуйста! Можешь также протестировать создание группы или пересылку сообщений в другие диалоги.`;
        } else {
          const ruCanned = [
            `Принято! Отличная мысль, обязательно зафиксирую это.`,
            `Полностью согласен! Мессенджер ощущается очень быстро и без лишнего мусора.`,
            `Проверил обновление — всё работает без задержек. Попробуй поставить реакцию на это сообщение!`,
            `Спасибо за сообщение! Проверяю inline-цитирование и реакции.`,
            `Кстати, попробуй закрепить важное сообщение вверху чата или наговорить голосовое.`
          ];
          replyText = ruCanned[Math.floor(Math.random() * ruCanned.length)];
        }
      } else {
        if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
          replyText = `Hey ${this.currentUser.name}! Good to see you on Vesper. Loving the zero-latency feel of this build.`;
        } else if (lower.includes('design') || lower.includes('ui')) {
          replyText = `The typographic hierarchy and deep graphite contrast make such a massive difference. Feels like a real high-end studio tool.`;
        } else if (lower.includes('call') || lower.includes('meeting')) {
          replyText = `I'm free if you want to do a quick audio sync on the architecture!`;
        } else if (lower.includes('test') || lower.includes('check')) {
          replyText = `Test message received in real-time! All status transitions and reactions are firing normally.`;
        } else {
          const canned = [
            `Noted! I'll incorporate that into the client review spec.`,
            `Totally agree. Clean spacing and purposeful typography make everything feel effortless.`,
            `Just checked the update. Everything looks sharp and consistent.`,
            `Thanks for sending this over! Testing the reactions and inline thread replies now.`,
            `Looks great. The discreet audio click on send is also a super satisfying touch.`
          ];
          replyText = canned[Math.floor(Math.random() * canned.length)];
        }
      }

      const incomingMsg: Message = {
        id: `msg_sim_${Date.now()}`,
        conversationId,
        senderId: responder.id,
        text: replyText,
        reactions: [],
        createdAt: new Date().toISOString(),
        readBy: [responder.id],
        status: 'delivered',
      };

      if (!this.messages[conversationId]) {
        this.messages[conversationId] = [];
      }
      this.messages[conversationId].push(incomingMsg);

      // Increment unread count if not active or open
      this.conversations = this.conversations.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: incomingMsg,
            updatedAt: incomingMsg.createdAt,
            unreadCount: c.unreadCount + 1,
          };
        }
        return c;
      });

      this.save(STORAGE_KEYS.MESSAGES, this.messages);
      this.save(STORAGE_KEYS.CONVERSATIONS, this.conversations);

      // Play audio chime
      soundFx.playReceived();

      this.broadcast('NEW_MESSAGE', { message: incomingMsg, conversationId });
      this.emitMessage(incomingMsg, conversationId);
      this.emitConversations();
    }, 2400);
  }

  // --- Real-time Event Subscription API ---

  onMessage(listener: EventListener<{ message: Message; conversationId: string }>) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onTyping(listener: EventListener<{ conversationId: string; userNames: string[] }>) {
    this.typingListeners.add(listener);
    return () => this.typingListeners.delete(listener);
  }

  onPresence(listener: EventListener<{ userId: string; online: boolean; lastSeen?: string }>) {
    this.presenceListeners.add(listener);
    return () => this.presenceListeners.delete(listener);
  }

  onConversations(listener: EventListener<Conversation[]>) {
    this.conversationListeners.add(listener);
    return () => this.conversationListeners.delete(listener);
  }

  private emitMessage(message: Message, conversationId: string) {
    this.messageListeners.forEach((fn) => fn({ message, conversationId }));
  }

  private emitTyping(conversationId: string, userNames: string[]) {
    this.typingListeners.forEach((fn) => fn({ conversationId, userNames }));
  }

  private emitConversations() {
    const list = this.getConversations();
    this.conversationListeners.forEach((fn) => fn(list));
  }

  resetAllData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    }
    this.currentUser = INITIAL_CURRENT_USER;
    this.users = INITIAL_USERS;
    this.conversations = INITIAL_CONVERSATIONS;
    this.messages = INITIAL_MESSAGES;
    this.settings = {
      language: 'ru',
      theme: 'dark',
      soundEnabled: true,
      notificationsEnabled: true,
      sendOnEnter: true,
      compactMode: false,
      presenceStatus: 'online',
    };
    this.syncConversationParticipants();
    this.emitConversations();
  }
}

export const messengerService = new MessengerService();
