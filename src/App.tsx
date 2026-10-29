import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  MessageSquare, 
  Lock, 
  Flame, 
  Phone, 
  Users, 
  Plus, 
  Search,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { useWebRTC } from './hooks/useWebRTC';
import { FoldersRail, FolderTab } from './components/Sidebar/FoldersRail';
import { SidebarHeader } from './components/Sidebar/SidebarHeader';
import { ChatList } from './components/Sidebar/ChatList';
import { ChatView } from './components/Chat/ChatView';
import { AuthScreen } from './components/Auth/AuthScreen';
import { CallModal } from './components/Modals/CallModal';
import { E2EEVerificationModal } from './components/Modals/E2EEVerificationModal';
import { NewChatModal } from './components/Modals/NewChatModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { MediaViewerModal } from './components/Modals/MediaViewerModal';
import { OfflineBanner } from './components/Common/OfflineBanner';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('telecrypt_dark_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const [currentFolderTab, setCurrentFolderTab] = useState<FolderTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [viewingMediaUrl, setViewingMediaUrl] = useState<string | null>(null);
  const [viewingMediaName, setViewingMediaName] = useState<string | undefined>(undefined);

  // Sync dark mode to localStorage and html tag
  useEffect(() => {
    localStorage.setItem('telecrypt_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth Hook
  const {
    currentUser,
    userProfile,
    keyPair,
    loading: authLoading,
    authError,
    signInWithGoogle,
    signInAsDemo,
    logout,
    updateProfileData,
  } = useAuth();

  // Chat Hook
  const {
    chats,
    activeChat,
    activeChatId,
    setActiveChatId,
    otherParticipant,
    messages,
    allUsers,
    sendMessage,
    toggleReaction,
    deleteMessage,
    setChatSelfDestructTimer,
    createDirectChat,
    createGroupChat,
  } = useChat(userProfile, keyPair);

  // WebRTC Hook
  const {
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    callDuration,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useWebRTC(userProfile);

  // Filter chats by current folder tab
  const tabFilteredChats = chats.filter((c) => {
    if (currentFolderTab === 'all') return true;
    if (currentFolderTab === 'direct') return c.type === 'direct';
    if (currentFolderTab === 'groups') return c.type === 'group';
    if (currentFolderTab === 'e2ee') return c.isE2EE;
    return true;
  });

  const unreadCounts = {
    all: chats.filter(c => (c.lastMessageSenderId && c.lastMessageSenderId !== userProfile?.uid)).length,
    direct: chats.filter(c => c.type === 'direct').length,
    groups: chats.filter(c => c.type === 'group').length,
    e2ee: chats.filter(c => c.isE2EE).length,
  };

  // Quick Seed: Start instant chat if no chats exist
  const handleQuickSeedChat = async () => {
    if (!userProfile) return;
    const targetUser = allUsers.find(u => u.uid !== userProfile.uid);
    if (targetUser) {
      await createDirectChat(targetUser);
    } else {
      // Create a demo contact and chat
      await createGroupChat('Telegram Security Ops', [userProfile.uid]);
    }
  };

  if (authLoading) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-[#0e1621] text-white' : 'bg-slate-100 text-slate-800'}`}>
        <div className="w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center text-white font-black text-xl shadow-lg animate-pulse mb-3">
          TC
        </div>
        <p className="text-xs font-mono text-slate-400">Loading TeleCrypt secure session...</p>
      </div>
    );
  }

  if (!currentUser || !userProfile) {
    return (
      <AuthScreen
        onSignInWithGoogle={signInWithGoogle}
        onSignInAsDemo={signInAsDemo}
        authError={authError}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans antialiased ${
      darkMode ? 'bg-[#0e1621] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Offline Status Bar */}
      <OfflineBanner />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Rail (Folders) - visible on tablet and desktop */}
        <div className="hidden sm:flex">
          <FoldersRail
            currentTab={currentFolderTab}
            onSelectTab={setCurrentFolderTab}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            unreadCounts={unreadCounts}
          />
        </div>

        {/* Sidebar (Chat List & Header) - Hidden on mobile if a chat is active */}
        <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r h-full shrink-0 transition-all ${
          activeChatId ? 'hidden md:flex' : 'flex'
        } ${
          darkMode ? 'bg-[#17212b] border-[#242f3d]' : 'bg-white border-slate-200'
        }`}>
          <SidebarHeader
            currentUser={userProfile}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenNewChat={() => setIsNewChatModalOpen(true)}
            onOpenMenu={() => setIsMenuDrawerOpen(true)}
            darkMode={darkMode}
          />

          <ChatList
            chats={tabFilteredChats}
            activeChatId={activeChatId}
            onSelectChat={(id) => setActiveChatId(id)}
            currentUser={userProfile}
            allUsers={allUsers}
            darkMode={darkMode}
            searchQuery={searchQuery}
          />

          {/* Quick Start Floating Tip if chat list is empty */}
          {chats.length === 0 && (
            <div className="p-4 m-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
              <Sparkles className="w-5 h-5 text-sky-400 mx-auto mb-1.5" />
              <h4 className="text-xs font-bold text-sky-300">Ready to chat securely?</h4>
              <p className="text-[11px] text-slate-400 mt-1 mb-2.5">
                Launch a direct encrypted chat with self-destruct timers:
              </p>
              <button
                onClick={handleQuickSeedChat}
                className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Start Instant Chat
              </button>
            </div>
          )}
        </div>

        {/* Main Conversation Window */}
        <div className={`flex-1 flex flex-col h-full overflow-hidden ${
          !activeChatId ? 'hidden md:flex' : 'flex'
        }`}>
          {activeChat ? (
            <ChatView
              chat={activeChat}
              otherUser={otherParticipant}
              messages={messages}
              currentUser={userProfile}
              onBack={() => setActiveChatId(null)}
              onSendMessage={sendMessage}
              onToggleReaction={toggleReaction}
              onDeleteMessage={deleteMessage}
              onSetSelfDestructTimer={setChatSelfDestructTimer}
              onOpenVerification={() => setIsVerificationModalOpen(true)}
              onStartVoiceCall={() => otherParticipant && startCall(activeChat.id, otherParticipant, 'audio')}
              onStartVideoCall={() => otherParticipant && startCall(activeChat.id, otherParticipant, 'video')}
              onViewMedia={(url, name) => {
                setViewingMediaUrl(url);
                setViewingMediaName(name);
              }}
              darkMode={darkMode}
            />
          ) : (
            /* Telegram Empty Screen Placeholder */
            <div className={`flex-1 flex flex-col items-center justify-center p-6 text-center select-none ${
              darkMode ? 'bg-[#0e1621]' : 'bg-slate-50'
            }`}>
              <div className="w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 ring-1 ring-sky-500/20">
                <Lock className="w-10 h-10" />
              </div>
              <h2 className="text-lg font-bold mb-1">TeleCrypt Messenger</h2>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
                Select a chat from the left or create a new conversation to begin end-to-end encrypted messaging.
              </p>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-colors shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Conversation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Menu Drawer */}
      {isMenuDrawerOpen && (
        <div className="fixed inset-0 z-50 flex animate-fade-in select-none">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuDrawerOpen(false)}
          />
          <div className={`relative w-72 max-w-[80vw] h-full shadow-2xl flex flex-col justify-between p-5 z-10 ${
            darkMode ? 'bg-[#17212b] text-white border-r border-[#242f3d]' : 'bg-white text-slate-900 border-r border-slate-200'
          }`}>
            <div>
              {/* Profile Card */}
              <div className="flex items-center gap-3 pb-5 border-b border-slate-700/30">
                <img
                  src={userProfile.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userProfile.uid}`}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-sky-500"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold truncate leading-tight">{userProfile.displayName}</h4>
                  <p className="text-xs text-sky-400 font-mono truncate">@{userProfile.username || 'user'}</p>
                </div>
              </div>

              {/* Menu items */}
              <div className="mt-4 space-y-1">
                <button
                  onClick={() => {
                    setIsNewChatModalOpen(true);
                    setIsMenuDrawerOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-xs font-semibold transition-colors ${
                    darkMode ? 'hover:bg-[#202b36]' : 'hover:bg-slate-100'
                  }`}
                >
                  <Plus className="w-4 h-4 text-sky-400" />
                  <span>New Chat / Group</span>
                </button>

                <button
                  onClick={() => {
                    setIsSettingsModalOpen(true);
                    setIsMenuDrawerOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-xs font-semibold transition-colors ${
                    darkMode ? 'hover:bg-[#202b36]' : 'hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-4 h-4 text-sky-400" />
                  <span>Settings & Privacy</span>
                </button>

                <button
                  onClick={() => {
                    setDarkMode(!darkMode);
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors ${
                    darkMode ? 'hover:bg-[#202b36]' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 text-sm">🌓</span>
                    <span>Dark Mode</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{darkMode ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Logout bottom */}
            <div className="pt-4 border-t border-slate-700/30">
              <button
                onClick={() => {
                  logout();
                  setIsMenuDrawerOpen(false);
                }}
                className="w-full p-2.5 rounded-xl flex items-center gap-3 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CallModal
        activeCall={activeCall}
        incomingCall={incomingCall}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isVideoEnabled={isVideoEnabled}
        callDuration={callDuration}
        onAccept={acceptCall}
        onDecline={declineCall}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
      />

      {isVerificationModalOpen && (
        <E2EEVerificationModal
          currentUser={userProfile}
          otherUser={otherParticipant}
          onClose={() => setIsVerificationModalOpen(false)}
          darkMode={darkMode}
        />
      )}

      {isNewChatModalOpen && (
        <NewChatModal
          allUsers={allUsers}
          currentUser={userProfile}
          onSelectUser={(u) => createDirectChat(u)}
          onCreateGroup={(name, members) => createGroupChat(name, members)}
          onClose={() => setIsNewChatModalOpen(false)}
          darkMode={darkMode}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          currentUser={userProfile}
          userKeys={keyPair}
          onUpdateProfile={updateProfileData}
          onLogout={logout}
          onSignInAsDemo={signInAsDemo}
          onSignInWithGoogle={signInWithGoogle}
          onClose={() => setIsSettingsModalOpen(false)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
      )}

      <MediaViewerModal
        mediaUrl={viewingMediaUrl}
        fileName={viewingMediaName}
        onClose={() => {
          setViewingMediaUrl(null);
          setViewingMediaName(undefined);
        }}
      />
    </div>
  );
}
