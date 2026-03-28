interface AvatarProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CrystalAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <defs>
        <linearGradient id={`crystal-${color}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <polygon points="24,4 40,18 36,40 12,40 8,18" fill={`url(#crystal-${color})`} stroke={color} strokeWidth="1.5" />
      <polygon points="24,4 28,18 24,40 20,18" fill="white" opacity="0.15" />
      <line x1="8" y1="18" x2="40" y2="18" stroke={color} strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

export function OrbitAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="8" fill={color} />
      <ellipse cx="24" cy="24" rx="18" ry="8" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" transform="rotate(-30 24 24)" />
      <ellipse cx="24" cy="24" rx="18" ry="8" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" transform="rotate(30 24 24)" />
      <circle cx="24" cy="24" r="3" fill="white" opacity="0.3" />
    </svg>
  );
}

export function FlameAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <defs>
        <linearGradient id={`flame-${color}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <path d="M24 4 C24 4 36 16 36 28 C36 35 30 42 24 42 C18 42 12 35 12 28 C12 16 24 4 24 4Z" fill={`url(#flame-${color})`} />
      <path d="M24 18 C24 18 30 24 30 30 C30 34 27 38 24 38 C21 38 18 34 18 30 C18 24 24 18 24 18Z" fill="white" opacity="0.2" />
    </svg>
  );
}

export function BoltAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <polygon points="28,4 16,22 22,22 18,44 34,22 26,22" fill={color} />
      <polygon points="28,4 22,22 26,22 24,16" fill="white" opacity="0.2" />
    </svg>
  );
}

export function WaveAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <defs>
        <linearGradient id={`wave-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path d="M4 24 Q12 12 20 24 Q28 36 36 24 Q40 18 44 24" fill="none" stroke={`url(#wave-${color})`} strokeWidth="4" strokeLinecap="round" />
      <path d="M4 32 Q12 20 20 32 Q28 44 36 32 Q40 26 44 32" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
      <path d="M4 16 Q12 4 20 16 Q28 28 36 16 Q40 10 44 16" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function PrismAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <polygon points="24,4 44,36 4,36" fill={color} opacity="0.7" />
      <polygon points="24,12 38,36 10,36" fill={color} opacity="0.3" />
      <polygon points="24,4 44,36 4,36" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="24" cy="24" r="4" fill="white" opacity="0.25" />
    </svg>
  );
}

export function StarAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M24 4 L28 18 L44 18 L31 27 L35 42 L24 33 L13 42 L17 27 L4 18 L20 18 Z" fill={color} />
      <path d="M24 4 L28 18 L24 33 L20 18 Z" fill="white" opacity="0.15" />
    </svg>
  );
}

export function HexaAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <defs>
        <linearGradient id={`hexa-${color}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill={`url(#hexa-${color})`} stroke={color} strokeWidth="1.5" />
      <polygon points="24,12 34,18 34,30 24,36 14,30 14,18" fill="white" opacity="0.1" />
    </svg>
  );
}

export const avatarMap: Record<string, React.FC<AvatarProps>> = {
  crystal: CrystalAvatar,
  orbit: OrbitAvatar,
  flame: FlameAvatar,
  bolt: BoltAvatar,
  wave: WaveAvatar,
  prism: PrismAvatar,
  star: StarAvatar,
  hexa: HexaAvatar,
};

export function Avatar({ avatarId, size = 48, color = '#a855f7', className }: AvatarProps & { avatarId: string }) {
  const Component = avatarMap[avatarId] || CrystalAvatar;
  return <Component size={size} color={color} className={className} />;
}
