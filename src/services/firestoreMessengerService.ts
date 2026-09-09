import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { User, Conversation, Message, MessageAttachment, MessageReaction } from '../types';

export class FirestoreMessengerService {
  private usersUnsub: Unsubscribe | null = null;
  private conversationsUnsub: Unsubscribe | null = null;
  private messagesUnsub: Unsubscribe | null = null;

  /**
   * Syncs the authenticated Firebase user profile into the /users collection
   */
  async syncUserProfile(fbUser: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null }): Promise<User> {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userProfile: User = {
      id: fbUser.uid,
      username: (fbUser.email?.split('@')[0] || fbUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'user').slice(0, 30),
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      avatar: fbUser.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      email: fbUser.email || undefined,
      online: true,
      lastSeen: new Date().toISOString(),
      statusMessage: 'Vesper Cloud User',
    };

    try {
      await setDoc(userDocRef, {
        ...userProfile,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return userProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${fbUser.uid}`);
    }
  }

  /**
   * Subscribes to all registered users from Firestore
   */
  subscribeUsers(onUsersChanged: (users: User[]) => void): Unsubscribe {
    if (this.usersUnsub) this.usersUnsub();

    const usersCol = collection(db, 'users');
    try {
      this.usersUnsub = onSnapshot(
        usersCol,
        (snapshot) => {
          const users: User[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as User;
            users.push({
              ...data,
              id: d.id,
            });
          });
          onUsersChanged(users);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      );
      return this.usersUnsub;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
    }
  }

  /**
   * Subscribes to conversations for the current user
   */
  subscribeConversations(userId: string, onConversationsChanged: (convs: Conversation[]) => void): Unsubscribe {
    if (this.conversationsUnsub) this.conversationsUnsub();

    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', userId)
    );

    try {
      this.conversationsUnsub = onSnapshot(
        q,
        (snapshot) => {
          const convs: Conversation[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as any;
            convs.push({
              id: d.id,
              type: data.type || 'direct',
              name: data.name,
              avatar: data.avatar,
              description: data.description,
              participantIds: data.participantIds || [],
              participants: data.participants || [],
              lastMessage: data.lastMessage,
              updatedAt: data.updatedAt || new Date().toISOString(),
              unreadCount: data.unreadCount || 0,
              pinnedMessageId: data.pinnedMessageId,
              isPinned: data.isPinned || false,
              isMuted: data.isMuted || false,
              createdBy: data.createdBy,
            });
          });

          // Sort by updatedAt descending
          convs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          onConversationsChanged(convs);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'conversations');
        }
      );
      return this.conversationsUnsub;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'conversations');
    }
  }

  /**
   * Subscribes to messages within a specific conversation
   */
  subscribeMessages(conversationId: string, onMessagesChanged: (msgs: Message[]) => void): Unsubscribe {
    if (this.messagesUnsub) this.messagesUnsub();

    const messagesCol = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'));

    try {
      this.messagesUnsub = onSnapshot(
        q,
        (snapshot) => {
          const msgs: Message[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as any;
            msgs.push({
              id: d.id,
              conversationId,
              senderId: data.senderId,
              text: data.text || '',
              attachments: data.attachments || [],
              replyTo: data.replyTo,
              forwardedFrom: data.forwardedFrom,
              reactions: data.reactions || [],
              createdAt: data.createdAt || new Date().toISOString(),
              editedAt: data.editedAt,
              readBy: data.readBy || [],
              status: data.status || 'delivered',
              isPinned: data.isPinned || false,
            });
          });
          onMessagesChanged(msgs);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `conversations/${conversationId}/messages`);
        }
      );
      return this.messagesUnsub;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `conversations/${conversationId}/messages`);
    }
  }

  /**
   * Creates a new conversation in Firestore
   */
  async createConversation(params: {
    type: 'direct' | 'group';
    name?: string;
    avatar?: string;
    participantIds: string[];
    participants: User[];
    createdBy: string;
  }): Promise<string> {
    const convCol = collection(db, 'conversations');
    const newConvData = {
      type: params.type,
      name: params.name || '',
      avatar: params.avatar || '',
      participantIds: params.participantIds,
      participants: params.participants,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
      createdBy: params.createdBy,
    };

    try {
      const docRef = await addDoc(convCol, newConvData);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'conversations');
    }
  }

  /**
   * Sends a message into a conversation and updates conversation metadata
   */
  async sendMessage(
    conversationId: string,
    sender: User,
    text: string,
    attachments?: MessageAttachment[],
    replyTo?: Message['replyTo']
  ): Promise<string> {
    const messagesCol = collection(db, 'conversations', conversationId, 'messages');
    const now = new Date().toISOString();

    const messageData = {
      conversationId,
      senderId: sender.id,
      text,
      attachments: attachments || [],
      replyTo: replyTo || null,
      reactions: [],
      createdAt: now,
      readBy: [sender.id],
      status: 'sent',
      isPinned: false,
    };

    try {
      const msgRef = await addDoc(messagesCol, messageData);

      // Update parent conversation
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        updatedAt: now,
        lastMessage: {
          id: msgRef.id,
          conversationId,
          senderId: sender.id,
          text: text || (attachments?.[0]?.type === 'audio' ? '🎙️ Voice note' : '📎 Attachment'),
          createdAt: now,
          status: 'sent',
          reactions: [],
          readBy: [sender.id],
        },
      });

      return msgRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `conversations/${conversationId}/messages`);
    }
  }

  /**
   * Updates message reaction
   */
  async toggleReaction(conversationId: string, messageId: string, emoji: string, userId: string, currentReactions: MessageReaction[]): Promise<void> {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    let updated = [...currentReactions];
    const existingRx = updated.find((r) => r.emoji === emoji);

    if (existingRx) {
      if (existingRx.userIds.includes(userId)) {
        existingRx.userIds = existingRx.userIds.filter((id) => id !== userId);
      } else {
        existingRx.userIds.push(userId);
      }
      updated = updated.filter((r) => r.userIds.length > 0);
    } else {
      updated.push({ emoji, userIds: [userId] });
    }

    try {
      await updateDoc(msgRef, { reactions: updated });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `conversations/${conversationId}/messages/${messageId}`);
    }
  }

  /**
   * Toggles pinned state of a message
   */
  async togglePinMessage(conversationId: string, messageId: string, isPinned: boolean): Promise<void> {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const convRef = doc(db, 'conversations', conversationId);

    try {
      await updateDoc(msgRef, { isPinned });
      await updateDoc(convRef, {
        pinnedMessageId: isPinned ? messageId : null,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `conversations/${conversationId}/messages/${messageId}`);
    }
  }

  /**
   * Edits message content
   */
  async editMessage(conversationId: string, messageId: string, newText: string): Promise<void> {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    try {
      await updateDoc(msgRef, {
        text: newText,
        isEdited: true,
        editedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `conversations/${conversationId}/messages/${messageId}`);
    }
  }

  /**
   * Deletes a message from Firestore
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    try {
      await deleteDoc(msgRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `conversations/${conversationId}/messages/${messageId}`);
    }
  }

  cleanup() {
    if (this.usersUnsub) this.usersUnsub();
    if (this.conversationsUnsub) this.conversationsUnsub();
    if (this.messagesUnsub) this.messagesUnsub();
  }
}

export const firestoreMessengerService = new FirestoreMessengerService();
