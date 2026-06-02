import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Home, RotateCcw } from 'lucide-react';
import { GameSession, Profile, PlayerProgress } from '../Game';

interface ResultsScreenProps {
  gameSession: GameSession;
  players: Profile[];
  currentUserId: string;
  onExit: () => void;
}

function formatTime(isoStart: string, isoEnd: string | null): string {
  if (!isoEnd) return 'Did not finish';
  const ms = new Date(isoEnd).getTime() - new Date(isoStart).getTime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

// Simple confetti particle
function ConfettiPiece({ delay }: { delay: number }) {
  const colors = ['#d3c5f6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = `${Math.random() * 100}%`;
  const size = Math.random() * 8 + 4;

  return (
    <motion.div
      className="absolute top-0 rounded-sm pointer-events-none"
      style={{ left, width: size, height: size, backgroundColor: color }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{
        y: typeof window !== 'undefined' ? window.innerHeight + 20 : 800,
        opacity: [1, 1, 0],
        rotate: Math.random() * 720 - 360,
        x: Math.random() * 200 - 100,
      }}
      transition={{ duration: Math.random() * 2 + 2, delay, ease: 'easeIn' }}
    />
  );
}

export default function ResultsScreen({
  gameSession,
  players,
  currentUserId,
  onExit,
}: ResultsScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  const progress = gameSession.player_progress || {};
  const startedAt = gameSession.created_at;

  // Sort by finish time, then by pieces placed
  const ranked = [...players].sort((a, b) => {
    const pa: PlayerProgress = progress[a.id] || { placed: 0, total: 1, finishedAt: null };
    const pb: PlayerProgress = progress[b.id] || { placed: 0, total: 1, finishedAt: null };

    if (pa.finishedAt && pb.finishedAt) {
      return new Date(pa.finishedAt).getTime() - new Date(pb.finishedAt).getTime();
    }
    if (pa.finishedAt) return -1;
    if (pb.finishedAt) return 1;
    return (pb.placed / pb.total) - (pa.placed / pa.total);
  });

  const winner = ranked[0];
  const isWinner = winner?.id === currentUserId;

  useEffect(() => {
    // Stagger the entrance
    // Stop confetti after 4s
    setTimeout(() => setShowConfetti(false), 4000);
  }, []);

  const rankEmoji = ['🥇', '🥈', '🥉'];
  const rankLabel = ['1st Place', '2nd Place', '3rd Place'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      >
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 60 }).map((_, i) => (
              <ConfettiPiece key={i} delay={i * 0.05} />
            ))}
          </div>
        )}

        {/* Results card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.1 }}
          className="w-full max-w-md bg-[#0e1120] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(59,42,96,0.6)]"
        >
          {/* Header */}
          <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-b from-[#3b2a60]/40 to-transparent">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, delay: 0.3 }}
              className="text-6xl mb-3"
            >
              {isWinner ? '🏆' : '🧩'}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-extrabold font-['Outfit'] text-white"
            >
              {isWinner ? 'You Won!' : `${winner?.full_name || winner?.username} Won!`}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-[#d3c5f6]/60 mt-1"
            >
              {isWinner
                ? 'Incredible speed — puzzle complete!'
                : 'Better luck next time — great effort!'}
            </motion.p>
          </div>

          {/* Rankings */}
          <div className="px-6 pb-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-[#d3c5f6]/40 font-bold mb-3">
              Final Rankings
            </p>

            {ranked.map((player, index) => {
              const p: PlayerProgress = progress[player.id] || {
                placed: 0,
                total: 1,
                finishedAt: null,
              };
              const pct = Math.round((p.placed / p.total) * 100);
              const isMe = player.id === currentUserId;
              const isFirst = index === 0;

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isFirst
                      ? 'bg-amber-400/10 border-amber-400/20'
                      : isMe
                      ? 'bg-[#d3c5f6]/10 border-[#d3c5f6]/20'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  {/* Rank */}
                  <span className="text-xl w-8 text-center flex-shrink-0">
                    {rankEmoji[index] || `#${index + 1}`}
                  </span>

                  {/* Avatar */}
                  <img
                    src={player.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`}
                    alt={player.username}
                    className="w-9 h-9 rounded-full border border-white/10 bg-[#090b12] flex-shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white truncate">
                        {player.full_name || player.username}
                      </p>
                      {isMe && (
                        <span className="text-[9px] text-[#d3c5f6]/50 font-normal">(you)</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#d3c5f6]/40 mt-0.5">
                      {rankLabel[index] || `#${index + 1}`}
                    </p>
                  </div>

                  {/* Time / progress */}
                  <div className="text-right flex-shrink-0">
                    {p.finishedAt ? (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400">
                          {formatTime(startedAt, p.finishedAt)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#d3c5f6]/40 font-medium">
                        {pct}% done
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 pt-2 flex gap-3">
            <button
              onClick={onExit}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 rounded-xl bg-[#d3c5f6] text-[#3b2a60] text-sm font-bold hover:bg-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(211,197,246,0.2)]"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}