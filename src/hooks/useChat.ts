import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  arrayUnion, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  ChatSession, 
  ChatMessage, 
  UserProfile, 
  MediaType 
} from '../types';
import { 
  StoredKeyPair, 
  deriveSharedKey, 
  deriveChannelKey, 
  encryptText, 
  decryptText 
} from '../lib/crypto';
import { soundManager } from '../lib/audio';
import { showPushNotification } from '../lib/notifications';

export function useChat(currentUser: UserProfile | null, userKeys: StoredKeyPair | null) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Cache for derived CryptoKeys (chatId or recipientUid -> CryptoKey)
  const [cryptoKeyCache] = useState<Map<string, CryptoKey>>(new Map());

  // Listen to all users (for creating chats & getting public keys)
  useEffect(() => {
    if (!currentUser) return;
    const q = collection(db, 'users');
    const unsub = onSnapshot(q, (snapshot) => {
      const usersList: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        usersList.push(docSnap.data() as UserProfile);
      });
      setAllUsers(usersList);
    });
    return () => unsub();
  }, [currentUser]);

  // Listen to user's chats
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      setLoadingChats(false);
      return;
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsList: ChatSession[] = [];
      snapshot.forEach((docSnap) => {
        chatsList.push({ id: docSnap.id, ...docSnap.data() } as ChatSession);
      });
      // Sort in-memory to prevent complex composite index requirements
      chatsList.sort((a, b) => {
        const timeA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : new Date(a.createdAt).getTime();
        const timeB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      setChats(chatsList);
      setLoadingChats(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === activeChatId) || null;
  }, [chats, activeChatId]);

  // Recipient user in 1-on-1 direct chat
  const otherParticipant = useMemo(() => {
    if (!activeChat || activeChat.type !== 'direct' || !currentUser) return null;
    const otherId = activeChat.participantIds.find((id) => id !== currentUser.uid);
    return allUsers.find((u) => u.uid === otherId) || null;
  }, [activeChat, currentUser, allUsers]);

  // Derive encryption key for the active conversation
  const getOrDeriveKey = useCallback(async (chat: ChatSession): Promise<CryptoKey | null> => {
    if (!userKeys) return null;

    if (cryptoKeyCache.has(chat.id)) {
      return cryptoKeyCache.get(chat.id)!;
    }

    try {
      if (chat.type === 'direct' && currentUser) {
        const otherId = chat.participantIds.find((id) => id !== currentUser.uid);
        const otherUser = allUsers.find((u) => u.uid === otherId);
        if (otherUser && otherUser.publicKey) {
          const otherJWK = JSON.parse(otherUser.publicKey);
          const sharedKey = await deriveSharedKey(userKeys.privateKeyJWK, otherJWK);
          cryptoKeyCache.set(chat.id, sharedKey);
          return sharedKey;
        }
      }
      // Group chat or fallback: derive deterministic PBKDF2 channel key
      const channelKey = await deriveChannelKey(chat.id);
      cryptoKeyCache.set(chat.id, channelKey);
      return channelKey;
    } catch (err) {
      console.warn('Failed to derive encryption key', err);
      return null;
    }
  }, [userKeys, currentUser, allUsers, cryptoKeyCache]);

  // Listen to messages for active chat and decrypt them
  useEffect(() => {
    if (!activeChatId || !currentUser) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const messagesQuery = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      const rawMessages: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        rawMessages.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
      });

      // Find encryption key for decryption
      const chat = chats.find(c => c.id === activeChatId);
      const encryptionKey = chat ? await getOrDeriveKey(chat) : null;

      const processed: (ChatMessage | null)[] = await Promise.all(
        rawMessages.map(async (msg) => {
          // Check self-destruct expiry
          if (msg.expiresAt) {
            const expiryTime = new Date(msg.expiresAt).getTime();
            if (Date.now() >= expiryTime) {
              // Delete permanently from Firestore
              deleteDoc(doc(db, 'chats', activeChatId, 'messages', msg.id)).catch(() => {});
              soundManager.playBurn();
              return null;
            }
          }

          // Mark read by current user if not already
          if (msg.senderId !== currentUser.uid && (!msg.readBy || !msg.readBy.includes(currentUser.uid))) {
            updateDoc(doc(db, 'chats', activeChatId, 'messages', msg.id), {
              readBy: arrayUnion(currentUser.uid)
            }).catch(() => {});
          }

          // Decrypt if encrypted
          if (msg.isEncrypted && msg.ciphertext && msg.iv) {
            if (encryptionKey) {
              try {
                const decrypted = await decryptText(msg.ciphertext, msg.iv, encryptionKey);
                return { ...msg, decryptedText: decrypted };
              } catch {
                return { ...msg, decryptionFailed: true, decryptedText: '🔒 Encrypted message' };
              }
            } else {
              return { ...msg, decryptedText: '🔒 Encrypted (awaiting recipient key exchange)' };
            }
          }
          return msg;
        })
      );

      const validMessages: ChatMessage[] = processed.filter(
        (m): m is ChatMessage => m !== null
      );
      
      // Play received sound if last message was from someone else
      if (validMessages.length > 0) {
        const last = validMessages[validMessages.length - 1];
        if (last && last.senderId !== currentUser.uid && (!last.readBy || !last.readBy.includes(currentUser.uid))) {
          soundManager.playReceived();
          showPushNotification(
            last.senderName || 'TeleCrypt',
            last.decryptedText || last.text || 'New message received'
          );
        }
      }

      setMessages(validMessages);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [activeChatId, currentUser, chats, getOrDeriveKey]);

  // Send message
  const sendMessage = async (params: {
    text: string;
    mediaType?: MediaType;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    audioDuration?: number;
    replyTo?: ChatMessage | null;
    customBurnSeconds?: number;
  }) => {
    if (!activeChat || !currentUser) return;
    const { 
      text, 
      mediaType = 'text', 
      fileUrl, 
      fileName, 
      fileSize, 
      audioDuration,
      replyTo,
      customBurnSeconds 
    } = params;

    if (!text.trim() && !fileUrl) return;

    try {
      const burnDuration = customBurnSeconds ?? activeChat.selfDestructTimer ?? 0;
      let expiresAt: string | undefined = undefined;
      if (burnDuration > 0) {
        expiresAt = new Date(Date.now() + burnDuration * 1000).toISOString();
      }

      let ciphertext: string | undefined = undefined;
      let iv: string | undefined = undefined;
      const isEncrypted = activeChat.isE2EE;

      if (isEncrypted) {
        const encKey = await getOrDeriveKey(activeChat);
        if (encKey && text) {
          const encResult = await encryptText(text, encKey);
          ciphertext = encResult.ciphertext;
          iv = encResult.iv;
        }
      }

      const messagePayload: Omit<ChatMessage, 'id'> = {
        chatId: activeChat.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL,
        text: isEncrypted ? '🔒 End-to-end encrypted message' : text,
        ciphertext,
        iv,
        isEncrypted,
        mediaType,
        fileUrl,
        fileName,
        fileSize,
        audioDuration,
        replyToId: replyTo?.id,
        replyToSnippet: replyTo?.decryptedText || replyTo?.text || replyTo?.fileName,
        replyToSender: replyTo?.senderName,
        selfDestructDuration: burnDuration > 0 ? burnDuration : undefined,
        expiresAt,
        reactions: {},
        readBy: [currentUser.uid],
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), messagePayload);

      // Update parent chat summary
      const snippet = mediaType === 'audio' 
        ? '🎤 Voice message' 
        : mediaType === 'image' 
        ? '📷 Photo' 
        : mediaType === 'file' 
        ? `📎 ${fileName || 'Attachment'}` 
        : isEncrypted 
        ? '🔒 Encrypted message' 
        : text.slice(0, 80);

      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessageSnippet: snippet,
        lastMessageTimestamp: new Date().toISOString(),
        lastMessageSenderId: currentUser.uid,
        updatedAt: serverTimestamp()
      });

      soundManager.playSent();
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Toggle Reaction
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!activeChatId || !currentUser) return;
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const currentReactions = { ...(msg.reactions || {}) };
    const usersWhoReacted = currentReactions[emoji] || [];

    if (usersWhoReacted.includes(currentUser.uid)) {
      currentReactions[emoji] = usersWhoReacted.filter(id => id !== currentUser.uid);
      if (currentReactions[emoji].length === 0) {
        delete currentReactions[emoji];
      }
    } else {
      currentReactions[emoji] = [...usersWhoReacted, currentUser.uid];
    }

    try {
      await updateDoc(doc(db, 'chats', activeChatId, 'messages', messageId), {
        reactions: currentReactions
      });
    } catch (e) {
      console.warn('Failed to update reaction', e);
    }
  };

  // Delete message (shred)
  const deleteMessage = async (messageId: string) => {
    if (!activeChatId) return;
    try {
      await deleteDoc(doc(db, 'chats', activeChatId, 'messages', messageId));
      soundManager.playBurn();
    } catch (e) {
      console.warn('Failed to delete message', e);
    }
  };

  // Update self-destruct timer for the chat
  const setChatSelfDestructTimer = async (seconds: number) => {
    if (!activeChatId) return;
    try {
      await updateDoc(doc(db, 'chats', activeChatId), {
        selfDestructTimer: seconds
      });
    } catch (e) {
      console.warn('Failed to update self destruct timer', e);
    }
  };

  // Create Direct Chat
  const createDirectChat = async (targetUser: UserProfile) => {
    if (!currentUser) return null;
    
    // Check if direct chat already exists
    const existing = chats.find(c => 
      c.type === 'direct' && 
      c.participantIds.includes(targetUser.uid) && 
      c.participantIds.includes(currentUser.uid)
    );

    if (existing) {
      setActiveChatId(existing.id);
      return existing.id;
    }

    const newChat: Omit<ChatSession, 'id'> = {
      type: 'direct',
      creatorId: currentUser.uid,
      participantIds: [currentUser.uid, targetUser.uid],
      name: targetUser.displayName,
      photoURL: targetUser.photoURL,
      isE2EE: true,
      selfDestructTimer: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'chats'), newChat);
    setActiveChatId(docRef.id);
    return docRef.id;
  };

  // Create Group Chat
  const createGroupChat = async (groupName: string, memberUids: string[], photoURL?: string) => {
    if (!currentUser) return null;
    const allParticipants = Array.from(new Set([currentUser.uid, ...memberUids]));

    const newGroup: Omit<ChatSession, 'id'> = {
      type: 'group',
      name: groupName,
      creatorId: currentUser.uid,
      participantIds: allParticipants,
      photoURL: photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName)}`,
      isE2EE: true,
      selfDestructTimer: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'chats'), newGroup);
    setActiveChatId(docRef.id);
    return docRef.id;
  };

  return {
    chats,
    activeChat,
    activeChatId,
    setActiveChatId,
    otherParticipant,
    messages,
    loadingChats,
    loadingMessages,
    allUsers,
    sendMessage,
    toggleReaction,
    deleteMessage,
    setChatSelfDestructTimer,
    createDirectChat,
    createGroupChat
  };
}
