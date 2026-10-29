import React from 'react';
import { Search, Plus, Menu, X } from 'lucide-react';
import { UserProfile } from '../../types';

interface SidebarHeaderProps {
  currentUser: UserProfile | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNewChat: () => void;
  onOpenMenu: () => void;
  darkMode: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  onOpenNewChat,
  onOpenMenu,
  darkMode
}) => {
  return (
    <div className={`p-3 border-b flex flex-col gap-2 shrink-0 ${
      darkMode ? 'bg-[#17212b] border-[#242f3d]' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onOpenMenu}
          title="Open Menu"
          className={`p-2 rounded-lg transition-colors ${
            darkMode ? 'hover:bg-[#202b36] text-slate-300' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base font-semibold tracking-tight truncate flex-1 flex items-center gap-2">
          <span>TeleCrypt</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded text-sky-400 bg-sky-950/60 border border-sky-800/40">
            E2EE
          </span>
        </h1>

        <button
          onClick={onOpenNewChat}
          title="New Chat or Group"
          className="p-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-sm flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <Search className={`absolute left-3 top-2.5 w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search chats or messages..."
          className={`w-full pl-9 pr-8 py-1.5 text-sm rounded-lg outline-none transition-colors ${
            darkMode
              ? 'bg-[#242f3d] text-white placeholder-slate-400 focus:ring-1 focus:ring-sky-500'
              : 'bg-slate-100 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-sky-500 border border-slate-200'
          }`}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
