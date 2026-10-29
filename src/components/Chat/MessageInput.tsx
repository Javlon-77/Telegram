import React, { useState, useRef } from 'react';
import { 
  Paperclip, 
  Smile, 
  Send, 
  Mic, 
  Flame, 
  X, 
  Image as ImageIcon,
  Lock
} from 'lucide-react';
import { ChatMessage, MediaType } from '../../types';
import { VoiceRecorder } from './VoiceRecorder';

interface MessageInputProps {
  onSendMessage: (params: {
    text: string;
    mediaType?: MediaType;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    audioDuration?: number;
    replyTo?: ChatMessage | null;
    customBurnSeconds?: number;
  }) => void;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  chatBurnTimer: number;
  isE2EE: boolean;
  darkMode: boolean;
}

const EMOJI_LIST = ['😀', '😂', '😍', '🔥', '👍', '❤️', '🎉', '🚀', '💯', '👏', '🤔', '👀', '✨', '⚡', '🔒', '🔑', '🤫', '😎'];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  replyingTo,
  onCancelReply,
  chatBurnTimer,
  isE2EE,
  darkMode,
}) => {
  const [text, setText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showBurnSelector, setShowBurnSelector] = useState(false);
  const [customBurnSeconds, setCustomBurnSeconds] = useState<number | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const effectiveBurnTimer = customBurnSeconds !== undefined ? customBurnSeconds : chatBurnTimer;

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage({
      text: text.trim(),
      replyTo: replyingTo,
      customBurnSeconds: effectiveBurnTimer > 0 ? effectiveBurnTimer : undefined,
    });
    setText('');
    onCancelReply();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      onSendMessage({
        text: isImg ? (text.trim() || '') : (text.trim() || `Sent file: ${file.name}`),
        mediaType: isImg ? 'image' : 'file',
        fileUrl: base64Url,
        fileName: file.name,
        fileSize: file.size,
        replyTo: replyingTo,
        customBurnSeconds: effectiveBurnTimer > 0 ? effectiveBurnTimer : undefined,
      });
      setText('');
      onCancelReply();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVoiceNoteReady = (audioDataUrl: string, durationSec: number) => {
    onSendMessage({
      text: '',
      mediaType: 'audio',
      fileUrl: audioDataUrl,
      audioDuration: durationSec,
      replyTo: replyingTo,
      customBurnSeconds: effectiveBurnTimer > 0 ? effectiveBurnTimer : undefined,
    });
    setIsRecordingVoice(false);
    onCancelReply();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className={`p-3 border-t shrink-0 select-none relative ${
      darkMode ? 'bg-[#17212b] border-[#242f3d]' : 'bg-white border-slate-200'
    }`}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Reply Banner */}
      {replyingTo && (
        <div className={`flex items-center justify-between px-3 py-1.5 mb-2 text-xs rounded-lg border-l-4 border-sky-500 ${
          darkMode ? 'bg-[#202d3c] text-slate-200' : 'bg-sky-50 text-slate-800'
        }`}>
          <div className="truncate">
            <span className="font-semibold block">{replyingTo.senderName}</span>
            <span className="opacity-80 truncate block">{replyingTo.decryptedText || replyingTo.text || 'Attachment'}</span>
          </div>
          <button onClick={onCancelReply} className="p-1 hover:text-rose-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Bar */}
      {isRecordingVoice ? (
        <VoiceRecorder
          onSendVoiceNote={handleVoiceNoteReady}
          onCancel={() => setIsRecordingVoice(false)}
          darkMode={darkMode}
        />
      ) : (
        <div className="flex items-end gap-2">
          {/* Attachments Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach image or file"
            className={`p-2.5 rounded-xl transition-colors ${
              darkMode ? 'text-slate-400 hover:text-white hover:bg-[#242f3d]' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Self-Destruct Per-Message Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowBurnSelector(!showBurnSelector)}
              title="Set self-destruct timer for this message"
              className={`p-2.5 rounded-xl transition-colors flex items-center gap-1 ${
                effectiveBurnTimer > 0
                  ? 'text-amber-400 bg-amber-500/10'
                  : darkMode ? 'text-slate-400 hover:text-white hover:bg-[#242f3d]' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-5 h-5" />
              {effectiveBurnTimer > 0 && (
                <span className="text-[10px] font-mono font-bold">{effectiveBurnTimer}s</span>
              )}
            </button>

            {showBurnSelector && (
              <div className={`absolute bottom-12 left-0 w-44 rounded-xl shadow-xl border p-1 z-30 ${
                darkMode ? 'bg-[#1e2a38] border-[#2f3f50] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="px-2.5 py-1 text-[11px] font-medium text-slate-400 border-b border-slate-700/30">
                  Burn After Reading
                </div>
                {[
                  { label: 'Off', sec: 0 },
                  { label: '5 seconds', sec: 5 },
                  { label: '10 seconds', sec: 10 },
                  { label: '30 seconds', sec: 30 },
                  { label: '1 minute', sec: 60 },
                  { label: '1 hour', sec: 3600 },
                ].map((item) => (
                  <button
                    key={item.sec}
                    onClick={() => {
                      setCustomBurnSeconds(item.sec);
                      setShowBurnSelector(false);
                    }}
                    className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-colors flex items-center justify-between ${
                      effectiveBurnTimer === item.sec
                        ? 'bg-sky-500 text-white font-medium'
                        : darkMode ? 'hover:bg-[#253546]' : 'hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    {effectiveBurnTimer === item.sec && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Input Container */}
          <div className={`flex-1 flex items-end rounded-2xl border px-3 py-1.5 transition-colors ${
            darkMode 
              ? 'bg-[#242f3d] border-transparent focus-within:border-sky-500/50' 
              : 'bg-slate-100 border-slate-200 focus-within:bg-white focus-within:border-sky-500'
          }`}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={isE2EE ? 'Write an encrypted message...' : 'Write a message...'}
              className="w-full bg-transparent resize-none outline-none text-sm leading-normal max-h-32 min-h-[24px] py-1 placeholder-slate-400 selection:bg-sky-400 selection:text-white"
            />

            {/* Emoji Picker Button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Insert emoji"
                className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>

              {showEmojiPicker && (
                <div className={`absolute bottom-10 right-0 p-2 rounded-2xl shadow-2xl border grid grid-cols-6 gap-1.5 z-30 ${
                  darkMode ? 'bg-[#182533] border-[#242f3d]' : 'bg-white border-slate-200'
                }`}>
                  {EMOJI_LIST.map((em) => (
                    <button
                      key={em}
                      onClick={() => {
                        setText((prev) => prev + em);
                        setShowEmojiPicker(false);
                        textareaRef.current?.focus();
                      }}
                      className="w-8 h-8 flex items-center justify-center text-base hover:scale-125 transition-transform"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Action: Voice Record OR Send */}
          {text.trim() ? (
            <button
              onClick={handleSend}
              title="Send message"
              className="p-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-sm flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsRecordingVoice(true)}
              title="Record voice message"
              className={`p-2.5 rounded-full transition-colors flex items-center justify-center ${
                darkMode ? 'text-slate-400 hover:text-white hover:bg-[#242f3d]' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
