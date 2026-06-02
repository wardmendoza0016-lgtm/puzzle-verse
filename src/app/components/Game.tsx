import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';

// Sub-components (we'll build these in Parts 2 & 3)
import PuzzleBoard from './game/PuzzleBoard';
import PieceTray from './game/PieceTray';
import PlayerSidebar from './game/PlayerSidebar';
import ResultsScreen from './game/ResultsScreen';

// ── Types ────────────────────────────────────────────────────
export interface PuzzlePiece {
  id: number;          // index 0..gridSize-1
  row: number;
  col: number;
  correctRow: number;
  correctCol: number;
  placed: boolean;     // true = correctly snapped on the board
  x: number;           // current x position in tray (unused once placed)
  y: number;           // current y position in tray
  placedBy: string | null; // user id of who placed it
}

export interface PlayerProgress {
  placed: number;
  total: number;
  finishedAt: string | null;
}

export interface GameSession {
  id: string;
  puzzle_id: string;
  host_id: string;
  status: string;
  active_player_ids: string[];
  piece_state: PuzzlePiece[];
  player_progress: Record<string, PlayerProgress>;
  finished_player_ids: string[];
  created_at: string;  // ← add this
}

export interface Puzzle {
  id: string;
  title: string;
  image_url: string;
  grid_size: number;
  difficulty: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

// ── Helpers ──────────────────────────────────────────────────

// Generate the initial piece state from grid_size
// grid_size = 16 means 4x4, 36 = 6x6, 64 = 8x8, etc.
export function buildInitialPieces(gridSize: number): PuzzlePiece[] {
  const cols = Math.sqrt(gridSize);
  const pieces: PuzzlePiece[] = [];

  for (let i = 0; i < gridSize; i++) {
    const correctRow = Math.floor(i / cols);
    const correctCol = i % cols;
    pieces.push({
      id: i,
      row: correctRow,
      col: correctCol,
      correctRow,
      correctCol,
      placed: false,
      x: 0,
      y: 0,
      placedBy: null,
    });
  }

  // Shuffle the tray order so pieces appear in random order
  return pieces.sort(() => Math.random() - 0.5);
}

// ── Component ────────────────────────────────────────────────
export default function Game({ session }: { session: Session }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  // ── Load game data ────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    loadGame();
  }, [id]);

  const loadGame = async () => {
    setLoading(true);
    try {
      // 1. Fetch game session
      const { data: gs, error: gsError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (gsError) throw gsError;

      // Redirect if lobby hasn't started
      if (gs.status === 'lobby') {
        navigate(`/lobby/${id}`, { replace: true });
        return;
      }

      setGameSession(gs);

      // 2. Fetch puzzle
      const { data: pz, error: pzError } = await supabase
        .from('puzzles')
        .select('*')
        .eq('id', gs.puzzle_id)
        .single();

      if (pzError) throw pzError;
      setPuzzle(pz);

      // 3. Fetch player profiles
      await fetchPlayers(gs.active_player_ids);

      // 4. Initialize pieces
      // If piece_state already exists in DB (rejoin), use it
      // Otherwise build fresh
      if (gs.piece_state && gs.piece_state.length > 0) {
        setPieces(gs.piece_state);
      } else {
            const initial = buildInitialPieces(pz.grid_size);
            setPieces(initial);

            // Persist initial piece state so rejoining players get the same layout
            await supabase
              .from('game_sessions')
              .update({ piece_state: initial })
              .eq('id', id);
          }

          // 5. Initialize player_progress if this player isn't tracked yet
          if (!gs.player_progress?.[session.user.id]) {
            const updatedProgress = {
              ...gs.player_progress,
              [session.user.id]: {
                placed: 0,
                total: pz.grid_size,  // ← must be pz.grid_size not hardcoded
                finishedAt: null,
              },
            };
      await supabase
        .from('game_sessions')
        .update({ player_progress: updatedProgress })
        .eq('id', id);

      // Also update local state immediately
      setGameSession({ ...gs, player_progress: updatedProgress });
    }

      // Show results if game already completed
      if (gs.status === 'completed') setShowResults(true);

    } catch (err: any) {
      setError(err.message || 'Failed to load game.');
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

  // ── Realtime subscription ─────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`game:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${id}`,
        },
        async (payload) => {
          const updated = payload.new as GameSession;
          setGameSession(updated);
          setPieces(updated.piece_state || []);

          // Refresh player list if someone joined/left
          if (updated.active_player_ids?.length) {
            await fetchPlayers(updated.active_player_ids);
          }

          // Show results screen if game completed
          if (updated.status === 'completed') {
            setShowResults(true);
          }
        }
      )
      .subscribe((status) => {
        console.log('Game Realtime:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // ── Handle piece placement ────────────────────────────────
  const handlePiecePlaced = useCallback(async (pieceId: number) => {
    if (!gameSession || !puzzle) return;

    // Update pieces locally first (optimistic)
    const updatedPieces = pieces.map(p =>
      p.id === pieceId
        ? { ...p, placed: true, placedBy: session.user.id }
        : p
    );
    setPieces(updatedPieces);

    const placedCount = updatedPieces.filter(
      p => p.placed && p.placedBy === session.user.id
    ).length;

    const isFinished = placedCount === puzzle.grid_size;
    const now = new Date().toISOString();

    // Build updated progress
    const updatedProgress = {
      ...gameSession.player_progress,
      [session.user.id]: {
        placed: placedCount,
        total: puzzle.grid_size,
        finishedAt: isFinished ? now : null,
      },
    };

    // Build updated finished players list
    const updatedFinished = isFinished
      ? [...(gameSession.finished_player_ids || []), session.user.id]
      : gameSession.finished_player_ids;

    // Determine if game is now complete (first finisher wins)
    const newStatus = isFinished ? 'completed' : gameSession.status;

    // Persist to Supabase — Realtime will broadcast to all players
    await supabase
      .from('game_sessions')
      .update({
        piece_state: updatedPieces,
        player_progress: updatedProgress,
        finished_player_ids: updatedFinished,
        status: newStatus,
      })
      .eq('id', id);

  }, [pieces, gameSession, puzzle, session.user.id, id]);

  // ── Loading / Error ───────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#090b12] flex items-center justify-center text-[#d3c5f6]">
      <div className="animate-pulse font-['Outfit'] tracking-widest text-xs font-bold uppercase">
        Loading Puzzle...
      </div>
    </div>
  );

  if (error || !gameSession || !puzzle) return (
    <div className="min-h-screen bg-[#090b12] flex flex-col items-center justify-center text-[#d3c5f6] gap-4">
      <p className="text-red-400 text-sm">{error || 'Game not found.'}</p>
      <button onClick={() => navigate('/')} className="text-sm text-[#d3c5f6]/60 hover:text-white transition-colors cursor-pointer">
        ← Back to Home
      </button>
    </div>
  );

  const cols = Math.sqrt(puzzle.grid_size);
  const unplacedPieces = pieces.filter(p => !p.placed);
  const myProgress = gameSession.player_progress?.[session.user.id];

  const BOARD_SIZE = Math.min(
    typeof window !== 'undefined' ? window.innerWidth * 0.55 : 500,
    typeof window !== 'undefined' ? window.innerHeight * 0.72 : 500,
  );

  return (
    <div
      className="w-full h-screen overflow-hidden text-white font-['Space_Grotesk'] flex flex-col"
      style={{ backgroundColor: '#090B12' }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#3b2a60_0%,_#090b12_60%)] pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#090b12]/80 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-[#d3c5f6]/60 hover:text-white transition-colors cursor-pointer"
          >
            ← Exit
          </button>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-sm font-bold font-['Outfit'] text-white truncate max-w-[200px]">
            {puzzle.title}
          </span>
        </div>

        {/* My progress */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#d3c5f6]/60">Your progress</span>
          <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#d3c5f6] rounded-full transition-all duration-500"
              style={{ width: `${((myProgress?.placed || 0) / puzzle.grid_size) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-white">
            {myProgress?.placed || 0}/{puzzle.grid_size}
          </span>
        </div>
      </div>

      {/* Game layout */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* Puzzle board — center */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <PuzzleBoard
            puzzle={puzzle}
            pieces={pieces}
            cols={cols}
            session={session}
            onPiecePlaced={handlePiecePlaced}
            boardSize={BOARD_SIZE}
          />
        </div>

        {/* Player sidebar — right */}
        <PlayerSidebar
          players={players}
          gameSession={gameSession}
          currentUserId={session.user.id}
          totalPieces={puzzle.grid_size}
        />
      </div>

      {/* Piece tray — bottom */}
      <PieceTray
        puzzle={puzzle}
        pieces={unplacedPieces}
        cols={cols}
        boardSize={BOARD_SIZE}
      />

      {/* Results overlay */}
      {showResults && (
        <ResultsScreen
          gameSession={gameSession}
          players={players}
          currentUserId={session.user.id}
          onExit={() => navigate('/')}
        />
      )}
    </div>
  );
}