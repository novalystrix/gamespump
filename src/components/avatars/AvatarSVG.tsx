interface AvatarProps {
  size?: number;
  color?: string;
  className?: string;
}

/* Cute fluffy animal avatars — all drawn as simple, round, kawaii-style SVGs */

export function BunnyAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      {/* Ears */}
      <ellipse cx="16" cy="10" rx="5" ry="10" fill={color} />
      <ellipse cx="32" cy="10" rx="5" ry="10" fill={color} />
      <ellipse cx="16" cy="10" rx="3" ry="7" fill="white" opacity="0.3" />
      <ellipse cx="32" cy="10" rx="3" ry="7" fill="white" opacity="0.3" />
      {/* Body */}
      <circle cx="24" cy="28" r="16" fill={color} />
      <circle cx="24" cy="28" r="16" fill="white" opacity="0.1" />
      {/* Face */}
      <circle cx="18" cy="26" r="2.5" fill="white" />
      <circle cx="30" cy="26" r="2.5" fill="white" />
      <circle cx="18" cy="26" r="1.5" fill="#1a1a2e" />
      <circle cx="30" cy="26" r="1.5" fill="#1a1a2e" />
      <ellipse cx="24" cy="31" rx="2" ry="1.5" fill="#f8a4c8" />
      <circle cx="15" cy="31" r="3" fill="#f8a4c8" opacity="0.3" />
      <circle cx="33" cy="31" r="3" fill="#f8a4c8" opacity="0.3" />
    </svg>
  );
}

export function KittyAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      {/* Ears */}
      <polygon points="10,18 6,4 18,14" fill={color} />
      <polygon points="38,18 42,4 30,14" fill={color} />
      <polygon points="11,16 8,6 17,14" fill="white" opacity="0.2" />
      <polygon points="37,16 40,6 31,14" fill="white" opacity="0.2" />
      {/* Body */}
      <circle cx="24" cy="28" r="16" fill={color} />
      <circle cx="24" cy="28" r="16" fill="white" opacity="0.1" />
      {/* Face */}
      <circle cx="18" cy="26" r="2.5" fill="white" />
      <circle cx="30" cy="26" r="2.5" fill="white" />
      <circle cx="18" cy="26.5" r="1.5" fill="#1a1a2e" />
      <circle cx="30" cy="26.5" r="1.5" fill="#1a1a2e" />
      <ellipse cx="24" cy="31" rx="1.5" ry="1" fill="#1a1a2e" />
      {/* Whiskers */}
      <line x1="6" y1="28" x2="16" y2="30" stroke={color} strokeWidth="0.8" opacity="0.6" />
      <line x1="6" y1="32" x2="16" y2="31" stroke={color} strokeWidth="0.8" opacity="0.6" />
      <line x1="42" y1="28" x2="32" y2="30" stroke={color} strokeWidth="0.8" opacity="0.6" />
      <line x1="42" y1="32" x2="32" y2="31" stroke={color} strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}

export function BearAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      {/* Ears */}
      <circle cx="10" cy="14" r="6" fill={color} />
      <circle cx="38" cy="14" r="6" fill={color} />
      <circle cx="10" cy="14" r="3.5" fill="white" opacity="0.2" />
      <circle cx="38" cy="14" r="3.5" fill="white" opacity="0.2" />
      {/* Body */}
      <circle cx="24" cy="28" r="16" fill={color} />
      <circle cx="24" cy="28" r="16" fill="white" opacity="0.1" />
      {/* Snout */}
      <ellipse cx="24" cy="32" rx="7" ry="5" fill="white" opacity="0.3" />
      {/* Eyes */}
      <circle cx="18" cy="26" r="2" fill="#1a1a2e" />
      <circle cx="30" cy="26" r="2" fill="#1a1a2e" />
      <circle cx="18.5" cy="25.5" r="0.8" fill="white" />
      <circle cx="30.5" cy="25.5" r="0.8" fill="white" />
      {/* Nose */}
      <ellipse cx="24" cy="30" rx="2.5" ry="2" fill="#1a1a2e" />
    </svg>
  );
}

export function FoxAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      {/* Ears */}
      <polygon points="8,18 4,2 18,14" fill={color} />
      <polygon points="40,18 44,2 30,14" fill={color} />
      {/* Body */}
      <circle cx="24" cy="28" r="16" fill={color} />
      <circle cx="24" cy="28" r="16" fill="white" opacity="0.08" />
      {/* White face patch */}
      <ellipse cx="24" cy="33" rx="10" ry="8" fill="white" opacity="0.25" />
      {/* Eyes */}
      <ellipse cx="18" cy="26" rx="2" ry="2.5" fill="white" />
      <ellipse cx="30" cy="26" rx="2" ry="2.5" fill="white" />
      <circle cx="18" cy="26.5" r="1.5" fill="#1a1a2e" />
      <circle cx="30" cy="26.5" r="1.5" fill="#1a1a2e" />
      {/* Nose */}
      <circle cx="24" cy="31" r="2" fill="#1a1a2e" />
    </svg>
  );
}

