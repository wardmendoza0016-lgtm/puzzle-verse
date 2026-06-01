import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Hexagon, Upload, ImagePlus, Lock, Globe, ChevronDown, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';

interface CreatePuzzleProps {
  session: Session;
}

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'] as const;
const GRID_OPTIONS = [
  { label: '16 pieces', value: 16, hint: 'Relaxed' },
  { label: '36 pieces', value: 36, hint: 'Casual' },
  { label: '64 pieces', value: 64, hint: 'Moderate' },
  { label: '100 pieces', value: 100, hint: 'Challenging' },
  { label: '196 pieces', value: 196, hint: 'Expert' },
] as const;

export default function CreatePuzzle({ session }: CreatePuzzleProps) {
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [gridSize, setGridSize] = useState<number>(36);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isPublic, setIsPublic] = useState(true);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── Image handling ──────────────────────────────────────────
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim()) { setError('Please enter a puzzle title.'); return; }
    if (!imageFile)     { setError('Please upload a puzzle image.'); return; }

    setSubmitting(true);
    setError('');

    try {
      // 1. Upload image to storage
      const fileExt = imageFile.name.split('.').pop();
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('puzzles')
        .upload(filePath, imageFile, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('puzzles')
        .getPublicUrl(filePath);

      // 2. Insert puzzle row
      const { data: puzzle, error: insertError } = await supabase
        .from('puzzles')
        .insert({
          title: title.trim(),
          image_url: publicUrl,
          grid_size: gridSize,
          difficulty,
          is_public: isPublic,
          created_by: session.user.id,
          created_by_admin: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 3. Navigate to lobby waiting room
      const { data: gameSession, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          puzzle_id: puzzle.id,
          host_id: session.user.id,
          status: 'lobby',
          active_player_ids: [session.user.id],
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 4. Navigate to lobby using the game session ID
      navigate(`/lobby/${gameSession.id}`);

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Difficulty color map ────────────────────────────────────
  const difficultyColor = {
    easy:   'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
    medium: 'text-amber-400   border-amber-400/40   bg-amber-400/10',
    hard:   'text-red-400     border-red-400/40     bg-red-400/10',
  };

  return (
    <div
      className="w-full min-h-screen relative overflow-hidden text-white font-['Space_Grotesk']"
      style={{ backgroundColor: '#090B12' }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_140%,_#3b2a60_0%,_#090b12_65%)] pointer-events-none" />

      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: 'linear-gradient(#d3c5f6 1px, transparent 1px), linear-gradient(90deg, #d3c5f6 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          transform: 'perspective(1200px) rotateX(65deg) translateY(-200px) scale(4)',
          transformOrigin: 'top center',
        }}
      />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 mt-4 z-50 relative">
        <div className="w-full flex items-center justify-between px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b2a60] to-[#251842] flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(211,197,246,0.2)]">
              <Hexagon className="text-[#d3c5f6] w-5 h-5 fill-[#d3c5f6]/10" />
            </div>
            <span className="text-lg font-extrabold tracking-tight font-['Outfit'] text-white">PuzzleVerse</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-semibold text-[#d3c5f6]/70 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-12">

        {/* Page title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#d3c5f6]" />
            <span className="text-[10px] font-bold text-[#d3c5f6] tracking-widest uppercase">New Puzzle</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-['Outfit'] tracking-tight text-white">
            Create Your Puzzle
          </h1>
          <p className="mt-3 text-[#d3c5f6]/60 text-sm">
            Upload an image, configure the challenge, and invite your friends.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(59,42,96,0.3)] space-y-8">

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Image Upload ── */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#d3c5f6]/80 mb-3 font-bold">
              Puzzle Image
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                <img
                  src={imagePreview}
                  alt="Puzzle preview"
                  className="w-full h-56 object-cover"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Upload className="w-7 h-7 text-white mb-2" />
                  <span className="text-sm font-bold text-white">Change Image</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDrop}
                className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200
                  ${isDraggingOver
                    ? 'border-[#d3c5f6] bg-[#d3c5f6]/10 scale-[1.01]'
                    : 'border-white/10 hover:border-[#d3c5f6]/50 hover:bg-white/5'
                  }`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <ImagePlus className="w-6 h-6 text-[#d3c5f6]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Drop your image here</p>
                  <p className="text-xs text-[#d3c5f6]/50 mt-1">or click to browse · PNG, JPG, WEBP · Max 10MB</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Title ── */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#d3c5f6]/80 mb-1.5 font-bold">
              Puzzle Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunset over Cebu"
              maxLength={80}
              className="w-full bg-[#090b12]/60 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-[#d3c5f6] transition-colors"
            />
          </div>

          {/* ── Grid Size ── */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#d3c5f6]/80 mb-3 font-bold">
              Piece Count
            </label>
            <div className="grid grid-cols-5 gap-2">
              {GRID_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGridSize(opt.value)}
                  className={`flex flex-col items-center py-3 px-2 rounded-xl border text-center transition-all cursor-pointer
                    ${gridSize === opt.value
                      ? 'border-[#d3c5f6] bg-[#d3c5f6]/10 text-white'
                      : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
                    }`}
                >
                  <span className="text-base font-extrabold font-['Outfit']">{opt.value}</span>
                  <span className="text-[9px] uppercase tracking-wide mt-0.5 opacity-70">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Difficulty ── */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#d3c5f6]/80 mb-3 font-bold">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-2.5 rounded-xl border text-sm font-bold capitalize transition-all cursor-pointer
                    ${difficulty === d
                      ? difficultyColor[d]
                      : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* ── Visibility ── */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#d3c5f6]/80 mb-3 font-bold">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsPublic(true)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer
                  ${isPublic
                    ? 'border-[#d3c5f6] bg-[#d3c5f6]/10 text-white'
                    : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                  }`}
              >
                <Globe className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold">Public</p>
                  <p className="text-[10px] opacity-60">Anyone can join</p>
                </div>
              </button>
              <button
                onClick={() => setIsPublic(false)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer
                  ${!isPublic
                    ? 'border-[#d3c5f6] bg-[#d3c5f6]/10 text-white'
                    : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                  }`}
              >
                <Lock className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold">Private</p>
                  <p className="text-[10px] opacity-60">Invite only</p>
                </div>
              </button>
            </div>
          </div>

          {/* ── Submit ── */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !imageFile || !title.trim()}
            className="w-full py-4 rounded-xl bg-[#d3c5f6] text-[#3b2a60] font-['Outfit'] font-bold text-base hover:bg-white transition-all shadow-[0_0_30px_rgba(211,197,246,0.25)] hover:shadow-[0_0_40px_rgba(211,197,246,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-[#3b2a60]/40 border-t-[#3b2a60] rounded-full animate-spin" />
                Creating Puzzle...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Create & Open Lobby
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}