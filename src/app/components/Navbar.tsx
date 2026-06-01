import { useEffect, useState } from 'react';
import { Upload, Hexagon } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';

interface NavbarProps {
  session: Session | null;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onOpenProfile: () => void;
  onNavigateCreate: () => void;
}

export default function Navbar({ session, onOpenLogin, onOpenSignup, onOpenProfile, onNavigateCreate }: NavbarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Fetch just the avatar for the small navbar icon
  useEffect(() => {
    if (session?.user?.id) {
      supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        });
    }
  }, [session]);

  return (
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
            <button onClick={onNavigateCreate} className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer bg-none border-none p-0">
              <Upload className="w-4 h-4" /> Create Puzzle
            </button>
          )}
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
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
  );
}