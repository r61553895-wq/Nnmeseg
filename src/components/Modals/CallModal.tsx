import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from '../UserAvatar';
import { Conversation, User } from '../../types';

interface CallModalProps {
  isOpen: boolean;
  conversation: Conversation | null;
  currentUser: User;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ isOpen, conversation, currentUser, onClose }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [status, setStatus] = useState<'connecting' | 'connected'>('connecting');

  useEffect(() => {
    if (!isOpen) return;
    const connectTimer = setTimeout(() => {
      setStatus('connected');
    }, 1800);

    return () => clearTimeout(connectTimer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || status !== 'connected') return;
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, status]);

  if (!isOpen || !conversation) return null;

  const otherUser = conversation.type === 'direct'
    ? conversation.participants.find((p) => p.id !== currentUser.id)
    : null;

  const displayName = conversation.type === 'group' ? conversation.name : otherUser?.name || 'Contact';
  const displayAvatar = conversation.type === 'group' ? conversation.avatar : otherUser?.avatar;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <div 
        id="call-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm rounded-2xl bg-[#14171f] border border-zinc-800/90 shadow-2xl p-6 flex flex-col items-center text-center text-zinc-200 relative overflow-hidden"
        >
          {/* Encryption badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
            <ShieldCheck size={13} />
            <span>End-to-end encrypted peer</span>
          </div>

          {/* Avatar with pulse ring */}
          <div className="relative mb-5">
            {status === 'connecting' && (
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="absolute inset-0 rounded-full bg-blue-500/20 -m-2.5"
              />
            )}
            <UserAvatar
              name={displayName}
              size="xl"
              isGroup={conversation.type === 'group'}
            />
          </div>

          <h3 className="text-xl font-semibold text-zinc-100 tracking-tight mb-1">{displayName}</h3>
          <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase mb-6">
            {status === 'connecting' ? 'Establishing direct line...' : formatTime(duration)}
          </p>

          {/* Interactive audio visualizer bars */}
          {status === 'connected' && (
            <div className="flex items-center justify-center gap-1 h-6 mb-8">
              {[12, 22, 16, 28, 18, 14, 24, 15].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [8, h, 8] }}
                  transition={{ repeat: Infinity, duration: 0.7 + i * 0.1, ease: 'easeInOut' }}
                  className="w-1 bg-blue-500/70 rounded-full"
                />
              ))}
            </div>
          )}

          {/* Call Controls */}
          <div className="flex items-center gap-4 mt-2">
            <button
              id="call-mute-toggle"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-full transition-all ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button
              id="call-video-toggle"
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-3.5 rounded-full transition-all ${
                isVideoOn
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
              title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            <button
              id="call-end-btn"
              onClick={onClose}
              className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition-transform active:scale-95"
              title="End call"
            >
              <PhoneOff size={22} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
