import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Flame } from 'lucide-react';
import { ChatMessage, UserProfile, ChatSession } from '../../types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  chat: ChatSession;
  currentUser: UserProfile | null;
  onReply: (msg: ChatMessage) => void;
  onDelete: (msgId: string) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onViewMedia: (url: string, fileName?: string) => void;
  darkMode: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  chat,
  currentUser,
  onReply,
  onDelete,
  onToggleReaction,
  onViewMedia,
  darkMode,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Date divider formatting
  const formatDateLabel = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Today';
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className={`flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1 ${
      darkMode ? 'bg-[#0e1621]' : 'bg-slate-50/70'
    }`}>
      {/* Telegram Secret / E2EE Info Card */}
      {chat.isE2EE && (
        <div className="mx-auto my-4 max-w-md p-4 rounded-2xl bg-[#17212b]/80 border border-sky-900/40 text-center shadow-sm backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 mx-auto flex items-center justify-center mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-semibold text-sky-300 uppercase tracking-wider mb-1">
            End-to-End Encrypted Session
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed mb-2">
            Messages and media in this chat are encrypted on your device using ECDH P-256 and AES-256-GCM.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-slate-700/40 pt-2 text-left">
            <span className="flex items-center gap-1">🔒 Zero-knowledge keys</span>
            <span className="flex items-center gap-1">🔥 Self-destruct support</span>
            <span className="flex items-center gap-1">⚡ Instant WebRTC calling</span>
            <span className="flex items-center gap-1">📱 Multi-device sync</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <p className="text-sm font-medium">No messages yet</p>
          <p className="text-xs opacity-75 mt-1 max-w-xs">
            Send a message, voice note, or photo to start your encrypted conversation.
          </p>
        </div>
      )}

      {/* Message history */}
      {messages.map((msg, idx) => {
        const isMine = msg.senderId === currentUser?.uid;
        const prevMsg = messages[idx - 1];
        const isNewDay = !prevMsg || 
          new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

        return (
          <React.Fragment key={msg.id}>
            {isNewDay && (
              <div className="flex items-center justify-center my-3">
                <span className={`px-3 py-1 rounded-full text-[11px] font-medium shadow-sm ${
                  darkMode ? 'bg-[#182533] text-slate-300 border border-[#242f3d]' : 'bg-white text-slate-600 border border-slate-200'
                }`}>
                  {formatDateLabel(msg.createdAt)}
                </span>
              </div>
            )}
            <MessageBubble
              message={msg}
              isMine={isMine}
              currentUser={currentUser}
              onReply={onReply}
              onDelete={onDelete}
              onToggleReaction={onToggleReaction}
              onViewMedia={onViewMedia}
              darkMode={darkMode}
            />
          </React.Fragment>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
};
