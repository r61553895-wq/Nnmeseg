import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RightPanel } from './components/RightPanel';
import { CommandMenu } from './components/Modals/CommandMenu';
import { NewChatModal } from './components/Modals/NewChatModal';
import { CreateGroupModal } from './components/Modals/CreateGroupModal';
import { ProfileModal } from './components/Modals/ProfileModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { ForwardModal } from './components/Modals/ForwardModal';
import { CallModal } from './components/Modals/CallModal';
import { ImageViewerModal } from './components/Modals/ImageViewerModal';

import { messengerService } from './services/messengerService';
import { firestoreMessengerService } from './services/firestoreMessengerService';
import { auth, onAuthStateChanged, testConnection, type FirebaseUser } from './firebase';
import { AuthModal } from './components/Modals/AuthModal';
import { UserAvatar } from './components/UserAvatar';
import { Database, LogIn, Sparkles, CheckCircle2 } from 'lucide-react';
import { Conversation, Message, User, AppSettings, MessageAttachment } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => messengerService.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => messengerService.getAllUsers());
  const [conversations, setConversations] = useState<Conversation[]>(() => messengerService.getConversations());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const list = messengerService.getConversations();
    return list[0]?.id || null;
  });
  const [settings, setSettings] = useState<AppSettings>(() => messengerService.getSettings());

  // Firebase Live Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  // Messages in active conversation
  const [messages, setMessages] = useState<Message[]>([]);

  // Typing indicators: { [convId: string]: string[] }
  const [typingMap, setTypingMap] = useState<Record<string, string[]>>({});

  // Mobile layout view toggle ('sidebar' or 'chat')
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  // Right Side Panel state
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // Modals state
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [viewerImage, setViewerImage] = useState<{ url: string; name?: string } | null>(null);
  const [isCallOpen, setIsCallOpen] = useState(false);

  // Refresh messages for active conversation
  const refreshMessages = useCallback((convId: string | null) => {
    if (!convId) {
      setMessages([]);
      return;
    }
    const msgs = messengerService.getMessages(convId);
    setMessages([...msgs]);
  }, []);

  // Sync active conversation messages on change
  useEffect(() => {
    refreshMessages(activeConversationId);
  }, [activeConversationId, refreshMessages]);

  // Apply Theme to DOM root
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [settings.theme]);

  // Subscribe to Realtime Service Events
  useEffect(() => {
    const unsubMsg = messengerService.onMessage(({ message, conversationId }) => {
      if (conversationId === activeConversationId) {
        setMessages((prev) => {
          // If message already exists (e.g. status transition), update it
          const idx = prev.findIndex((m) => m.id === message.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = message;
            return next;
          }
          return [...prev, message];
        });
      }
      setConversations(messengerService.getConversations());
    });

    const unsubTyping = messengerService.onTyping(({ conversationId, userNames }) => {
      setTypingMap((prev) => ({
        ...prev,
        [conversationId]: userNames,
      }));
    });

    const unsubConvs = messengerService.onConversations((list) => {
      setConversations(list);
    });

    return () => {
      unsubMsg();
      unsubTyping();
      unsubConvs();
    };
  }, [activeConversationId]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Test connection to Firestore on boot
  useEffect(() => {
    testConnection().then((connected) => {
      setIsDbReady(connected);
    });
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    if (!auth) return;
    try {
      const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          try {
            const profile = await firestoreMessengerService.syncUserProfile(fbUser);
            setCurrentUser(profile);
          } catch (err) {
            console.error('Failed to sync user profile:', err);
          }
        }
      });
      return () => unsubAuth();
    } catch (e) {
      console.warn('Firebase auth listener could not be registered:', e);
    }
  }, []);

  // Subscribe to Firestore users & conversations when logged into Firebase
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubUsers = firestoreMessengerService.subscribeUsers((firestoreUsers) => {
      if (firestoreUsers.length > 0) {
        setUsers(firestoreUsers);
      }
    });

    const unsubConvs = firestoreMessengerService.subscribeConversations(firebaseUser.uid, (firestoreConvs) => {
      setConversations(firestoreConvs);
      if (firestoreConvs.length > 0 && !activeConversationId) {
        setActiveConversationId(firestoreConvs[0].id);
      }
    });

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubConvs) unsubConvs();
    };
  }, [firebaseUser, activeConversationId]);

  // Subscribe to Firestore messages for active conversation when in Firebase mode
  useEffect(() => {
    if (!firebaseUser || !activeConversationId) {
      if (!firebaseUser) refreshMessages(activeConversationId);
      return;
    }

    const unsubMsgs = firestoreMessengerService.subscribeMessages(activeConversationId, (firestoreMsgs) => {
      setMessages(firestoreMsgs);
    });

    return () => {
      if (unsubMsgs) unsubMsgs();
    };
  }, [firebaseUser, activeConversationId, refreshMessages]);

  // Handlers
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setMobileView('chat');
    if (!firebaseUser) {
      messengerService.markConversationAsRead(id);
      refreshMessages(id);
    }
  };

  const handleSendMessage = async (
    text: string,
    attachments?: MessageAttachment[],
    replyTo?: Message['replyTo']
  ) => {
    if (!activeConversationId) return;
    if (firebaseUser) {
      try {
        await firestoreMessengerService.sendMessage(activeConversationId, currentUser, text, attachments, replyTo);
      } catch (err) {
        console.error('Error sending message to Firestore:', err);
      }
    } else {
      messengerService.sendMessage(activeConversationId, text, attachments, replyTo);
      refreshMessages(activeConversationId);
    }
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!activeConversationId) return;
    if (firebaseUser) {
      try {
        await firestoreMessengerService.editMessage(activeConversationId, messageId, newText);
      } catch (err) {
        console.error('Error editing message in Firestore:', err);
      }
    } else {
      messengerService.editMessage(activeConversationId, messageId, newText);
      refreshMessages(activeConversationId);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConversationId) return;
    if (firebaseUser) {
      try {
        await firestoreMessengerService.deleteMessage(activeConversationId, messageId);
      } catch (err) {
        console.error('Error deleting message from Firestore:', err);
      }
    } else {
      messengerService.deleteMessage(activeConversationId, messageId);
      refreshMessages(activeConversationId);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!activeConversationId) return;
    if (firebaseUser) {
      try {
        const msg = messages.find((m) => m.id === messageId);
        await firestoreMessengerService.toggleReaction(activeConversationId, messageId, emoji, currentUser.id, msg?.reactions || []);
      } catch (err) {
        console.error('Error toggling reaction in Firestore:', err);
      }
    } else {
      messengerService.toggleReaction(activeConversationId, messageId, emoji);
      refreshMessages(activeConversationId);
    }
  };

  const handleTogglePinMessage = async (messageId: string) => {
    if (!activeConversationId) return;
    if (firebaseUser) {
      try {
        const msg = messages.find((m) => m.id === messageId);
        await firestoreMessengerService.togglePinMessage(activeConversationId, messageId, !msg?.isPinned);
      } catch (err) {
        console.error('Error toggling pin in Firestore:', err);
      }
    } else {
      messengerService.togglePinMessage(activeConversationId, messageId);
      refreshMessages(activeConversationId);
    }
  };

  const handleForwardMessage = (targetConvId: string, message: Message) => {
    if (firebaseUser) {
      firestoreMessengerService.sendMessage(targetConvId, currentUser, message.text, message.attachments);
    } else {
      messengerService.forwardMessage(targetConvId, message);
      if (targetConvId === activeConversationId) {
        refreshMessages(targetConvId);
      }
    }
  };

  const handleStartDirectChat = async (userId: string) => {
    if (firebaseUser) {
      const target = users.find((u) => u.id === userId);
      if (!target) return;
      const existing = conversations.find((c) => c.type === 'direct' && (c.participantIds || []).includes(userId));
      if (existing) {
        setActiveConversationId(existing.id);
      } else {
        const newId = await firestoreMessengerService.createConversation({
          type: 'direct',
          name: target.name,
          avatar: target.avatar,
          participantIds: [firebaseUser.uid, userId],
          participants: [currentUser, target],
          createdBy: firebaseUser.uid,
        });
        setActiveConversationId(newId);
      }
      setMobileView('chat');
    } else {
      const conv = messengerService.createOrOpenDirectChat(userId);
      setConversations(messengerService.getConversations());
      setActiveConversationId(conv.id);
      setMobileView('chat');
      refreshMessages(conv.id);
    }
  };

  const handleCreateGroup = async (
    name: string,
    memberIds: string[],
    description?: string,
    avatar?: string
  ) => {
    if (firebaseUser) {
      const members = users.filter((u) => memberIds.includes(u.id));
      const allMembers = [currentUser, ...members];
      const newId = await firestoreMessengerService.createConversation({
        type: 'group',
        name,
        avatar: avatar || '',
        participantIds: [firebaseUser.uid, ...memberIds],
        participants: allMembers,
        createdBy: firebaseUser.uid,
      });
      setActiveConversationId(newId);
      setMobileView('chat');
    } else {
      const conv = messengerService.createGroupChat(name, memberIds, description, avatar);
      setConversations(messengerService.getConversations());
      setActiveConversationId(conv.id);
      setMobileView('chat');
      refreshMessages(conv.id);
    }
  };

  const handleUpdateProfile = (updates: Partial<User>) => {
    const updated = messengerService.updateProfile(updates);
    setCurrentUser(updated);
    setConversations(messengerService.getConversations());
  };

  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    const updated = messengerService.updateSettings(updates);
    setSettings(updated);
  };

  const handleSwitchAccount = (nameOrHandle: string) => {
    const switched = messengerService.loginAs(nameOrHandle);
    setCurrentUser(switched);
    setUsers(messengerService.getAllUsers());
    setConversations(messengerService.getConversations());
    if (activeConversationId) refreshMessages(activeConversationId);
  };

  const handleSwitchActiveUser = (targetUserId: string) => {
    const switched = messengerService.switchActiveUser(targetUserId);
    setCurrentUser(switched);
    setUsers(messengerService.getAllUsers());
    const convs = messengerService.getConversations();
    setConversations(convs);
    setActiveConversationId(convs[0]?.id || null);
    refreshMessages(convs[0]?.id || null);
  };

  const handleResetData = () => {
    messengerService.resetAllData();
    setCurrentUser(messengerService.getCurrentUser());
    setUsers(messengerService.getAllUsers());
    const convs = messengerService.getConversations();
    setConversations(convs);
    setActiveConversationId(convs[0]?.id || null);
    setSettings(messengerService.getSettings());
    refreshMessages(convs[0]?.id || null);
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;
  const activeTyping = activeConversationId ? typingMap[activeConversationId] || [] : [];

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden ${settings.theme === 'light' ? 'bg-[#f8fafc] text-zinc-900' : 'bg-[#0b0c10] text-zinc-100'}`}>
      {/* Top Quick Multi-User Bar & Status Indicator */}
      <div className="h-10 bg-[#0c0e14] border-b border-zinc-800/80 px-3.5 flex items-center justify-between text-xs text-zinc-400 select-none shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          {firebaseUser ? (
            <button
              id="top-user-auth-badge"
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all cursor-pointer"
              title="Firebase Firestore Cloud Connected - Manage Account"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <UserAvatar
                name={firebaseUser.displayName || currentUser.name}
                size="xs"
              />
              <span className="font-semibold text-white truncate max-w-[120px]">
                {firebaseUser.displayName || currentUser.name}
              </span>
              <span className="text-[10px] text-emerald-300 font-mono px-1 rounded bg-emerald-500/20 hidden sm:inline">
                Firestore DB
              </span>
            </button>
          ) : (
            <button
              id="top-google-sign-in-btn"
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20 transition-all text-xs cursor-pointer"
            >
              <Database size={13} className="text-blue-200" />
              <span>{settings.language === 'ru' ? 'Войти с Google (Облачная БД)' : 'Sign in with Google (Cloud DB)'}</span>
            </button>
          )}

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="hidden md:inline">
              {isDbReady ? 'Firestore: Готова к синхронизации' : 'Firestore: Подключение...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {!firebaseUser && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 hidden lg:inline mr-1">
                {settings.language === 'ru' ? 'Тестовые профили:' : 'Demo Switch:'}
              </span>
              {users
                .filter((u) => u.id !== currentUser.id)
                .slice(0, 3)
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSwitchActiveUser(u.id)}
                    className="px-2 py-0.5 rounded text-[11px] bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-all flex items-center gap-1.5"
                    title={settings.language === 'ru' ? `Войти как ${u.name}` : `Switch to ${u.name}`}
                  >
                    <UserAvatar name={u.name} size="xs" />
                    <span className="truncate max-w-[70px]">{u.name.split(' ')[0]}</span>
                  </button>
                ))}
            </div>
          )}

          <button
            id="open-auth-modal-btn"
            onClick={() => setIsAuthOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 transition-all"
            title="Database & Auth Status"
          >
            <Database size={13} className="text-zinc-400" />
            <span className="hidden sm:inline">
              {firebaseUser ? 'Аккаунт БД' : 'Статус БД'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Messenger Layout */}
      <div className="flex w-full flex-1 min-h-0 relative overflow-hidden">
        {/* Left Sidebar: visible on desktop or when mobileView === 'sidebar' */}
        <div className={`h-full ${mobileView === 'sidebar' ? 'w-full md:w-auto flex' : 'hidden md:flex'}`}>
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            currentUser={currentUser}
            settings={settings}
            onSelectConversation={handleSelectConversation}
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
            onTogglePin={(id) => messengerService.togglePinConversation(id)}
            onToggleMute={(id) => messengerService.toggleMuteConversation(id)}
            onMarkRead={(id) => messengerService.markConversationAsRead(id)}
          />
        </div>

        {/* Center Chat Area: visible on desktop or when mobileView === 'chat' */}
        <div className={`flex-1 h-full min-w-0 ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
          <ChatArea
            conversation={activeConversation}
            messages={messages}
            currentUser={currentUser}
            settings={settings}
            typingUsers={activeTyping}
            onBackToSidebar={() => setMobileView('sidebar')}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onToggleReaction={handleToggleReaction}
            onTogglePinMessage={handleTogglePinMessage}
            onForwardMessage={(msg) => setForwardingMessage(msg)}
            onOpenImage={(url, name) => setViewerImage({ url, name })}
            onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
            onStartCall={() => setIsCallOpen(true)}
          />
        </div>

        {/* Contextual Right Side Panel */}
        {isRightPanelOpen && (
          <RightPanel
            isOpen={isRightPanelOpen}
            onClose={() => setIsRightPanelOpen(false)}
            conversation={activeConversation}
            currentUser={currentUser}
            messages={messages}
            onOpenImage={(url, name) => setViewerImage({ url, name })}
            onScrollToMessage={(msgId) => {
              const el = document.getElementById(`message-bubble-${msgId}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onUnpinMessage={(msgId) => handleTogglePinMessage(msgId)}
            onSelectUserChat={(userId) => {
              handleStartDirectChat(userId);
              setIsRightPanelOpen(false);
            }}
            onToggleMute={(id) => messengerService.toggleMuteConversation(id)}
            onStartCall={() => setIsCallOpen(true)}
          />
        )}
      </div>

      {/* Modals & Dialogs */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        conversations={conversations}
        users={users}
        settings={settings}
        onSelectConversation={handleSelectConversation}
        onOpenNewChat={() => setIsNewChatOpen(true)}
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleTheme={() => handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
        onToggleSound={() => handleUpdateSettings({ soundEnabled: !settings.soundEnabled })}
        onResetData={handleResetData}
      />

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        users={users}
        onSelectUser={handleStartDirectChat}
        onToggleContact={(id) => {
          messengerService.toggleContact(id);
          setUsers(messengerService.getAllUsers());
        }}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        users={users}
        onCreateGroup={handleCreateGroup}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onSaveProfile={handleUpdateProfile}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        currentUser={currentUser}
        users={users}
        onUpdateSettings={handleUpdateSettings}
        onSwitchAccount={handleSwitchAccount}
        onResetData={handleResetData}
      />

      <ForwardModal
        isOpen={Boolean(forwardingMessage)}
        message={forwardingMessage}
        conversations={conversations}
        currentUser={currentUser}
        onClose={() => setForwardingMessage(null)}
        onForward={handleForwardMessage}
      />

      <CallModal
        isOpen={isCallOpen}
        conversation={activeConversation}
        currentUser={currentUser}
        onClose={() => setIsCallOpen(false)}
      />

      <ImageViewerModal
        url={viewerImage?.url || null}
        name={viewerImage?.name}
        onClose={() => setViewerImage(null)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        firebaseUser={firebaseUser}
        onLoginSuccess={(fbUser) => {
          setFirebaseUser(fbUser);
        }}
        onLogout={() => {
          setFirebaseUser(null);
          setCurrentUser(messengerService.getCurrentUser());
          setUsers(messengerService.getAllUsers());
          setConversations(messengerService.getConversations());
        }}
      />
    </div>
  );
}
