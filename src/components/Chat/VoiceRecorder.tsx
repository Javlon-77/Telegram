import React, { useState, useEffect, useRef } from 'react';
import { Mic, Trash2, Send, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoiceNote: (audioDataUrl: string, durationSec: number) => void;
  onCancel: () => void;
  darkMode: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSendVoiceNote,
  onCancel,
  darkMode,
}) => {
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [waveLevels, setWaveLevels] = useState<number[]>([10, 15, 20, 15, 10]);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Set up audio analyzer for live waveform visualization
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioCtx = new AudioCtx();
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 32;
          source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateWave = () => {
            if (analyser) {
              analyser.getByteFrequencyData(dataArray);
              const sliced = Array.from(dataArray.slice(0, 12)).map(val => Math.max(6, (val / 255) * 32));
              setWaveLevels(sliced);
              animFrameRef.current = requestAnimationFrame(updateWave);
            }
          };
          updateWave();
        }

        // Setup MediaRecorder
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(100);

        timerRef.current = window.setInterval(() => {
          setRecordingSeconds(sec => sec + 1);
        }, 1000);
      } catch (err: unknown) {
        console.warn('Microphone access denied or error', err);
        setError('Microphone access denied or unavailable.');
      }
    };

    startRecording();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, []);

  const handleFinish = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onSendVoiceNote(base64, recordingSeconds || 1);
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorderRef.current.stop();
  };

  const handleCancelClick = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    onCancel();
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-between px-4 py-2 bg-rose-950/20 text-rose-400 text-xs rounded-xl">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white px-2 py-1 rounded"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl border animate-fade-in ${
      darkMode ? 'bg-[#182533] border-[#242f3d]' : 'bg-slate-100 border-slate-200'
    }`}>
      {/* Live recording indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span className="font-mono text-xs font-semibold text-rose-400">
            {formatSeconds(recordingSeconds)}
          </span>
        </div>

        {/* Live dynamic waveform */}
        <div className="flex items-center gap-1 h-6">
          {waveLevels.map((lvl, i) => (
            <div
              key={i}
              className="w-1 bg-sky-400 rounded-full transition-all duration-75"
              style={{ height: `${lvl}px` }}
            />
          ))}
        </div>
      </div>

      {/* Action buttons: Cancel or Send */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCancelClick}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Cancel recording"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleFinish}
          className="p-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-sm flex items-center justify-center"
          title="Send voice note"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
