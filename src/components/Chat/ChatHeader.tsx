import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  ShieldCheck, 
  Flame, 
  MoreVertical, 
  Users, 
  Trash2,
  Lock
} from 'lucide-react';
import { ChatSession, UserProfile } from '../../types';

interface ChatHeaderProps {
  chat: ChatSession;
  otherUser: UserProfile | null;
  onBack: () => void;
  onOpenVerification: () => void;
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
  onSetSelfDestructTimer: (seconds: number) => void;
  darkMode: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  otherUser,
  onBack,
  onOpenVerification,
  onStartVoiceCall,
  onStartVideoCall,
  onSetSelfDestructTimer,
  darkMode,
}) => {
  const [showBurnMenu, setShowBurnMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const title = chat.type === 'direct' ? (otherUser?.displayName || 'Direct Chat') : (chat.name || 'Group');
  const photo = chat.type === 'direct' 
    ? (otherUser?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${chat.id}`)
    : (chat.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.id}`);

  const statusSubtitle = chat.type === 'direct' 
    ? (otherUser?.status === 'online' ? 'online' : `last seen recently · @${otherUser?.username || 'user'}`)
    : `${chat.participantIds.length} members`;

  const timerOptions = [
    { label: 'Off', seconds: 0 },
    { label: '5 sec', seconds: 5 },
    { label: '10 sec', seconds: 10 },
    { label: '30 sec', seconds: 30 },
    { label: '1 min', seconds: 60 },
    { label: '1 hour', seconds: 3600 },
    { label: '1 day', seconds: 86400 },
  ];

  return (
    <div className={`h-16 px-4 border-b flex items-center justify-between gap-3 shrink-0 select-none relative ${
      darkMode ? 'bg-[#17212b] border-[#242f3d]' : 'bg-white border-slate-200'
    }`}>
      {/* Left: Mobile back button + User info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className={`md:hidden p-1.5 rounded-lg ${
            darkMode ? 'hover:bg-[#242f3d] text-slate-300' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title="Back to chats"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative shrink-0">
          <img
            src={photo}
            alt={title}
            className="w-10 h-10 rounded-full object-cover bg-slate-700 ring-1 ring-black/10"
          />
          {chat.type === 'direct' && otherUser?.status === 'online' && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#17212b] rounded-full" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold truncate leading-snug">{title}</h3>
            {chat.isE2EE && (
              <span className="inline-flex items-center text-sky-400 text-xs" title="End-to-End Encrypted">
                <Lock className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <p className={`text-xs truncate ${
            chat.type === 'direct' && otherUser?.status === 'online' 
              ? 'text-sky-400 font-medium' 
              : 'text-slate-400'
          }`}>
            {statusSubtitle}
          </p>
        </div>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* E2EE Safety Number & Verification Key */}
        {chat.isE2EE && (
          <button
            onClick={onOpenVerification}
            title="Verify E2EE Safety Number & Encryption Keys"
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors ${
              darkMode 
                ? 'bg-sky-950/60 text-sky-300 hover:bg-sky-900/60 border border-sky-800/40' 
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Encrypted</span>
          </button>
        )}

        {/* Self-Destruct Timer Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowBurnMenu(!showBurnMenu)}
            title="Self-Destruct Messages Timer"
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
              chat.selfDestructTimer > 0 
                ? 'text-amber-400 bg-amber-500/10' 
                : darkMode ? 'text-slate-400 hover:text-white hover:bg-[#242f3d]' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-4 h-4" />
            {chat.selfDestructTimer > 0 && (
              <span className="text-[10px] font-mono font-bold">
                {chat.selfDestructTimer < 60 
                  ? `${chat.selfDestructTimer}s` 
                  : chat.selfDestructTimer < 3600 
                  ? `${Math.floor(chat.selfDestructTimer / 60)}m` 
                  : `${Math.floor(chat.selfDestructTimer / 3600)}h`}
              </span>
            )}
          </button>

          {showBurnMenu && (
            <div className={`absolute right-0 top-12 w-48 rounded-xl shadow-xl border p-1 z-30 ${
              darkMode ? 'bg-[#1e2a38] border-[#2f3f50] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="px-3 py-1.5 text-[11px] font-medium text-slate-400 border-b border-slate-700/30">
                Self-Destruct Timer
              </div>
              {timerOptions.map((opt) => (
                <button
                  key={opt.seconds}
                  onClick={() => {
                    onSetSelfDestructTimer(opt.seconds);
                    setShowBurnMenu(false);
                  }}
                  className={`w-full px-3 py-1.5 text-xs text-left rounded-lg transition-colors flex items-center justify-between ${
                    chat.selfDestructTimer === opt.seconds
                      ? 'bg-sky-500 text-white font-semibold'
                      : darkMode ? 'hover:bg-[#253546]' : 'hover:bg-slate-100'
                  }`}
                >
                  <span>{opt.label}</span>
                  {chat.selfDestructTimer === opt.seconds && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Voice Call */}
        {chat.type === 'direct' && (
          <button
            onClick={onStartVoiceCall}
            title="Start E2EE Voice Call"
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'text-slate-300 hover:text-white hover:bg-[#242f3d]' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Phone className="w-4 h-4" />
          </button>
        )}

        {/* Video Call */}
        {chat.type === 'direct' && (
          <button
            onClick={onStartVideoCall}
            title="Start E2EE Video Call"
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'text-slate-300 hover:text-white hover:bg-[#242f3d]' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Video className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
