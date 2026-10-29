import React, { useState } from 'react';
import { X, Search, Users, User, ShieldCheck, Plus, Check } from 'lucide-react';
import { UserProfile } from '../../types';

interface NewChatModalProps {
  allUsers: UserProfile[];
  currentUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  onCreateGroup: (name: string, members: string[]) => void;
  onClose: () => void;
  darkMode: boolean;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  allUsers,
  currentUser,
  onSelectUser,
  onCreateGroup,
  onClose,
  darkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');
  const [search, setSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedMemberUids, setSelectedMemberUids] = useState<string[]>([]);

  const eligibleUsers = allUsers.filter(u => u.uid !== currentUser?.uid);

  const filteredUsers = eligibleUsers.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.displayName.toLowerCase().includes(q) || (u.username && u.username.toLowerCase().includes(q));
  });

  const toggleSelectMember = (uid: string) => {
    setSelectedMemberUids(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMemberUids.length === 0) return;
    onCreateGroup(groupName.trim(), selectedMemberUids);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
        darkMode ? 'bg-[#17212b] border-[#242f3d] text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Top */}
        <div className="p-4 border-b border-slate-700/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold">New Conversation</h3>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400">
              E2EE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-700/30 p-1 bg-black/10">
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'direct'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Direct Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('group')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'group'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>New Group</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
          {activeTab === 'group' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Core Crypto Team"
                className={`w-full px-3 py-2 text-sm rounded-xl outline-none border transition-colors ${
                  darkMode 
                    ? 'bg-[#242f3d] border-transparent text-white focus:border-sky-500' 
                    : 'bg-slate-100 border-slate-200 text-slate-900 focus:bg-white focus:border-sky-500'
                }`}
              />
            </div>
          )}

          {/* User Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl outline-none border transition-colors ${
                darkMode 
                  ? 'bg-[#242f3d] border-transparent text-white placeholder-slate-400 focus:border-sky-500' 
                  : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500'
              }`}
            />
          </div>

          {/* Contacts List */}
          <div className="flex-1 divide-y divide-slate-800/30 overflow-y-auto mt-1">
            {filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No users found. Open another tab or browser to register another user.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedMemberUids.includes(user.uid);
                return (
                  <div
                    key={user.uid}
                    onClick={() => {
                      if (activeTab === 'direct') {
                        onSelectUser(user);
                        onClose();
                      } else {
                        toggleSelectMember(user.uid);
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      darkMode ? 'hover:bg-[#202b36]' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover bg-slate-700"
                        />
                        {user.status === 'online' && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#17212b] rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold truncate leading-tight">
                          {user.displayName}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          @{user.username || 'user'}
                        </p>
                      </div>
                    </div>

                    {activeTab === 'group' && (
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-sky-500 border-sky-500 text-white' 
                          : 'border-slate-500/50'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer for group creation */}
        {activeTab === 'group' && (
          <div className="p-4 border-t border-slate-700/30 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {selectedMemberUids.length} selected
            </span>
            <button
              onClick={handleGroupSubmit}
              disabled={!groupName.trim() || selectedMemberUids.length === 0}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-md"
            >
              Create Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