export function PandaAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      {/* Ears */}
      <circle cx="10" cy="14" r="6" fill="#1a1a2e" />
      <circle cx="38" cy="14" r="6" fill="#1a1a2e" />
      {/* Body */}
      <circle cx="24" cy="28" r="16" fill="white" />
      <circle cx="24" cy="28" r="16" stroke={color} strokeWidth="1" fill="white" opacity="0.95" />
      {/* Eye patches */}
      <ellipse cx="17" cy="26" rx="5" ry="4" fill={color} opacity="0.8" />
      <ellipse cx="31" cy="26" rx="5" ry="4" fill={color} opacity="0.8" />
      {/* Eyes */}
      <circle cx="17" cy="26" r="2" fill="white" />
      <circle cx="31" cy="26" r="2" fill="white" />
      <circle cx="17" cy="26.5" r="1.2" fill="#1a1a2e" />
      <circle cx="31" cy="26.5" r="1.2" fill="#1a1a2e" />
      {/* Nose */}
      <ellipse cx="24" cy="31" rx="2" ry="1.5" fill="#1a1a2e" />
    </svg>
  );
}

export function OwlAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      {/* Ear tufts */}
      <polygon points="10,16 6,4 16,12" fill={color} />
      <polygon points="38,16 42,4 32,12" fill={color} />
      {/* Body */}
      <ellipse cx="24" cy="28" rx="16" ry="17" fill={color} />
      <ellipse cx="24" cy="28" rx="16" ry="17" fill="white" opacity="0.08" />
      {/* Belly */}
      <ellipse cx="24" cy="34" rx="9" ry="8" fill="white" opacity="0.2" />
      {/* Eyes */}
      <circle cx="17" cy="24" r="6" fill="white" opacity="0.9" />
      <circle cx="31" cy="24" r="6" fill="white" opacity="0.9" />
      <circle cx="17" cy="24.5" r="3" fill="#1a1a2e" />
      <circle cx="31" cy="24.5" r="3" fill="#1a1a2e" />
      <circle cx="18" cy="23.5" r="1" fill="white" />
      <circle cx="32" cy="23.5" r="1" fill="white" />
      {/* Beak */}
      <polygon points="24,28 21,31 27,31" fill="#f59e0b" />
    </svg>
  );
}

export function HamsterAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      {/* Ears */}
      <circle cx="10" cy="16" r="5" fill={color} />
      <circle cx="38" cy="16" r="5" fill={color} />
      <circle cx="10" cy="16" r="3" fill="#f8a4c8" opacity="0.5" />
      <circle cx="38" cy="16" r="3" fill="#f8a4c8" opacity="0.5" />
      {/* Body */}
      <circle cx="24" cy="28" r="16" fill={color} />
      <circle cx="24" cy="28" r="16" fill="white" opacity="0.1" />
      {/* Cheeks */}
      <circle cx="13" cy="31" r="5" fill="white" opacity="0.3" />
      <circle cx="35" cy="31" r="5" fill="white" opacity="0.3" />
      <circle cx="13" cy="32" r="3" fill="#f8a4c8" opacity="0.4" />
      <circle cx="35" cy="32" r="3" fill="#f8a4c8" opacity="0.4" />
      {/* Eyes */}
      <circle cx="19" cy="26" r="2" fill="#1a1a2e" />
      <circle cx="29" cy="26" r="2" fill="#1a1a2e" />
      <circle cx="19.5" cy="25.5" r="0.8" fill="white" />
      <circle cx="29.5" cy="25.5" r="0.8" fill="white" />
      {/* Nose */}
      <circle cx="24" cy="30" r="1.5" fill="#f8a4c8" />
    </svg>
  );
}

export function PenguinAvatar({ size = 48, color = '#a855f7', className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      {/* Body */}
      <ellipse cx="24" cy="28" rx="16" ry="17" fill={color} />
      {/* White belly */}
      <ellipse cx="24" cy="32" rx="10" ry="12" fill="white" opacity="0.9" />
      {/* Eyes */}
      <circle cx="18" cy="22" r="3" fill="white" />
      <circle cx="30" cy="22" r="3" fill="white" />
      <circle cx="18" cy="22.5" r="2" fill="#1a1a2e" />
      <circle cx="30" cy="22.5" r="2" fill="#1a1a2e" />
      <circle cx="18.5" cy="21.5" r="0.8" fill="white" />
      <circle cx="30.5" cy="21.5" r="0.8" fill="white" />
      {/* Beak */}
      <polygon points="24,26 20,29 28,29" fill="#f59e0b" />
      {/* Cheeks */}
      <circle cx="15" cy="27" r="2.5" fill="#f8a4c8" opacity="0.3" />
      <circle cx="33" cy="27" r="2.5" fill="#f8a4c8" opacity="0.3" />
    </svg>
  );
}

export const avatarMap: Record<string, React.FC<AvatarProps>> = {
  bunny: BunnyAvatar,
  kitty: KittyAvatar,
  bear: BearAvatar,
  fox: FoxAvatar,
  panda: PandaAvatar,
  owl: OwlAvatar,
  hamster: HamsterAvatar,
  penguin: PenguinAvatar,
  // Legacy keys map to animals
  crystal: BunnyAvatar,
  orbit: KittyAvatar,
  flame: FoxAvatar,
  bolt: OwlAvatar,
  wave: PenguinAvatar,
  prism: PandaAvatar,
  star: BearAvatar,
  hexa: HamsterAvatar,
};

export function Avatar({ avatarId, size = 48, color = '#a855f7', className }: AvatarProps & { avatarId: string }) {
  const Component = avatarMap[avatarId] || BunnyAvatar;
  return <Component size={size} color={color} className={className} />;
}
