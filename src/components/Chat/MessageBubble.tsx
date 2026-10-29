import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Flame, 
  Check, 
  CheckCheck, 
  FileText, 
  Reply, 
  Trash2, 
  Smile, 
  Lock 
} from 'lucide-react';
import { ChatMessage, UserProfile } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  currentUser: UserProfile | null;
  onReply: (msg: ChatMessage) => void;
  onDelete: (msgId: string) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onViewMedia: (url: string, fileName?: string) => void;
  darkMode: boolean;
}

const COMMON_REACTIONS = ['👍', '❤️', '🔥', '😂', '😮', '👏'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  currentUser,
  onReply,
  onDelete,
  onToggleReaction,
  onViewMedia,
  darkMode,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Self-destruct countdown timer
  useEffect(() => {
    if (!message.expiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const remainingMs = new Date(message.expiresAt!).getTime() - Date.now();
      const sec = Math.max(0, Math.ceil(remainingMs / 1000));
      setSecondsRemaining(sec);
      if (sec <= 0) {
        onDelete(message.id);
      }
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [message.expiresAt, message.id, onDelete]);

  // Audio note playback
  const togglePlayAudio = () => {
    if (!message.fileUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(message.fileUrl);
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current && audioRef.current.duration) {
          setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      };
      audioRef.current.onended = () => {
        setIsPlayingAudio(false);
        setAudioProgress(0);
      };
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => console.warn('Audio playback error', err));
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatMessageTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const displayText = message.decryptedText || message.text || '';
  const isRead = message.readBy && message.readBy.length > 1;

  return (
    <div className={`group flex flex-col my-1 relative ${isMine ? 'items-end' : 'items-start'}`}>
      {/* Sender name for group chats if not mine */}
      {!isMine && (
        <span className="text-[11px] font-semibold text-sky-400 mb-0.5 ml-3">
          {message.senderName}
        </span>
      )}

      {/* Main Bubble Container */}
      <div className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm transition-all text-sm leading-relaxed ${
        isMine
          ? darkMode
            ? 'bg-[#2b5278] text-white rounded-br-sm'
            : 'bg-sky-600 text-white rounded-br-sm'
          : darkMode
            ? 'bg-[#182533] text-slate-100 rounded-bl-sm border border-[#242f3d]'
            : 'bg-white text-slate-900 rounded-bl-sm border border-slate-200'
      }`}>
        {/* Reply Quoted Preview */}
        {message.replyToSnippet && (
          <div className={`mb-2 pl-2.5 py-1 text-xs border-l-2 rounded-sm ${
            isMine 
              ? 'border-sky-300 bg-sky-900/30 text-sky-100' 
              : darkMode 
              ? 'border-sky-500 bg-[#202d3c] text-sky-300' 
              : 'border-sky-500 bg-slate-100 text-slate-700'
          }`}>
            <span className="font-semibold block text-[11px]">{message.replyToSender || 'Message'}</span>
            <span className="truncate block opacity-90">{message.replyToSnippet}</span>
          </div>
        )}

        {/* Media: Image */}
        {message.mediaType === 'image' && message.fileUrl && (
          <div className="mb-2 rounded-xl overflow-hidden cursor-pointer" onClick={() => onViewMedia(message.fileUrl!, message.fileName)}>
            <img 
              src={message.fileUrl} 
              alt={message.fileName || 'Photo'} 
              className="max-h-72 w-full object-cover rounded-xl hover:opacity-95 transition-opacity" 
            />
          </div>
        )}

        {/* Media: Audio Voice Note */}
        {message.mediaType === 'audio' && message.fileUrl && (
          <div className="flex items-center gap-3 py-1 min-w-[200px]">
            <button
              onClick={togglePlayAudio}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm ${
                isMine ? 'bg-white text-sky-700' : 'bg-sky-500 text-white'
              }`}
            >
              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex-1 flex flex-col gap-1">
              {/* Waveform visualization bars */}
              <div className="flex items-center gap-0.5 h-6">
                {[12, 24, 16, 28, 20, 14, 22, 10, 26, 18, 12, 20, 16].map((height, idx) => {
                  const barProgress = (idx / 13) * 100;
                  const isPassed = audioProgress >= barProgress;
                  return (
                    <div
                      key={idx}
                      className={`w-1 rounded-full transition-colors ${
                        isPassed 
                          ? isMine ? 'bg-white' : 'bg-sky-400' 
                          : isMine ? 'bg-sky-300/40' : 'bg-slate-500/40'
                      }`}
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] font-mono opacity-80">
                {message.audioDuration ? `${Math.floor(message.audioDuration)}s` : 'Voice note'}
              </span>
            </div>
          </div>
        )}

        {/* Media: File / Document */}
        {message.mediaType === 'file' && message.fileUrl && (
          <div className={`flex items-center gap-3 p-2.5 rounded-xl mb-2 ${
            isMine ? 'bg-sky-800/40' : darkMode ? 'bg-[#202d3c]' : 'bg-slate-100'
          }`}>
            <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{message.fileName || 'Attachment'}</div>
              <div className="text-[10px] opacity-70 font-mono">{formatFileSize(message.fileSize)}</div>
            </div>
            <a
              href={message.fileUrl}
              download={message.fileName || 'file'}
              className="p-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-colors shrink-0"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Message Text */}
        {displayText && (
          <p className="whitespace-pre-wrap break-words selection:bg-sky-400 selection:text-white">
            {displayText}
          </p>
        )}

        {/* Bottom Metadata: Burn timer, Timestamp, Status checks */}
        <div className={`flex items-center justify-end gap-1.5 mt-1 text-[11px] font-mono select-none ${
          isMine ? 'text-sky-200' : 'text-slate-400'
        }`}>
          {/* Self-destruct flame countdown */}
          {secondsRemaining !== null && (
            <span className="flex items-center gap-0.5 text-amber-400 font-bold bg-amber-950/40 px-1 rounded animate-pulse" title="Self-destruct timer">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>{secondsRemaining}s</span>
            </span>
          )}

          {message.isEncrypted && (
            <span title="E2EE Encrypted">
              <Lock className="w-3 h-3 text-sky-300 shrink-0" />
            </span>
          )}

          <span>{formatMessageTime(message.createdAt)}</span>

          {isMine && (
            <span title={isRead ? 'Read' : 'Delivered'}>
              {isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
              ) : (
                <Check className="w-3.5 h-3.5 opacity-80" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Emoji Reactions Pill */}
      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {Object.entries(message.reactions).map(([emoji, userIds]) => {
            if (!userIds || userIds.length === 0) return null;
            const hasReacted = currentUser && userIds.includes(currentUser.uid);
            return (
              <button
                key={emoji}
                onClick={() => onToggleReaction(message.id, emoji)}
                className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all ${
                  hasReacted
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : darkMode
                    ? 'bg-[#1e2a38] text-slate-300 border border-[#2c3d50] hover:bg-[#253546]'
                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-mono font-medium">{userIds.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Hover action toolbar */}
      <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10 ${
        isMine ? '-left-20' : '-right-20'
      }`}>
        <div className={`rounded-xl shadow-lg border p-1 flex items-center gap-0.5 ${
          darkMode ? 'bg-[#1e2a38] border-[#2c3d50]' : 'bg-white border-slate-200'
        }`}>
          {/* Reaction trigger */}
          <div className="relative">
            <button
              onClick={() => setShowReactionMenu(!showReactionMenu)}
              className="p-1.5 rounded-lg hover:bg-slate-700/30 text-slate-400 hover:text-amber-400 transition-colors"
              title="React"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {showReactionMenu && (
              <div className={`absolute top-8 left-0 p-1.5 rounded-xl shadow-2xl border flex items-center gap-1.5 z-30 ${
                darkMode ? 'bg-[#182533] border-[#242f3d]' : 'bg-white border-slate-200'
              }`}>
                {COMMON_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onToggleReaction(message.id, emoji);
                      setShowReactionMenu(false);
                    }}
                    className="w-7 h-7 flex items-center justify-center text-sm hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply */}
          <button
            onClick={() => onReply(message)}
            className="p-1.5 rounded-lg hover:bg-slate-700/30 text-slate-400 hover:text-sky-400 transition-colors"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {/* Shred / Delete */}
          {(isMine || message.senderId === currentUser?.uid) && (
            <button
              onClick={() => onDelete(message.id)}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
              title="Delete & Shred for everyone"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
