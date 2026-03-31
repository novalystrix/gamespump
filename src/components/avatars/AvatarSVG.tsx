interface AvatarProps {
  size?: number;
  color?: string;
  className?: string;
}

const AVATAR_NAMES: Record<string, string> = {
  bunny: 'Bunny', kitty: 'Kitty', bear: 'Bear', fox: 'Fox',
  panda: 'Panda', owl: 'Owl', hamster: 'Hamster', penguin: 'Penguin',
  // Legacy mappings
  crystal: 'Bunny', orbit: 'Kitty', flame: 'Fox', bolt: 'Owl',
  wave: 'Penguin', prism: 'Panda', star: 'Bear', hexa: 'Hamster',
};

const LEGACY_MAP: Record<string, string> = {
  crystal: 'bunny', orbit: 'kitty', flame: 'fox', bolt: 'owl',
  wave: 'penguin', prism: 'panda', star: 'bear', hexa: 'hamster',
};

function resolveAvatarId(id: string): string {
  return LEGACY_MAP[id] ?? id;
}

export function Avatar({ avatarId, size = 48, className }: AvatarProps & { avatarId: string }) {
  const resolved = resolveAvatarId(avatarId);
  return (
    <img
      src={`/images/avatars/${resolved}.webp`}
      alt={AVATAR_NAMES[avatarId] ?? avatarId}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className ?? ''}`}
      style={{ width: size, height: size }}
    />
  );
}

// Keep named exports for backward compat
export function BunnyAvatar(props: AvatarProps) { return <Avatar avatarId="bunny" {...props} />; }
export function KittyAvatar(props: AvatarProps) { return <Avatar avatarId="kitty" {...props} />; }
export function BearAvatar(props: AvatarProps) { return <Avatar avatarId="bear" {...props} />; }
export function FoxAvatar(props: AvatarProps) { return <Avatar avatarId="fox" {...props} />; }
export function PandaAvatar(props: AvatarProps) { return <Avatar avatarId="panda" {...props} />; }
export function OwlAvatar(props: AvatarProps) { return <Avatar avatarId="owl" {...props} />; }
export function HamsterAvatar(props: AvatarProps) { return <Avatar avatarId="hamster" {...props} />; }
export function PenguinAvatar(props: AvatarProps) { return <Avatar avatarId="penguin" {...props} />; }

export const avatarMap: Record<string, React.FC<AvatarProps>> = {
  bunny: BunnyAvatar, kitty: KittyAvatar, bear: BearAvatar, fox: FoxAvatar,
  panda: PandaAvatar, owl: OwlAvatar, hamster: HamsterAvatar, penguin: PenguinAvatar,
  crystal: BunnyAvatar, orbit: KittyAvatar, flame: FoxAvatar, bolt: OwlAvatar,
  wave: PenguinAvatar, prism: PandaAvatar, star: BearAvatar, hexa: HamsterAvatar,
};
