import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { supabase } from "../supabaseClient.ts";
import { Session } from '@supabase/supabase-js';
import StandalonePiece from './components/StandalonePiece';
import MidgroundScene from './components/MidgroundScene';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import PlayerDrawer from './components/PlayerDrawer';

const FALLBACK_IMG = "https://images.unsplash.com/photo-1770353804331-9fefe8411761?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

export default function App() {
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [appReady, setAppReady] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState<any>(null);
  const [loadingPuzzle, setLoadingPuzzle] = useState(true);

  // Modal & Drawer States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX / window.innerWidth);
    mouseY.set(e.clientY / window.innerHeight);
  };

  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  const rotateX = useTransform(smoothY, [0, 1], [30, 12]);
  const rotateY = useTransform(smoothX, [0, 1], [-22, -4]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setAppReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
      // Auto-close drawer if user logs out
      if (!session) setShowProfileDrawer(false);
    });

    async function fetchStarterPuzzle() {
      try {
        const { data, error } = await supabase
          .from('puzzles')
          .select('*')
          .eq('created_by_admin', true)
          .limit(1)
          .single();

        if (error) throw error;
        setCurrentPuzzle(data);
      } catch (error) {
        console.error("Error loading starter puzzle:", error);
      } finally {
        setLoadingPuzzle(false);
      }
    }

    fetchStarterPuzzle();
    return () => subscription.unsubscribe();
  }, []);

  if (!appReady) {
    return (
      <div className="min-h-screen bg-[#090b12] flex items-center justify-center text-[#d3c5f6]">
        <div className="animate-pulse font-['Outfit'] tracking-widest text-xs font-bold uppercase">
          Initializing PuzzleVerse System...
        </div>
      </div>
    );
  }

  const activePuzzleImage = currentPuzzle?.image_url || FALLBACK_IMG;

  return (
    <div
      onMouseMove={handleMouseMove}
      className="w-full min-h-screen relative overflow-hidden text-white selection:bg-[#3b2a60]/50 font-['Space_Grotesk']"
      style={{ backgroundColor: "#090B12" }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_140%,_#3b2a60_0%,_#090b12_65%,_#090b12_100%)] pointer-events-none" />

      <div
        className="absolute inset-0 opacity-15 pointer-events-none mix-blend-screen hidden sm:block"
        style={{
          backgroundImage: 'linear-gradient(#d3c5f6 1px, transparent 1px), linear-gradient(90deg, #d3c5f6 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          transform: 'perspective(1200px) rotateX(65deg) translateY(-200px) scale(4)',
          transformOrigin: 'top center',
        }}
      />

      {/* Floating Pieces - Hidden on mobile, visible on md+ screens */}
      <div className="hidden md:block">
        <StandalonePiece img={activePuzzleImage} x="6vw"  y="18vh" scale={1.3} rotate={15}  speed={0.6} smoothX={smoothX} smoothY={smoothY} zIndex={5} />
        <StandalonePiece img={activePuzzleImage} x="84vw" y="12vh" scale={1.1} rotate={-25} speed={0.7} smoothX={smoothX} smoothY={smoothY} zIndex={5} />
        <StandalonePiece img={activePuzzleImage} x="10vw" y="78vh" scale={1.5} rotate={45}  speed={0.9} smoothX={smoothX} smoothY={smoothY} zIndex={5} />
        <StandalonePiece img={activePuzzleImage} x="85vw" y="72vh" scale={1.4} rotate={-15} speed={0.8} smoothX={smoothX} smoothY={smoothY} zIndex={5} />
      </div>

      {/* Main Content Layer */}
      <div className="relative z-20 flex flex-col min-h-screen">

        <Navbar
          session={session}
          onOpenLogin={() => { setAuthMode('login'); setShowAuthModal(true); }}
          onOpenSignup={() => { setAuthMode('signup'); setShowAuthModal(true); }}
          onOpenProfile={() => setShowProfileDrawer(true)}
          onNavigateCreate={() => navigate('/create')}
        />

        <main className="flex-1 flex flex-col items-center justify-start pt-6 md:pt-14 px-4">
          <div className="text-center max-w-4xl mx-auto z-30 w-full">
            <div className="inline-flex items-center gap-2 px-2.5 md:px-3.5 py-1 md:py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 md:mb-6">
              <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] md:text-[10px] font-bold text-[#d3c5f6] tracking-wider md:tracking-widest uppercase">Multiplayer Lobbies Live</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight font-['Outfit'] leading-tight md:leading-none text-white">
              Your Images. Your Friends. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d3c5f6] via-indigo-300 to-[#d3c5f6]">
                Your World. Puzzled.
              </span>
            </h1>

            <p className="mt-4 md:mt-6 text-sm md:text-base lg:text-lg text-[#d3c5f6]/70 max-w-2xl mx-auto leading-relaxed px-2">
              {session ? (
                <>Welcome back, <span className="text-white font-bold">{session.user.email}</span>! Ready to complete together?</>
              ) : (
                <>The ultimate collaborative, custom jigsaw experience. Create, connect, and complete together.</>
              )}
            </p>

            <div className="mt-6 md:mt-8 flex items-center justify-center">
              {session ? (
                <button
                  onClick={() => navigate('/create')}
                  className="px-5 md:px-7 py-2.5 md:py-3.5 rounded-lg md:rounded-xl bg-[#d3c5f6] text-[#3b2a60] font-['Outfit'] font-bold text-sm md:text-base transition-all shadow-[0_0_30px_rgba(211,197,246,0.25)] hover:shadow-[0_0_40px_rgba(211,197,246,0.45)] hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-[#3b2a60]" /> Create a New Puzzle
                </button>
              ) : (
                <button
                  onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                  className="px-5 md:px-7 py-2.5 md:py-3.5 rounded-lg md:rounded-xl bg-[#d3c5f6] text-[#3b2a60] font-['Outfit'] font-bold text-sm md:text-base transition-all shadow-[0_0_30px_rgba(211,197,246,0.25)] hover:shadow-[0_0_40px_rgba(211,197,246,0.45)] hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-[#3b2a60]" /> Start Your First Puzzle Free
                </button>
              )}
            </div>
          </div>

          <div
            className="flex-1 w-full max-w-5xl relative flex flex-col items-center justify-center mt-12 md:mt-16 z-10"
            style={{ perspective: 1500 }}
          >
            <motion.div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', rotateX, rotateY, rotateZ: 3, transformStyle: 'preserve-3d' }}>
              {loadingPuzzle ? (
                <div className="text-[#d3c5f6] font-['Outfit'] animate-pulse">Initializing Canvas...</div>
              ) : (
                <MidgroundScene activeImage={activePuzzleImage} />
              )}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAuthModal(false)}
              className="flex items-center gap-2 mb-3 text-[#d3c5f6]/70 hover:text-white transition-colors text-sm font-semibold cursor-pointer"
            >
              ← Back to Home
            </button>
            <Auth
              initialMode={authMode}
              onAuthSuccess={() => setShowAuthModal(false)}
            />
          </div>
        </div>
      )}

      {/* Player Slide-Out Drawer */}
      {session && (
        <PlayerDrawer
          isOpen={showProfileDrawer}
          onClose={() => setShowProfileDrawer(false)}
          session={session}
        />
      )}
    </div>
  );
}