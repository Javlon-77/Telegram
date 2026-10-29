import React, { useState } from 'react';
import { ShieldCheck, Lock, Flame, Phone, ArrowRight, UserCheck } from 'lucide-react';

interface AuthScreenProps {
  onSignInWithGoogle: () => void;
  onSignInAsDemo: (name: string) => void;
  authError: string | null;
  darkMode: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignInWithGoogle,
  onSignInAsDemo,
  authError,
  darkMode,
}) => {
  const [customName, setCustomName] = useState('');

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-white ${
      darkMode ? 'bg-[#0e1621] text-white' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Container */}
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-8 backdrop-blur-md ${
        darkMode ? 'bg-[#17212b] border-[#242f3d]' : 'bg-white border-slate-200'
      }`}>
        {/* Logo & Headline */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-600 to-cyan-400 mx-auto flex items-center justify-center text-white font-black text-2xl shadow-xl mb-4 shadow-sky-500/20">
            TC
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">TeleCrypt Messenger</h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Zero-knowledge End-to-End Encrypted messaging, group chats, self-destructing notes, and peer-to-peer calling.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-2.5 mb-8 text-xs">
          <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${
            darkMode ? 'bg-[#111922] border-[#242f3d] text-sky-300' : 'bg-sky-50 border-sky-100 text-sky-800'
          }`}>
            <Lock className="w-4 h-4 shrink-0 text-sky-400" />
            <span>ECDH + AES-256</span>
          </div>

          <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${
            darkMode ? 'bg-[#111922] border-[#242f3d] text-amber-300' : 'bg-amber-50 border-amber-100 text-amber-800'
          }`}>
            <Flame className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Burner Timers</span>
          </div>

          <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${
            darkMode ? 'bg-[#111922] border-[#242f3d] text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}>
            <Phone className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Encrypted WebRTC</span>
          </div>

          <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${
            darkMode ? 'bg-[#111922] border-[#242f3d] text-purple-300' : 'bg-purple-50 border-purple-100 text-purple-800'
          }`}>
            <ShieldCheck className="w-4 h-4 shrink-0 text-purple-400" />
            <span>Zero-Knowledge</span>
          </div>
        </div>

        {/* Error message */}
        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
            {authError}
          </div>
        )}

        {/* Primary Action: Google Sign In */}
        <button
          onClick={onSignInWithGoogle}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-3 active:scale-[0.99] mb-4"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          <span>Continue with Google</span>
        </button>

        {/* Or Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${darkMode ? 'border-slate-700/50' : 'border-slate-200'}`} />
          </div>
          <span className={`relative px-3 text-[11px] font-mono uppercase tracking-wider ${
            darkMode ? 'bg-[#17212b] text-slate-400' : 'bg-white text-slate-500'
          }`}>
            Or Quick Demo Launch
          </span>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400 text-center mb-2">
            Open in two tabs to test real-time E2EE messaging & calls:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSignInAsDemo('Pavel Durov')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                darkMode 
                  ? 'bg-[#242f3d] border-transparent hover:bg-[#2c3a4d] text-white' 
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Pavel Durov</span>
            </button>

            <button
              onClick={() => onSignInAsDemo('Alice (Crypto)')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                darkMode 
                  ? 'bg-[#242f3d] border-transparent hover:bg-[#2c3a4d] text-white' 
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Alice (Crypto)</span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customName.trim()) {
                onSignInAsDemo(customName.trim());
              }
            }}
            className="flex items-center gap-2 mt-3"
          >
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Or enter any custom name..."
              className={`flex-1 px-3 py-2 text-xs rounded-xl outline-none border transition-colors ${
                darkMode
                  ? 'bg-[#242f3d] border-transparent text-white placeholder-slate-400 focus:border-sky-500'
                  : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500'
              }`}
            />
            <button
              type="submit"
              disabled={!customName.trim()}
              className="p-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
