import React from 'react';
import { Users } from 'lucide-react';

interface UserAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isGroup?: boolean;
  online?: boolean;
  showStatus?: boolean;
  className?: string;
  id?: string;
}

const GRADIENTS = [
  'from-blue-600 to-indigo-700 text-blue-100',
  'from-emerald-600 to-teal-700 text-emerald-100',
  'from-violet-600 to-purple-700 text-violet-100',
  'from-rose-600 to-pink-700 text-rose-100',
  'from-amber-600 to-orange-700 text-amber-100',
  'from-cyan-600 to-blue-700 text-cyan-100',
  'from-fuchsia-600 to-pink-700 text-fuchsia-100',
  'from-teal-600 to-emerald-800 text-teal-100',
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

function getInitials(name: string): string {
  if (!name) return '•';
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return clean.slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE_MAP = {
  xs: {
    box: 'w-5 h-5 text-[9px]',
    icon: 11,
    status: 'w-1.5 h-1.5 bottom-0 right-0 border',
  },
  sm: {
    box: 'w-8 h-8 text-xs',
    icon: 14,
    status: 'w-2 h-2 bottom-0 right-0 border',
  },
  md: {
    box: 'w-10 h-10 text-sm font-semibold',
    icon: 18,
    status: 'w-2.5 h-2.5 bottom-0 right-0 border-2',
  },
  lg: {
    box: 'w-12 h-12 text-base font-bold',
    icon: 22,
    status: 'w-3 h-3 bottom-0.5 right-0.5 border-2',
  },
  xl: {
    box: 'w-16 h-16 text-xl font-bold',
    icon: 28,
    status: 'w-3.5 h-3.5 bottom-0.5 right-0.5 border-2',
  },
  '2xl': {
    box: 'w-20 h-20 text-2xl font-extrabold',
    icon: 34,
    status: 'w-4 h-4 bottom-1 right-1 border-2',
  },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  size = 'md',
  isGroup = false,
  online,
  showStatus = false,
  className = '',
  id,
}) => {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const gradient = getGradient(name || 'User');
  const initials = getInitials(name || 'User');

  return (
    <div id={id} className={`relative shrink-0 select-none ${className}`}>
      <div
        className={`${sizeConfig.box} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-medium shadow-inner tracking-tight border border-white/10`}
      >
        {isGroup ? (
          <Users size={sizeConfig.icon} className="opacity-90" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showStatus && online !== undefined && (
        <span
          className={`absolute ${sizeConfig.status} rounded-full border-[#0b0c10] ${
            online ? 'bg-emerald-500' : 'bg-zinc-500'
          }`}
          title={online ? 'В сети' : 'Не в сети'}
        />
      )}
    </div>
  );
};
