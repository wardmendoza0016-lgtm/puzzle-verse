import { useEffect, useState, useRef } from 'react';
import { Upload, Hexagon, Hash, ArrowRight, X, Users, Grid3x3, Swords, Loader2 } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  session: Session | null;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onOpenProfile: () => void;
  onNavigateCreate: () => void;
}

interface LobbyPreview {
  sessionId: string;
  puzzleTitle: string;
  puzzleImage: string;
  difficulty: string;
  gridSize: number;
  playerCount: number;
  maxPlayers: number;
}

export default function Navbar({ session, onOpenLogin, onOpenSignup, onOpenProfile, onNavigateCreate }: NavbarProps) {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Room code states
  const [showRoomInput, setShowRoomInput] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [lobbyPreview, setLobbyPreview] = useState<LobbyPreview | null>(null);
  const [joining, setJoining] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch avatar
  useEffect(() => {
    if (session?.user?.id) {
      supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        });
    }
  }, [session]);

  // Focus input when room code panel opens
  useEffect(() => {
    if (showRoomInput) setTimeout(() => inputRef.current?.focus(), 100);
  }, [showRoomInput]);

  const handleCloseRoom = () => {
    setShowRoomInput(false);
    setRoomCode('');
    setRoomError('');
    setLobbyPreview(null);
  };

  // ── Search by room code ─────────────────────────────────────
  const handleSearchRoom = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setRoomError('Please enter a valid room code.');
      return;
    }

    setSearching(true);
    setRoomError('');
    setLobbyPreview(null);

    try {
      // Find the game session by room code
      const { data: gs, error: gsError } = await supabase
        .from('game_sessions')
        .select('id, puzzle_id, active_player_ids, max_players, status, room_code')
        .eq('room_code', code)
        .eq('status', 'lobby')
        .single();

      if (gsError || !gs) {
        setRoomError('Room not found or the game has already started.');
        return;
      }

      // Check if lobby is full
      if (gs.active_player_ids.length >= gs.max_players) {
        setRoomError('This lobby is full.');
        return;
      }

      // Fetch the puzzle details
      const { data: pz, error: pzError } = await supabase
        .from('puzzles')
        .select('title, image_url, difficulty, grid_size')
        .eq('id', gs.puzzle_id)
        .single();

      if (pzError || !pz) {
        setRoomError('Could not load puzzle details.');
        return;
      }

      setLobbyPreview({
        sessionId: gs.id,
        puzzleTitle: pz.title,
        puzzleImage: pz.image_url,
        difficulty: pz.difficulty,
        gridSize: pz.grid_size,
        playerCount: gs.active_player_ids.length,
        maxPlayers: gs.max_players,
      });

    } catch (err: any) {
      setRoomError(err.message || 'Something went wrong.');
    } finally {
      setSearching(false);
    }
  };

  // ── Join the lobby ──────────────────────────────────────────
  const handleJoinLobby = async () => {
    if (!lobbyPreview || !session) return;
    setJoining(true);

    try {
      // Fetch current player list fresh to avoid race conditions
      const { data: gs, error } = await supabase
        .from('game_sessions')
        .select('active_player_ids, max_players')
        .eq('id', lobbyPreview.sessionId)
        .single();

      if (error || !gs) throw new Error('Lobby no longer available.');
      if (gs.active_player_ids.length >= gs.max_players) throw new Error('Lobby is now full.');

      // Add player if not already in
      if (!gs.active_player_ids.includes(session.user.id)) {
        const updated = [...gs.active_player_ids, session.user.id];
        const { error: updateError } = await supabase
          .from('game_sessions')
          .update({ active_player_ids: updated })
          .eq('id', lobbyPreview.sessionId);

        if (updateError) throw updateError;
      }

      handleCloseRoom();
      navigate(`/lobby/${lobbyPreview.sessionId}`);
    } catch (err: any) {
      setRoomError(err.message || 'Failed to join lobby.');
    } finally {
      setJoining(false);
    }
  };

  const difficultyColor: Record<string, string> = {
    easy:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    medium: 'text-amber-400   bg-amber-400/10   border-amber-400/30',
    hard:   'text-red-400     bg-red-400/10     border-red-400/30',
  };

  return (
    <>
      <header className="w-full max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-4 mt-2 md:mt-4 z-50 pointer-events-auto">
        <div className="w-full flex items-center justify-between px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg gap-2">
          
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer flex-shrink-0">
            <div className="w-8 md:w-9 h-8 md:h-9 rounded-lg md:rounded-xl bg-gradient-to-br from-[#3b2a60] to-[#251842] flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(211,197,246,0.2)]">
              <Hexagon className="text-[#d3c5f6] w-4 md:w-5 h-4 md:h-5 fill-[#d3c5f6]/10" />
            </div>
            <span className="text-base md:text-lg font-extrabold tracking-tight font-['Outfit'] text-white hidden sm:inline">PuzzleVerse</span>
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#d3c5f6]/80">
            <a href="#" className="hover:text-white transition-colors">Explore</a>
            <a href="#" className="hover:text-white transition-colors">Community</a>
            {session && (
              <button
                onClick={onNavigateCreate}
                className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer bg-none border-none p-0"
              >
                <Upload className="w-4 h-4" /> Create Puzzle
              </button>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">

            {/* Join by Room Code button — only for logged-in users */}
            {session && (
              <button
                onClick={() => setShowRoomInput(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer text-xs font-bold text-[#d3c5f6]/80 hover:text-white"
              >
                <Hash className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Join Room</span>
              </button>
            )}

            {/* Auth Actions */}
            {session ? (
              <button
                onClick={onOpenProfile}
                className="relative w-10 h-10 rounded-full border-2 border-[#d3c5f6]/40 flex items-center justify-center text-xs font-bold text-[#d3c5f6] bg-[#090b12] hover:border-[#d3c5f6] transition-colors cursor-pointer overflow-hidden shadow-[0_0_15px_rgba(211,197,246,0.15)] hover:shadow-[0_0_25px_rgba(211,197,246,0.4)]"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  session.user.email?.substring(0, 2).toUpperCase()
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={onOpenLogin}
                  className="text-xs md:text-sm font-semibold text-[#d3c5f6]/80 hover:text-white transition-colors cursor-pointer hidden sm:inline"
                >
                  Log In
                </button>
                <button
                  onClick={onOpenSignup}
                  className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-[#d3c5f6] text-[#3b2a60] text-xs md:text-sm font-bold hover:bg-white transition-all shadow-[0_0_15px_rgba(211,197,246,0.2)] cursor-pointer min-h-[40px] md:min-h-[auto]"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Room Code Modal ── */}
      <AnimatePresence>
        {showRoomInput && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseRoom}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-sm z-[101] px-4"
            >
              <div className="bg-[#0e1120] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(59,42,96,0.5)] overflow-hidden">
                
                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#d3c5f6]" />
                    <span className="text-sm font-bold text-white font-['Outfit']">Join by Room Code</span>
                  </div>
                  <button
                    onClick={handleCloseRoom}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-[#d3c5f6]/60" />
                  </button>
                </div>

                <div className="p-5 space-y-4">

                  {/* Input row */}
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={roomCode}
                      onChange={(e) => {
                        setRoomCode(e.target.value.toUpperCase());
                        setRoomError('');
                        setLobbyPreview(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchRoom()}
                      placeholder="Enter code (e.g. AB12CD)"
                      maxLength={8}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-[#d3c5f6] transition-colors text-sm font-mono tracking-widest uppercase"
                    />
                    <button
                      onClick={handleSearchRoom}
                      disabled={searching || !roomCode.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#d3c5f6] text-[#3b2a60] font-bold text-sm hover:bg-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {searching
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ArrowRight className="w-4 h-4" />
                      }
                    </button>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {roomError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-red-400 font-medium"
                      >
                        {roomError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Lobby preview */}
                  <AnimatePresence>
                    {lobbyPreview && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-white/10 overflow-hidden"
                      >
                        {/* Puzzle image */}
                        <div className="relative h-32">
                          <img
                            src={lobbyPreview.puzzleImage}
                            alt={lobbyPreview.puzzleTitle}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1120] via-[#0e1120]/40 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <p className="text-sm font-extrabold font-['Outfit'] text-white leading-tight">
                              {lobbyPreview.puzzleTitle}
                            </p>
                          </div>
                        </div>

                        {/* Puzzle meta */}
                        <div className="p-3 bg-white/5 flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                            <Grid3x3 className="w-3 h-3 text-[#d3c5f6]" />
                            <span className="text-[10px] font-bold text-white">{lobbyPreview.gridSize} pcs</span>
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold capitalize ${difficultyColor[lobbyPreview.difficulty]}`}>
                            <Swords className="w-3 h-3" />
                            {lobbyPreview.difficulty}
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 ml-auto">
                            <Users className="w-3 h-3 text-[#d3c5f6]" />
                            <span className="text-[10px] font-bold text-white">
                              {lobbyPreview.playerCount}/{lobbyPreview.maxPlayers}
                            </span>
                          </div>
                        </div>

                        {/* Join button */}
                        <div className="p-3 pt-0 bg-white/5">
                          <button
                            onClick={handleJoinLobby}
                            disabled={joining}
                            className="w-full py-2.5 rounded-xl bg-[#d3c5f6] text-[#3b2a60] font-['Outfit'] font-bold text-sm hover:bg-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(211,197,246,0.2)]"
                          >
                            {joining ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</>
                            ) : (
                              <><ArrowRight className="w-4 h-4" /> Join Lobby</>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}