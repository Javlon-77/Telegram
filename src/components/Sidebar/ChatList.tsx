import React from 'react';
import { Shield, Users, Clock, Flame, Check, CheckCheck } from 'lucide-react';
import { ChatSession, UserProfile } from '../../types';

interface ChatListProps {
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  darkMode: boolean;
  searchQuery: string;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  currentUser,
  allUsers,
  darkMode,
  searchQuery,
}) => {
  // Format message timestamp
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Resolve chat metadata
  const getChatDisplay = (chat: ChatSession) => {
    if (chat.type === 'direct' && currentUser) {
      const otherId = chat.participantIds.find((id) => id !== currentUser.uid);
      const otherUser = allUsers.find((u) => u.uid === otherId);
      return {
        title: otherUser?.displayName || chat.name || 'Private Contact',
        photo: otherUser?.photoURL || chat.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${otherId}`,
        isOnline: otherUser?.status === 'online',
        username: otherUser?.username,
      };
    }
    return {
      title: chat.name || 'Group Chat',
      photo: chat.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.id}`,
      isOnline: false,
      username: undefined,
    };
  };

  const filteredChats = chats.filter((chat) => {
    const meta = getChatDisplay(chat);
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      meta.title.toLowerCase().includes(q) ||
      (chat.lastMessageSnippet && chat.lastMessageSnippet.toLowerCase().includes(q))
    );
  });

  if (filteredChats.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
          darkMode ? 'bg-[#242f3d] text-slate-400' : 'bg-slate-100 text-slate-400'
        }`}>
          <Shield className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-semibold mb-1">No chats found</h3>
        <p className="text-xs text-slate-400 max-w-[200px]">
          {searchQuery ? 'Try a different search term' : 'Start a private encrypted chat or group with the + button'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-transparent select-none">
      {filteredChats.map((chat) => {
        const { title, photo, isOnline } = getChatDisplay(chat);
        const isActive = chat.id === activeChatId;

        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full p-3 flex items-center gap-3 transition-colors text-left relative ${
              isActive
                ? darkMode
                  ? 'bg-[#2b5278] text-white'
                  : 'bg-sky-50 text-slate-900 border-l-2 border-sky-500'
                : darkMode
                  ? 'hover:bg-[#202b36] text-slate-200'
                  : 'hover:bg-slate-50 text-slate-800'
            }`}
          >
            {/* Avatar with presence */}
            <div className="relative shrink-0">
              <img
                src={photo}
                alt={title}
                className="w-12 h-12 rounded-full object-cover bg-slate-700 ring-1 ring-black/10"
              />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#17212b] rounded-full" />
              )}
            </div>

            {/* Chat info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h4 className="text-sm font-semibold truncate leading-tight">
                    {title}
                  </h4>
                  {chat.isE2EE && (
                    <span title="End-to-End Encrypted">
                      <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    </span>
                  )}
                  {chat.type === 'group' && (
                    <span title="Group Chat">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-mono shrink-0 ${
                  isActive ? 'text-sky-200' : 'text-slate-400'
                }`}>
                  {formatTime(chat.lastMessageTimestamp || chat.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs truncate ${
                  isActive ? 'text-sky-100' : 'text-slate-400'
                }`}>
                  {chat.lastMessageSenderId === currentUser?.uid && (
                    <span className="mr-1 inline-flex">
                      <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />
                    </span>
                  )}
                  {chat.lastMessageSnippet || 'No messages yet'}
                </p>

                {chat.selfDestructTimer > 0 && (
                  <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-amber-400 font-mono" title={`Auto-delete: ${chat.selfDestructTimer}s`}>
                    <Flame className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
