import React from 'react';
import { MessageSquare, User, Users, Shield, Settings, Moon, Sun } from 'lucide-react';

export type FolderTab = 'all' | 'direct' | 'groups' | 'e2ee';

interface FoldersRailProps {
  currentTab: FolderTab;
  onSelectTab: (tab: FolderTab) => void;
  onOpenSettings: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  unreadCounts: {
    all: number;
    direct: number;
    groups: number;
    e2ee: number;
  };
}

export const FoldersRail: React.FC<FoldersRailProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  darkMode,
  onToggleDarkMode,
  unreadCounts,
}) => {
  const tabs: { id: FolderTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'All', icon: <MessageSquare className="w-5 h-5" />, count: unreadCounts.all },
    { id: 'direct', label: 'Direct', icon: <User className="w-5 h-5" />, count: unreadCounts.direct },
    { id: 'groups', label: 'Groups', icon: <Users className="w-5 h-5" />, count: unreadCounts.groups },
    { id: 'e2ee', label: 'Secret', icon: <Shield className="w-5 h-5" />, count: unreadCounts.e2ee },
  ];

  return (
    <div className={`w-16 flex flex-col items-center justify-between py-4 border-r transition-colors select-none shrink-0 ${
      darkMode ? 'bg-[#0e1621] border-[#242f3d]' : 'bg-slate-100 border-slate-200'
    }`}>
      {/* Top Folders */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-md mb-2">
          TC
        </div>

        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              title={tab.label}
              className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all group ${
                isActive
                  ? darkMode 
                    ? 'bg-[#2b5278] text-white shadow-sm' 
                    : 'bg-white text-sky-600 shadow-sm'
                  : darkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-[#17212b]' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium mt-0.5 tracking-tight">{tab.label}</span>
              {tab.count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-sky-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            darkMode 
              ? 'text-amber-300 hover:bg-[#17212b]' 
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={onOpenSettings}
          title="Settings"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            darkMode 
              ? 'text-slate-400 hover:text-white hover:bg-[#17212b]' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
