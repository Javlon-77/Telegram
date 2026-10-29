/**
 * Data structures and types for TeleCrypt - Telegram-like E2EE Messenger
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  username?: string;
  bio?: string;
  publicKey?: string; // Exported ECDH public key (JWK string)
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
  createdAt?: string;
}

export type ChatType = 'direct' | 'group';

export interface ChatSession {
  id: string;
  type: ChatType;
  name?: string;
  photoURL?: string;
  creatorId: string;
  participantIds: string[];
  lastMessageSnippet?: string;
  lastMessageTimestamp?: string;
  lastMessageSenderId?: string;
  isE2EE: boolean;
  selfDestructTimer: number; // in seconds (0 = disabled)
  createdAt: string;
  updatedAt: string;
}

export type MediaType = 'text' | 'image' | 'audio' | 'file';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text?: string;
  ciphertext?: string; // AES-GCM ciphertext in base64
  iv?: string; // Initialization vector in base64
  isEncrypted: boolean;
  mediaType: MediaType;
  fileUrl?: string; // Base64 data URL or storage URL
  fileName?: string;
  fileSize?: number;
  audioDuration?: number; // Voice message duration in seconds
  replyToId?: string;
  replyToSnippet?: string;
  replyToSender?: string;
  selfDestructDuration?: number; // seconds
  expiresAt?: string; // ISO string when it should be permanently deleted
  reactions?: Record<string, string[]>; // emoji -> array of user uids
  readBy?: string[]; // array of user uids who read the message
  createdAt: string;
  // Local transient state for encryption decryption status
  decryptedText?: string;
  decryptionFailed?: boolean;
}

export interface CallSession {
  id: string;
  chatId: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  receiverId: string;
  type: 'audio' | 'video';
  status: 'calling' | 'active' | 'ended' | 'declined';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt: string;
  endedAt?: string;
}

export interface IceCandidatePayload {
  id: string;
  senderId: string;
  candidate: RTCIceCandidateInit;
  createdAt: string;
}

export interface CryptoKeyPairExport {
  publicKeyJWK: string;
  privateKeyJWK: string;
  fingerprint: string;
  emojis: string[];
}
