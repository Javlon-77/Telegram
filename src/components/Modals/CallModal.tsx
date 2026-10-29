import React, { useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  ShieldCheck, 
  Lock 
} from 'lucide-react';
import { CallSession, UserProfile } from '../../types';

interface CallModalProps {
  activeCall: CallSession | null;
  incomingCall: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  callDuration: number;
  onAccept: () => void;
  onDecline: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  activeCall,
  incomingCall,
  localStream,
  remoteStream,
  isMuted,
  isVideoEnabled,
  callDuration,
  onAccept,
  onDecline,
  onEndCall,
  onToggleMute,
  onToggleVideo,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // INCOMING CALL MODAL
  if (incomingCall && !activeCall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-sm rounded-3xl bg-[#17212b] border border-[#242f3d] p-6 text-center shadow-2xl text-white">
          <div className="relative inline-block mb-4">
            <img
              src={incomingCall.callerPhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${incomingCall.callerId}`}
              alt={incomingCall.callerName}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-sky-500/30 mx-auto animate-pulse"
            />
            <span className="absolute bottom-0 right-1 w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-white">
              <Lock className="w-3.5 h-3.5" />
            </span>
          </div>

          <h3 className="text-xl font-bold mb-1">{incomingCall.callerName}</h3>
          <p className="text-xs text-sky-400 font-mono flex items-center justify-center gap-1.5 mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span>Incoming E2EE {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call...</span>
          </p>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={onDecline}
              className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
              title="Decline"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            <button
              onClick={onAccept}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 animate-bounce"
              title="Accept"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE CALL SCREEN
  if (activeCall) {
    const isVideo = activeCall.type === 'video';

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0e1621] text-white">
        {/* Top bar */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 z-10 backdrop-blur-sm bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">{activeCall.callerName}</h4>
              <p className="text-xs text-emerald-400 font-mono">
                {activeCall.status === 'calling' ? 'Ringing...' : `Active · ${formatDuration(callDuration)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>DTLS-SRTP Encrypted</span>
          </div>
        </div>

        {/* Video / Audio Canvas */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#17212b] to-[#0e1621]">
          {isVideo ? (
            <>
              {/* Remote stream video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local PiP video */}
              <div className="absolute top-4 right-4 w-44 h-32 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>
            </>
          ) : (
            /* Audio Call Avatar view */
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <img
                  src={activeCall.callerPhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeCall.callerId}`}
                  alt={activeCall.callerName}
                  className="w-32 h-32 rounded-full object-cover ring-8 ring-sky-500/20 mx-auto"
                />
                <span className="absolute bottom-1 right-2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#17212b]" />
              </div>
              <h3 className="text-2xl font-bold mb-1">{activeCall.callerName}</h3>
              <p className="text-sm text-slate-400 font-mono mb-6">
                {activeCall.status === 'calling' ? 'Connecting secure session...' : formatDuration(callDuration)}
              </p>

              {/* Audio waveform pulse */}
              <div className="flex items-center justify-center gap-1.5 h-12">
                {[20, 36, 18, 44, 28, 50, 32, 22, 40, 26].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-sky-400 rounded-full animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 120}ms`
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="h-24 px-6 flex items-center justify-center gap-6 border-t border-white/10 z-10 backdrop-blur-sm bg-black/40">
          {/* Mute button */}
          <button
            onClick={onToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-rose-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video */}
          {isVideo && (
            <button
              onClick={onToggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                !isVideoEnabled ? 'bg-rose-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
