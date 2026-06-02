import { motion } from 'motion/react';
import { Trophy, Clock } from 'lucide-react';
import { GameSession, Profile, PlayerProgress } from '../Game';

interface PlayerSidebarProps {
  players: Profile[];
  gameSession: GameSession;
  currentUserId: string;
  totalPieces: number;
}

function formatTime(isoStart: string, isoEnd: string | null): string {
  if (!isoEnd) return 'In progress...';
  const ms = new Date(isoEnd).getTime() - new Date(isoStart).getTime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

export default function PlayerSidebar({ players, gameSession, currentUserId, totalPieces }: PlayerSidebarProps) {
  const progress = gameSession.player_progress || {};
  const startedAt = gameSession.created_at;

  // Sort players by: finished first (by finishedAt), then by placed count
  const sortedPlayers = [...players].sort((a, b) => {
    const pa = progress[a.id] || { placed: 0, total: totalPieces, finishedAt: null };
    const pb = progress[b.id] || { placed: 0, total: totalPieces, finishedAt: null };

    if (pa.finishedAt && pb.finishedAt) {
      return new Date(pa.finishedAt).getTime() - new Date(pb.finishedAt).getTime();
    }
    if (pa.finishedAt) return -1;
    if (pb.finishedAt) return 1;
    return (pb.placed / pb.total) - (pa.placed / pa.total);
  });

  const rankColors = ['text-amber-400', 'text-slate-300', 'text-amber-700'];
  const rankEmoji = ['🥇', '🥈', '🥉'];

  return (
    <div className="relative z-20 w-56 flex-shrink-0 border-l border-white/5 bg-[#090b12]/80 backdrop-blur-md flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#d3c5f6]/60">
          Leaderboard
        </span>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sortedPlayers.map((player, index) => {
          const p: PlayerProgress = progress[player.id] || {
            placed: 0,
            total: totalPieces,
            finishedAt: null,
          };
          const pct = Math.round((p.placed / p.total) * 100);
          const isMe = player.id === currentUserId;
          const isFinished = !!p.finishedAt;

          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl p-3 border transition-all ${
                isMe
                  ? 'bg-[#d3c5f6]/10 border-[#d3c5f6]/20'
                  : 'bg-white/5 border-white/5'
              }`}
            >
              {/* Player info row */}
              <div className="flex items-center gap-2 mb-2">
                {/* Rank */}
                <span className={`text-sm font-bold w-5 text-center ${rankColors[index] || 'text-white/40'}`}>
                  {rankEmoji[index] || `#${index + 1}`}
                </span>

                {/* Avatar */}
                <img
                  src={player.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`}
                  alt={player.username}
                  className="w-7 h-7 rounded-full border border-white/10 bg-[#090b12] flex-shrink-0"
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {player.full_name || player.username}
                    {isMe && <span className="text-[#d3c5f6]/50 font-normal"> (you)</span>}
                  </p>
                  {isFinished ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-[9px] text-emerald-400 font-bold">
                        {formatTime(startedAt, p.finishedAt)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[9px] text-[#d3c5f6]/40 mt-0.5">
                      {p.placed}/{p.total} pieces
                    </p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isFinished ? 'bg-emerald-400' : 'bg-[#d3c5f6]'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              {/* Percentage */}
              <div className="flex justify-end mt-1">
                <span className={`text-[9px] font-bold ${isFinished ? 'text-emerald-400' : 'text-[#d3c5f6]/60'}`}>
                  {isFinished ? '✓ Done' : `${pct}%`}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Game status footer */}
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${
            gameSession.status === 'playing' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
          }`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#d3c5f6]/40">
            {gameSession.status === 'playing' ? 'Game in progress' : 'Game complete'}
          </span>
        </div>
      </div>
    </div>
  );
}