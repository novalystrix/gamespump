"use client";

import { Avatar } from "@/components/avatars/AvatarSVG";

export interface PodiumPlayer {
  name: string;
  avatar: string;
  color: string;
  score: number;
  isMe: boolean;
}

interface PodiumProps {
  players: PodiumPlayer[]; // sorted by score descending, top 3
}

const MEDALS = ["🥇", "🥈", "🥉"];
const BLOCK_HEIGHTS = [120, 90, 70];
const AVATAR_SIZES = [52, 40, 36];
const COL_WIDTHS = [96, 80, 72];

export function Podium({ players }: PodiumProps) {
  if (players.length === 0) return null;

  const top = players.slice(0, 3);

  if (top.length === 1) {
    return (
      <div className="flex justify-center mb-8">
        <PodiumColumn player={top[0]} rank={0} delay={0.6} />
      </div>
    );
  }

  if (top.length === 2) {
    return (
      <div className="flex justify-center items-end gap-3 mb-8">
        <PodiumColumn player={top[1]} rank={1} delay={0.3} />
        <PodiumColumn player={top[0]} rank={0} delay={0.6} />
      </div>
    );
  }

  // 3 players: 2nd left, 1st center, 3rd right
  return (
    <div className="flex justify-center items-end gap-3 mb-8">
      <PodiumColumn player={top[1]} rank={1} delay={0.3} />
      <PodiumColumn player={top[0]} rank={0} delay={0.6} />
      <PodiumColumn player={top[2]} rank={2} delay={0} />
    </div>
  );
}

function PodiumColumn({
  player,
  rank,
  delay,
}: {
  player: PodiumPlayer;
  rank: number;
  delay: number;
}) {
  const blockHeight = BLOCK_HEIGHTS[rank];
  const avatarSize = AVATAR_SIZES[rank];
  const colWidth = COL_WIDTHS[rank];
  const isFirst = rank === 0;

  return (
    <div
      className="animate-podium-rise flex flex-col items-center"
      style={{ animationDelay: `${delay}s`, width: colWidth }}
    >
      {/* Medal badge */}
      <div className={`mb-1 ${isFirst ? "text-3xl" : "text-2xl"}`}>
        {MEDALS[rank]}
      </div>

      {/* Avatar */}
      <div
        className={`rounded-full mb-1.5 flex-shrink-0 ${
          player.isMe ? "ring-2 ring-white/60 ring-offset-2 ring-offset-black/50" : ""
        }`}
        style={{ backgroundColor: `${player.color}25` }}
      >
        <Avatar avatarId={player.avatar} size={avatarSize} />
      </div>

      {/* Name */}
      <p
        className={`text-white font-bold text-center w-full truncate px-1 leading-tight ${
          isFirst ? "text-sm" : "text-xs"
        }`}
        title={player.name}
      >
        {player.name}
      </p>

      {/* Score */}
      <p
        className={`font-display font-bold text-white/80 mb-1.5 ${
          isFirst ? "text-lg" : "text-sm"
        }`}
      >
        {player.score}
      </p>

      {/* Podium block */}
      <div
        className="w-full rounded-t-md"
        style={{
          height: blockHeight,
          backgroundColor: `${player.color}18`,
          borderTop: `3px solid ${player.color}`,
          boxShadow: `0 0 16px ${player.color}20`,
        }}
      />
    </div>
  );
}
