import React, { useState } from 'react';
import { ChatSession, ChatMessage, UserProfile, MediaType } from '../../types';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatViewProps {
  chat: ChatSession;
  otherUser: UserProfile | null;
  messages: ChatMessage[];
  currentUser: UserProfile | null;
  onBack: () => void;
  onSendMessage: (params: {
    text: string;
    mediaType?: MediaType;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    audioDuration?: number;
    replyTo?: ChatMessage | null;
    customBurnSeconds?: number;
  }) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onDeleteMessage: (msgId: string) => void;
  onSetSelfDestructTimer: (seconds: number) => void;
  onOpenVerification: () => void;
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
  onViewMedia: (url: string, fileName?: string) => void;
  darkMode: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  chat,
  otherUser,
  messages,
  currentUser,
  onBack,
  onSendMessage,
  onToggleReaction,
  onDeleteMessage,
  onSetSelfDestructTimer,
  onOpenVerification,
  onStartVoiceCall,
  onStartVideoCall,
  onViewMedia,
  darkMode,
}) => {
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${
      darkMode ? 'bg-[#0e1621]' : 'bg-slate-50'
    }`}>
      {/* Header */}
      <ChatHeader
        chat={chat}
        otherUser={otherUser}
        onBack={onBack}
        onOpenVerification={onOpenVerification}
        onStartVoiceCall={onStartVoiceCall}
        onStartVideoCall={onStartVideoCall}
        onSetSelfDestructTimer={onSetSelfDestructTimer}
        darkMode={darkMode}
      />

      {/* Message history */}
      <MessageList
        messages={messages}
        chat={chat}
        currentUser={currentUser}
        onReply={(msg) => setReplyingTo(msg)}
        onDelete={onDeleteMessage}
        onToggleReaction={onToggleReaction}
        onViewMedia={onViewMedia}
        darkMode={darkMode}
      />

      {/* Input bar */}
      <MessageInput
        onSendMessage={onSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        chatBurnTimer={chat.selfDestructTimer || 0}
        isE2EE={chat.isE2EE}
        darkMode={darkMode}
      />
    </div>
  );
};
