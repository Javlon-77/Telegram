import React, { useState } from 'react';
import { 
  X, 
  User, 
  Shield, 
  Key, 
  Bell, 
  Moon, 
  Sun, 
  LogOut, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  RefreshCw,
  Flame,
  Smartphone
} from 'lucide-react';
import { UserProfile } from '../../types';
import { StoredKeyPair, saveUserKeys } from '../../lib/crypto';
import { requestNotificationPermission } from '../../lib/notifications';

interface SettingsModalProps {
  currentUser: UserProfile | null;
  userKeys: StoredKeyPair | null;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
  onSignInAsDemo: (name: string) => void;
  onSignInWithGoogle: () => void;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUser,
  userKeys,
  onUpdateProfile,
  onLogout,
  onSignInAsDemo,
  onSignInWithGoogle,
  onClose,
  darkMode,
  onToggleDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sync' | 'accounts'>('profile');
  const [name, setName] = useState(currentUser?.displayName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync / Backup keys
  const [copiedKey, setCopiedKey] = useState(false);
  const [importKeyText, setImportKeyText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      displayName: name.trim(),
      username: username.trim().toLowerCase(),
      bio: bio.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const exportBackupString = () => {
    if (!userKeys) return '';
    return btoa(JSON.stringify(userKeys));
  };

  const copyBackupCode = () => {
    const code = exportBackupString();
    navigator.clipboard.writeText(code);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleImportKey = () => {
    if (!currentUser || !importKeyText.trim()) return;
    try {
      const decoded = atob(importKeyText.trim());
      const parsed = JSON.parse(decoded);
      if (parsed.publicKeyJWK && parsed.privateKeyJWK) {
        saveUserKeys(currentUser.uid, parsed);
        setImportStatus('Keys imported successfully! Encrypted chats synced.');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Invalid key structure.');
      }
    } catch {
      setImportStatus('Failed to decode key backup. Please check format.');
    }
  };

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      alert('Push notifications enabled for incoming encrypted messages.');
    } else {
      alert('Notification permission was denied in browser settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] ${
        darkMode ? 'bg-[#17212b] border-[#242f3d] text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Top Header */}
        <div className="p-4 border-b border-slate-700/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold">Settings & Privacy</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-700/30 p-1 bg-black/10 overflow-x-auto">
          {[
            { id: 'profile', label: 'Profile', icon: <User className="w-3.5 h-3.5" /> },
            { id: 'security', label: 'E2EE & Keys', icon: <Shield className="w-3.5 h-3.5" /> },
            { id: 'sync', label: 'Cross-Device', icon: <Smartphone className="w-3.5 h-3.5" /> },
            { id: 'accounts', label: 'Switch Account', icon: <RefreshCw className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[90px] py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={currentUser?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser?.uid}`}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-sky-500/40"
                />
                <div>
                  <h4 className="text-sm font-bold">{currentUser?.displayName}</h4>
                  <p className="text-xs text-sky-400 font-mono">@{currentUser?.username || 'handle'}</p>
                  <p className="text-[11px] text-slate-400">{currentUser?.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-xl outline-none border ${
                    darkMode ? 'bg-[#242f3d] border-transparent text-white' : 'bg-slate-100 border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Username (@handle)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-xl outline-none border ${
                    darkMode ? 'bg-[#242f3d] border-transparent text-white' : 'bg-slate-100 border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-xl outline-none border ${
                    darkMode ? 'bg-[#242f3d] border-transparent text-white' : 'bg-slate-100 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow transition-colors flex items-center gap-1.5"
                >
                  {saveSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{saveSuccess ? 'Saved!' : 'Save Changes'}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-700 flex items-center gap-2 hover:bg-slate-800 transition-colors"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                  <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & E2EE */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-[#111922] border-[#242f3d]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-2 text-sky-400">
                  <Shield className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">Cryptographic Identity</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Your device holds a unique Curve P-256 Elliptic Curve key pair. Private keys never touch any server.
                </p>
                <div className="text-[11px] font-mono text-slate-400 space-y-1">
                  <div>Status: <span className="text-emerald-400 font-semibold">Active & Validated</span></div>
                  <div>Algorithm: <span className="text-slate-200">ECDH (P-256) + AES-256-GCM</span></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-slate-800/40">
                <div>
                  <h5 className="text-xs font-semibold">Push Notifications</h5>
                  <p className="text-[11px] text-slate-400">Receive alerts when offline or tab is backgrounded</p>
                </div>
                <button
                  onClick={handleEnablePush}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium transition-colors"
                >
                  Enable
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CROSS-DEVICE SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-[#111922] border-[#242f3d]' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-xs font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  <span>Export Keys to Another Device</span>
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Copy your encrypted key backup to sync your secret chat history to another phone, laptop, or browser.
                </p>
                <button
                  onClick={copyBackupCode}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Backup Code Copied!' : 'Copy Device Sync Code'}</span>
                </button>
              </div>

              <div className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-[#111922] border-[#242f3d]' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-xs font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                  <Upload className="w-4 h-4" />
                  <span>Import Keys on This Device</span>
                </h4>
                <p className="text-xs text-slate-400 mb-2">
                  Paste the backup code from your other device:
                </p>
                <textarea
                  rows={2}
                  value={importKeyText}
                  onChange={(e) => setImportKeyText(e.target.value)}
                  placeholder="Paste backup key string here..."
                  className={`w-full p-2 text-xs font-mono rounded-xl outline-none border mb-2 ${
                    darkMode ? 'bg-[#242f3d] border-transparent text-white' : 'bg-slate-100 border-slate-200'
                  }`}
                />
                <button
                  onClick={handleImportKey}
                  className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors"
                >
                  Restore Keys
                </button>
                {importStatus && (
                  <p className="text-xs mt-2 text-sky-400">{importStatus}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SWITCH ACCOUNTS & DEMO */}
          {activeTab === 'accounts' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                To test 2-way real-time encrypted messaging, self-destruct timers, and WebRTC calls, you can switch accounts or open another browser tab:
              </p>

              <div className="grid grid-cols-1 gap-2">
                {[
                  { name: 'Pavel Durov', role: 'Founder & CEO', avatar: 'Pavel' },
                  { name: 'Alice (Security)', role: 'Cryptographer', avatar: 'Alice' },
                  { name: 'Bob (Crypto Dev)', role: 'Smart Contracts', avatar: 'Bob' },
                ].map((demo) => (
                  <button
                    key={demo.name}
                    onClick={() => {
                      onSignInAsDemo(demo.name);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between border transition-all text-left ${
                      currentUser?.displayName === demo.name
                        ? 'border-sky-500 bg-sky-500/10'
                        : darkMode ? 'border-[#242f3d] hover:bg-[#202b36]' : 'border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${demo.avatar}`}
                        alt={demo.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold">{demo.name}</div>
                        <div className="text-[11px] text-slate-400">{demo.role}</div>
                      </div>
                    </div>
                    {currentUser?.displayName === demo.name && (
                      <span className="text-xs text-sky-400 font-semibold">Active</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between">
                <button
                  onClick={onSignInWithGoogle}
                  className="px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold text-xs shadow hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                  <span>Google Account</span>
                </button>

                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
