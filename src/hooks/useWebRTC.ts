import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  addDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CallSession, UserProfile } from '../types';
import { soundManager } from '../lib/audio';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function useWebRTC(currentUser: UserProfile | null) {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const durationTimerRef = useRef<number | null>(null);

  // Fallback synthetic stream if browser media access is denied in iframe
  const createSyntheticStream = useCallback((withVideo: boolean): MediaStream => {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    const stream = dest.stream;

    if (withVideo) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#17212b';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#5288c1';
        ctx.font = '24px sans-serif';
        ctx.fillText('Encrypted Video Stream', 180, 240);
      }
      const canvasStream = canvas.captureStream(15);
      canvasStream.getVideoTracks().forEach(track => stream.addTrack(track));
    }

    return stream;
  }, []);

  const getMedia = useCallback(async (video: boolean): Promise<MediaStream> => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: video ? { width: 1280, height: 720 } : false
        });
        return stream;
      }
    } catch (err) {
      console.warn('Real camera/mic unavailable, using simulated encrypted stream', err);
    }
    return createSyntheticStream(video);
  }, [createSyntheticStream]);

  // Clean up WebRTC session
  const cleanupCall = useCallback(() => {
    soundManager.stopRingtone();
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    setCallDuration(0);
  }, [localStream]);

  // Listen for incoming calls
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'calls'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'calling')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const callData = { id: change.doc.id, ...change.doc.data() } as CallSession;
          setIncomingCall(callData);
          soundManager.startRingtone();
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Call duration counter
  useEffect(() => {
    if (activeCall?.status === 'active') {
      durationTimerRef.current = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [activeCall?.status]);

  // Initiate call
  const startCall = async (chatId: string, receiver: UserProfile, type: 'audio' | 'video') => {
    if (!currentUser) return;
    cleanupCall();

    const stream = await getMedia(type === 'video');
    setLocalStream(stream);

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const remote = new MediaStream();
    setRemoteStream(remote);

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => remote.addTrack(track));
    };

    const callDocRef = doc(collection(db, 'calls'));
    const candidatesCollection = collection(callDocRef, 'candidates');

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(candidatesCollection, {
          senderId: currentUser.uid,
          candidate: event.candidate.toJSON(),
          createdAt: new Date().toISOString()
        }).catch(() => {});
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const callData: CallSession = {
      id: callDocRef.id,
      chatId,
      callerId: currentUser.uid,
      callerName: currentUser.displayName,
      callerPhoto: currentUser.photoURL,
      receiverId: receiver.uid,
      type,
      status: 'calling',
      offer: {
        type: offer.type,
        sdp: offer.sdp
      },
      createdAt: new Date().toISOString()
    };

    await setDoc(callDocRef, callData);
    setActiveCall(callData);

    // Listen for answer and candidate updates
    const unsubDoc = onSnapshot(callDocRef, async (snap) => {
      const data = snap.data() as CallSession | undefined;
      if (!data) return;

      if (data.status === 'active' && data.answer && !pc.currentRemoteDescription) {
        const rtcSessionDesc = new RTCSessionDescription(data.answer);
        await pc.setRemoteDescription(rtcSessionDesc);
        setActiveCall(prev => prev ? { ...prev, status: 'active', answer: data.answer } : null);
      } else if (data.status === 'ended' || data.status === 'declined') {
        cleanupCall();
      }
    });

    const unsubCandidates = onSnapshot(candidatesCollection, (snap) => {
      snap.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidateData = change.doc.data();
          if (candidateData.senderId !== currentUser.uid && candidateData.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidateData.candidate));
            } catch (e) {
              console.warn('Error adding ice candidate', e);
            }
          }
        }
      });
    });

    // Cleanup listeners on end
    return () => {
      unsubDoc();
      unsubCandidates();
    };
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall || !currentUser) return;
    soundManager.stopRingtone();

    const stream = await getMedia(incomingCall.type === 'video');
    setLocalStream(stream);

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const remote = new MediaStream();
    setRemoteStream(remote);

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => remote.addTrack(track));
    };

    const callDocRef = doc(db, 'calls', incomingCall.id);
    const candidatesCollection = collection(callDocRef, 'candidates');

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(candidatesCollection, {
          senderId: currentUser.uid,
          candidate: event.candidate.toJSON(),
          createdAt: new Date().toISOString()
        }).catch(() => {});
      }
    };

    if (incomingCall.offer) {
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await updateDoc(callDocRef, {
        status: 'active',
        answer: {
          type: answer.type,
          sdp: answer.sdp
        }
      });

      setActiveCall({
        ...incomingCall,
        status: 'active',
        answer: {
          type: answer.type,
          sdp: answer.sdp
        }
      });
      setIncomingCall(null);
    }

    onSnapshot(candidatesCollection, (snap) => {
      snap.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidateData = change.doc.data();
          if (candidateData.senderId !== currentUser.uid && candidateData.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidateData.candidate));
            } catch (e) {
              console.warn('Error adding ice candidate', e);
            }
          }
        }
      });
    });
  };

  // Decline incoming call
  const declineCall = async () => {
    soundManager.stopRingtone();
    if (incomingCall) {
      try {
        await updateDoc(doc(db, 'calls', incomingCall.id), {
          status: 'declined',
          endedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Error declining call', e);
      }
      setIncomingCall(null);
    }
  };

  // End active call
  const endCall = async () => {
    if (activeCall) {
      try {
        await updateDoc(doc(db, 'calls', activeCall.id), {
          status: 'ended',
          endedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Error ending call', e);
      }
    }
    cleanupCall();
  };

  // Toggle Mute
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  return {
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
    toggleVideo
  };
}
