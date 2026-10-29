import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Copy, Check, Lock, KeyRound, Info } from 'lucide-react';
import { UserProfile } from '../../types';
import { computeSafetyFingerprint } from '../../lib/crypto';

interface E2EEVerificationModalProps {
  currentUser: UserProfile | null;
  otherUser: UserProfile | null;
  onClose: () => void;
  darkMode: boolean;
}

export const E2EEVerificationModal: React.FC<E2EEVerificationModalProps> = ({
  currentUser,
  otherUser,
  onClose,
  darkMode,
}) => {
  const [fingerprint, setFingerprint] = useState<string>('Computing...');
  const [emojis, setEmojis] = useState<string[]>(['🔒', '🔑', '🛡️', '⚡']);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentUser || !otherUser) return;
    const keyA = currentUser.publicKey || currentUser.uid;
    const keyB = otherUser.publicKey || otherUser.uid;

    computeSafetyFingerprint(keyA, keyB).then((res) => {
      setFingerprint(res.fingerprint);
      setEmojis(res.emojis);
    });
  }, [currentUser, otherUser]);

  const copyFingerprint = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${
        darkMode ? 'bg-[#17212b] border-[#242f3d] text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">End-to-End Encryption</h3>
              <p className="text-xs text-sky-400 font-mono">Verified Secret Chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Telegram Verification Emojis */}
        <div className="my-6 text-center">
          <p className="text-xs text-slate-400 mb-3">
            Compare these 4 emojis with <span className="font-semibold text-sky-400">{otherUser?.displayName || 'contact'}</span>&apos;s screen:
          </p>
          <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl shadow-inner border ${
            darkMode ? 'bg-[#0e1621] border-[#242f3d]' : 'bg-slate-100 border-slate-200'
          }`}>
            {emojis.map((em, idx) => (
              <span key={idx} className="text-3xl hover:scale-125 transition-transform cursor-default">
                {em}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-2 flex items-center justify-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>If emojis match, no third-party can intercept your chat</span>
          </p>
        </div>

        {/* Safety Number Fingerprint */}
        <div className={`p-3 rounded-2xl border mb-5 ${
          darkMode ? 'bg-[#111922] border-[#242f3d]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 font-mono">
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
              Safety Number
            </span>
            <button
              onClick={copyFingerprint}
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors text-[11px]"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="font-mono text-xs tracking-wider font-semibold break-all text-sky-300">
            {fingerprint}
          </p>
        </div>

        {/* Cryptographic Specifications */}
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
            <span>Key Agreement</span>
            <span className="font-mono text-slate-200">ECDH (NIST P-256)</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
            <span>Cipher</span>
            <span className="font-mono text-slate-200">AES-256-GCM (12-byte IV)</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
            <span>Fingerprint Hash</span>
            <span className="font-mono text-slate-200">SHA-256</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span>Key Storage</span>
            <span className="font-mono text-slate-200">Client-Side IndexedDB</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-colors shadow-md"
        >
          Done
        </button>
      </div>
    </div>
  );
};
