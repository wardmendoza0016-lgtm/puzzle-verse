import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Hexagon, ArrowLeft, Copy, Check, Users, Play,
  Settings, LogOut, Shield, Grid3x3, Swords, Lock, Globe
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Session } from '@supabase/supabase-js';

interface LobbyProps {
  session: Session;
}

interface GameSession {
  id: string;
  puzzle_id: string;
  host_id: string;
  max_players: number;
  active_player_ids: string[];
  status: string;
  room_code: string;
  created_at: string;
}

interface Puzzle {
  id: string;
  title: string;
  image_url: string;
  grid_size: number;
  difficulty: string;
  is_public: boolean;
}

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  medium: 'text-amber-400   bg-amber-400/10   border-amber-400/30',
  hard:   'text-red-400     bg-red-400/10     border-red-400/30',
};

export default function Lobby({ session }: LobbyProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Core data
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI states
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Settings edit state
  const [editMaxPlayers, setEditMaxPlayers] = useState(5);
  const [savingSettings, setSavingSettings] = useState(false);

  // Countdown state
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isHost = gameSession?.host_id === session.user.id;

  // ── Initial load ────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    loadLobby();
  }, [id]);

  const loadLobby = async () => {
    setLoading(true);
    try {
      // Fetch game session
      const { data: gs, error: gsError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (gsError) throw gsError;
      setGameSession(gs);
      setEditMaxPlayers(gs.max_players);

      // Fetch puzzle
      const { data: pz, error: pzError } = await supabase
        .from('puzzles')
        .select('*')
        .eq('id', gs.puzzle_id)
        .single();

      if (pzError) throw pzError;
      setPuzzle(pz);

      // Join lobby if not already in it
      if (!gs.active_player_ids.includes(session.user.id)) {
        const updated = [...gs.active_player_ids, session.user.id];
        await supabase
          .from('game_sessions')
          .update({ active_player_ids: updated })
          .eq('id', id);
        gs.active_player_ids = updated;
      }

      // Fetch player profiles
      await fetchPlayers(gs.active_player_ids);

    } catch (err: any) {
      setError(err.message || 'Failed to load lobby.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async (playerIds: string[]) => {
    if (!playerIds.length) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', playerIds);

    if (!error && data) setPlayers(data);
  };

  // ── Realtime subscription ───────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`lobby:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${id}` },
        async (payload) => {
          const updated = payload.new as GameSession;
          setGameSession(updated);
          await fetchPlayers(updated.active_player_ids);

          // If status flipped to 'playing', start the countdown
          if (updated.status === 'playing') {
            startCountdown();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // ── Countdown ───────────────────────────────────────────────
  const startCountdown = () => {
    setCountdown(3);
    let count = 3;
    countdownRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(countdownRef.current!);
        setCountdown(null);
        navigate(`/game/${id}`);
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ── Host: Start game ────────────────────────────────────────
  const handleStartGame = async () => {
    if (!isHost) return;
    const { error } = await supabase
      .from('game_sessions')
      .update({ status: 'playing' })
      .eq('id', id);

    if (error) setError(error.message);
    // Realtime will pick up the status change and trigger countdown for everyone
  };

  // ── Leave lobby ─────────────────────────────────────────────
  const handleLeave = async () => {
    setLeaving(true);
    try {
      if (isHost) {
        // Host leaving — delete the session entirely
        await supabase.from('game_sessions').delete().eq('id', id);
      } else {
        // Guest leaving — remove from active_player_ids
        const updated = gameSession!.active_player_ids.filter(
          (pid) => pid !== session.user.id
        );
        await supabase
          .from('game_sessions')
          .update({ active_player_ids: updated })
          .eq('id', id);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLeaving(false);
    }
  };

  // ── Host: Save settings ─────────────────────────────────────
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase
      .from('game_sessions')
      .update({ max_players: editMaxPlayers })
      .eq('id', id);

    if (error) setError(error.message);
    else setShowSettings(false);
    setSavingSettings(false);
  };

  // ── Copy room code ──────────────────────────────────────────
  const handleCopyCode = () => {
    if (!gameSession?.room_code) return;
    navigator.clipboard.writeText(gameSession.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading / Error states ──────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#090b12] flex items-center justify-center text-[#d3c5f6]">
      <div className="animate-pulse font-['Outfit'] tracking-widest text-xs font-bold uppercase">
        Loading Lobby...
      </div>
    </div>
  );

  if (error || !gameSession || !puzzle) return (
    <div className="min-h-screen bg-[#090b12] flex flex-col items-center justify-center text-[#d3c5f6] gap-4">
      <p className="text-red-400 text-sm">{error || 'Lobby not found.'}</p>
      <button onClick={() => navigate('/')} className="text-sm text-[#d3c5f6]/60 hover:text-white transition-colors cursor-pointer">
        ← Back to Home
      </button>
    </div>
  );

  return (
    <div
      className="w-full min-h-screen relative overflow-hidden text-white font-['Space_Grotesk']"
      style={{ backgroundColor: '#090B12' }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_140%,_#3b2a60_0%,_#090b12_65%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: 'linear-gradient(#d3c5f6 1px, transparent 1px), linear-gradient(90deg, #d3c5f6 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          transform: 'perspective(1200px) rotateX(65deg) translateY(-200px) scale(4)',
          transformOrigin: 'top center',
        }}
      />

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center"
          >
            <p className="text-[#d3c5f6]/60 text-sm font-bold uppercase tracking-widest mb-4">
              Game Starting In
            </p>
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[10rem] font-extrabold font-['Outfit'] text-white leading-none"
              style={{ textShadow: '0 0 80px rgba(211,197,246,0.6)' }}
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 mt-4 z-50 relative">
        <div className="w-full flex items-center justify-between px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b2a60] to-[#251842] flex items-center justify-center border border-white/10">
              <Hexagon className="text-[#d3c5f6] w-5 h-5 fill-[#d3c5f6]/10" />
            </div>
            <span className="text-lg font-extrabold tracking-tight font-['Outfit'] text-white">PuzzleVerse</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Lobby Open</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-semibold text-[#d3c5f6]/70 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── LEFT: Puzzle Info ── */}
          <div className="space-y-4">

            {/* Puzzle preview card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(59,42,96,0.3)]">
              <div className="relative">
                <img
                  src={puzzle.image_url}
                  alt={puzzle.title}
                  className="w-full h-52 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090b12] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h2 className="text-xl font-extrabold font-['Outfit'] text-white leading-tight">
                    {puzzle.title}
                  </h2>
                </div>
              </div>

              <div className="p-4 flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <Grid3x3 className="w-3.5 h-3.5 text-[#d3c5f6]" />
                  <span className="text-xs font-bold text-white">{puzzle.grid_size} pieces</span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold capitalize ${DIFFICULTY_COLOR[puzzle.difficulty]}`}>
                  <Swords className="w-3.5 h-3.5" />
                  {puzzle.difficulty}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  {puzzle.is_public
                    ? <Globe className="w-3.5 h-3.5 text-[#d3c5f6]" />
                    : <Lock className="w-3.5 h-3.5 text-[#d3c5f6]" />
                  }
                  <span className="text-xs font-bold text-white capitalize">
                    {puzzle.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>

            {/* Room code card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_0_40px_rgba(59,42,96,0.2)]">
              <p className="text-xs uppercase tracking-widest text-[#d3c5f6]/60 font-bold mb-3">
                Room Code
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#090b12]/60 border border-white/10 rounded-xl px-5 py-3 flex items-center justify-center">
                  <span className="text-3xl font-extrabold font-['Outfit'] tracking-[0.3em] text-white">
                    {gameSession.room_code}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-3 rounded-xl bg-[#d3c5f6]/10 border border-[#d3c5f6]/20 hover:bg-[#d3c5f6]/20 transition-all cursor-pointer"
                >
                  {copied
                    ? <Check className="w-5 h-5 text-emerald-400" />
                    : <Copy className="w-5 h-5 text-[#d3c5f6]" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-[#d3c5f6]/40 mt-2 text-center">
                Share this code with friends to let them join
              </p>
            </div>

            {/* Host settings panel */}
            {isHost && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#d3c5f6]" />
                    <span className="text-sm font-bold">Lobby Settings</span>
                  </div>
                  <motion.div animate={{ rotate: showSettings ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ArrowLeft className="w-4 h-4 text-[#d3c5f6]/60 -rotate-90" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-[#d3c5f6]/80 mb-3 font-bold">
                            Max Players (2–5)
                          </label>
                          <div className="flex gap-2">
                            {[2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                onClick={() => setEditMaxPlayers(n)}
                                className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all cursor-pointer
                                  ${editMaxPlayers === n
                                    ? 'border-[#d3c5f6] bg-[#d3c5f6]/10 text-white'
                                    : 'border-white/10 text-white/40 hover:text-white/70'
                                  }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={handleSaveSettings}
                          disabled={savingSettings}
                          className="w-full py-2.5 rounded-lg bg-[#d3c5f6] text-[#3b2a60] text-sm font-bold hover:bg-white transition-all cursor-pointer disabled:opacity-50"
                        >
                          {savingSettings ? 'Saving...' : 'Save Settings'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── RIGHT: Players + Actions ── */}
          <div className="space-y-4">

            {/* Players list */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_0_40px_rgba(59,42,96,0.2)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#d3c5f6]" />
                  <span className="text-sm font-bold uppercase tracking-wider text-[#d3c5f6]/80">
                    Players
                  </span>
                </div>
                <span className="text-xs font-bold text-white/40">
                  {players.length} / {gameSession.max_players}
                </span>
              </div>

              <div className="space-y-2">
                {players.map((player) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <img
                      src={player.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`}
                      alt={player.username}
                      className="w-9 h-9 rounded-full border border-white/10 bg-[#090b12]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {player.full_name || player.username}
                      </p>
                      <p className="text-xs text-[#d3c5f6]/50">@{player.username}</p>
                    </div>
                    {player.id === gameSession.host_id && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-400/10 border border-amber-400/20">
                        <Shield className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-bold text-amber-400 uppercase">Host</span>
                      </div>
                    )}
                    {player.id === session.user.id && player.id !== gameSession.host_id && (
                      <span className="text-[10px] font-bold text-[#d3c5f6]/40 uppercase">You</span>
                    )}
                  </motion.div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: gameSession.max_players - players.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10"
                  >
                    <div className="w-9 h-9 rounded-full border border-dashed border-white/10 bg-white/5" />
                    <span className="text-xs text-white/20 font-medium">Waiting for player...</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={players.length < 1}
                  className="w-full py-4 rounded-xl bg-[#d3c5f6] text-[#3b2a60] font-['Outfit'] font-bold text-base hover:bg-white transition-all shadow-[0_0_30px_rgba(211,197,246,0.25)] hover:shadow-[0_0_40px_rgba(211,197,246,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-[#3b2a60]" /> Start Puzzle
                </button>
              ) : (
                <div className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <p className="text-sm text-[#d3c5f6]/60 font-medium">
                    Waiting for host to start the game...
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#d3c5f6]/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleLeave}
                disabled={leaving}
                className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {isHost ? 'Close Lobby' : 'Leave Lobby'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}