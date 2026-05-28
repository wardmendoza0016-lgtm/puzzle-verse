import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Upload, Hexagon, Play, Users, ImageIcon, CheckCircle2 } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

// Unsplash Images
const MOUNTAIN_IMG = "https://images.unsplash.com/photo-1770353804331-9fefe8411761?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmVhdGh0YWtpbmclMjBtb3VudGFpbiUyMHZpc3RhfGVufDF8fHx8MTc3OTk0NjI1NHww&ixlib=rb-4.1.0&q=80&w=1080";
const AVATAR_1 = "https://images.unsplash.com/photo-1506863530036-1efeddceb993?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMGZyaWVuZGx5JTIwd29tYW58ZW58MXx8fHwxNzc5OTQ2MjU4fDA&ixlib=rb-4.1.0&q=80&w=1080";
const AVATAR_2 = "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMGZyaWVuZGx5JTIwbWFufGVufDF8fHx8MTc3OTc0MTU4Mnww&ixlib=rb-4.1.0&q=80&w=1080";
const AVATAR_3 = "https://images.unsplash.com/photo-1672462478040-a5920e2c23d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHNtaWxpbmclMjBwZXJzb258ZW58MXx8fHwxNzc5ODEzNzUxfDA&ixlib=rb-4.1.0&q=80&w=1080";

// --- Grid Geometry Generators ---
const vEdges = [
  [1, -1, 1],
  [-1, 1, -1],
  [1, -1, 1],
  [-1, 1, -1]
];
const hEdges = [
  [1, -1, 1, -1],
  [-1, 1, -1, 1],
  [1, -1, 1, -1]
];

function getPiecePath(c: number, r: number) {
  let path = "M 0 0 ";
  if (r === 0) path += "L 100 0 ";
  else {
    const dir = hEdges[r - 1][c];
    if (dir === -1) path += "L 37.5 0 C 37.5 -22, 62.5 -22, 62.5 0 L 100 0 ";
    else path += "L 37.5 0 C 37.5 22, 62.5 22, 62.5 0 L 100 0 ";
  }
  if (c === 3) path += "L 100 100 ";
  else {
    const dir = vEdges[r][c];
    if (dir === 1) path += "L 100 37.5 C 122 37.5, 122 62.5, 100 62.5 L 100 100 ";
    else path += "L 100 37.5 C 78 37.5, 78 62.5, 100 62.5 L 100 100 ";
  }
  if (r === 3) path += "L 0 100 ";
  else {
    const dir = hEdges[r][c];
    if (dir === 1) path += "L 62.5 100 C 62.5 122, 37.5 122, 37.5 100 L 0 100 ";
    else path += "L 62.5 100 C 62.5 78, 37.5 78, 37.5 100 L 0 100 ";
  }
  if (c === 0) path += "L 0 0 ";
  else {
    const dir = vEdges[r][c - 1];
    if (dir === -1) path += "L 0 62.5 C -22 62.5, -22 37.5, 0 37.5 L 0 0 ";
    else path += "L 0 62.5 C 22 62.5, 22 37.5, 0 37.5 L 0 0 ";
  }
  return path + "Z";
}

// --- Scene Config ---
const DETACHED: Record<string, any> = {
  "3,1": { x: 40, y: 140, z: 90, rotateZ: 15, rotateX: 20 },
  "2,3": { x: 120, y: 20, z: 130, rotateZ: -25, rotateY: 30 },
  "0,3": { x: 90, y: -100, z: 60, rotateZ: 35, rotateX: -20 },
  "3,3": { x: 160, y: 160, z: 180, rotateZ: -10, rotateX: 40 }
};

const AVATARS = [
  { id: 1, x: 460, y: 20, z: 80, img: AVATAR_1, target: { r: 0, c: 2 }, color: '#00f0ff' },
  { id: 2, x: 520, y: 150, z: 120, img: AVATAR_2, target: { r: 1, c: 3 }, color: '#b966ff' },
  { id: 3, x: 440, y: 290, z: 100, img: AVATAR_3, target: { r: 2, c: 2 }, color: '#00ffaa' },
];

const UPLOAD_NODE = { x: -200, y: 140, z: 110 };

// --- Subcomponents ---

function PuzzlePiece({ r, c, detachedProps }: { r: number, c: number, detachedProps?: any }) {
  const path = getPiecePath(c, r);
  
  // Base transforms
  const isDetached = !!detachedProps;
  const initial = isDetached 
    ? { x: detachedProps.x, y: detachedProps.y, z: detachedProps.z, rotateX: detachedProps.rotateX || 0, rotateY: detachedProps.rotateY || 0, rotateZ: detachedProps.rotateZ || 0 }
    : { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0 };

  const floatAnimation = isDetached ? {
    y: [detachedProps.y, detachedProps.y - 15, detachedProps.y],
    z: [detachedProps.z, detachedProps.z + 10, detachedProps.z],
    transition: { repeat: Infinity, duration: 4 + (r * c % 3), ease: "easeInOut" }
  } : {};

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: c * 100 - 30,
        top: r * 100 - 30,
        width: 160,
        height: 160,
        transformStyle: 'preserve-3d',
        filter: isDetached ? 'drop-shadow(0px 30px 20px rgba(0,0,0,0.6))' : 'drop-shadow(0px 4px 10px rgba(0,0,0,0.4))'
      }}
      initial={initial}
      animate={floatAnimation}
      whileHover={!isDetached ? { z: 20, scale: 1.05, transition: { duration: 0.3 } } : undefined}
    >
      <svg viewBox="-30 -30 160 160" className="w-full h-full">
        <defs>
          <clipPath id={`clip-${r}-${c}`}>
            <path d={path} />
          </clipPath>
        </defs>
        
        {/* Fill Image */}
        <image
          href={MOUNTAIN_IMG}
          width="400"
          height="400"
          x={-c * 100}
          y={-r * 100}
          clipPath={`url(#clip-${r}-${c})`}
          preserveAspectRatio="xMidYMid slice"
        />
        
        {/* Glossy Edge / Border */}
        <path d={path} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <path d={path} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="3" className="mix-blend-overlay" />
        
        {/* Glow if hovering or near (simulation) */}
        {!isDetached && (
           <path d={path} fill="rgba(255,255,255,0.05)" className="opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-auto" />
        )}
      </svg>
    </motion.div>
  );
}

function StandalonePiece({ x, y, scale, rotate, speed, smoothX, smoothY, img, zIndex }: any) {
  // A generic piece with all tabs out
  const path = "M 0 0 L 37.5 0 C 37.5 -22, 62.5 -22, 62.5 0 L 100 0 L 100 37.5 C 122 37.5, 122 62.5, 100 62.5 L 100 100 L 62.5 100 C 62.5 122, 37.5 122, 37.5 100 L 0 100 L 0 62.5 C -22 62.5, -22 37.5, 0 37.5 Z";
  
  const moveX = useTransform(smoothX, [0, 1], [-100 * speed, 100 * speed]);
  const moveY = useTransform(smoothY, [0, 1], [-100 * speed, 100 * speed]);

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        scale,
        rotate,
        x: moveX,
        y: moveY,
        zIndex,
        filter: 'drop-shadow(0px 40px 30px rgba(0,0,0,0.8)) blur(1px)' // Faux DOF
      }}
      className="pointer-events-none"
    >
      <div style={{ width: 120, height: 120 }}>
        <svg viewBox="-30 -30 160 160" className="w-full h-full">
          <defs>
            <clipPath id={`stand-clip-${x}-${y}`}>
              <path d={path} />
            </clipPath>
          </defs>
          <image href={img} width="300" height="300" clipPath={`url(#stand-clip-${x}-${y})`} x="-80" y="-80" preserveAspectRatio="xMidYMid slice" />
          <path d={path} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        </svg>
      </div>
    </motion.div>
  )
}

function MidgroundScene() {
  const getSvgCoords = (domX: number, domY: number) => [domX + 400, domY + 400];
  const getPieceCenter = (c: number, r: number) => [c * 100 + 50, r * 100 + 50];

  return (
    <div className="relative w-[400px] h-[400px]" style={{ transformStyle: 'preserve-3d' }}>
      
      {/* --- Connecting Lines (SVG behind the pieces but above bg) --- */}
      <div style={{ position: 'absolute', inset: -400, transform: 'translateZ(-20px)', pointerEvents: 'none' }}>
        <svg viewBox="0 0 1200 1200" className="w-full h-full">
           <defs>
             <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
             </linearGradient>
           </defs>
           
           {/* Lines to Avatars */}
           {AVATARS.map(av => {
             const [startX, startY] = getSvgCoords(av.x + 24, av.y + 24);
             const [targetX, targetY] = getPieceCenter(av.target.c, av.target.r);
             const [endX, endY] = getSvgCoords(targetX, targetY);
             const cx = (startX + endX) / 2;
             const cy = Math.min(startY, endY) - 80;
             return (
               <g key={av.id}>
                 <path d={`M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`} fill="none" stroke={av.color} strokeWidth="1.5" className="opacity-30" />
                 <path d={`M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`} fill="none" stroke={av.color} strokeWidth="3" strokeDasharray="8 12" className="opacity-80">
                   <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.5s" repeatCount="indefinite" />
                 </path>
               </g>
             )
           })}

           {/* Line from Upload */}
           {(() => {
              const [ux, uy] = getSvgCoords(UPLOAD_NODE.x + 32, UPLOAD_NODE.y + 32);
              const [tx, ty] = getSvgCoords(getPieceCenter(0, 1)[0], getPieceCenter(0, 1)[1]);
              const cx = (ux + tx) / 2;
              const cy = Math.max(uy, ty) + 60;
              return (
                <g>
                  <path d={`M ${ux} ${uy} Q ${cx} ${cy} ${tx} ${ty}`} fill="none" stroke="#fff" strokeWidth="2" className="opacity-20" />
                  <path d={`M ${ux} ${uy} Q ${cx} ${cy} ${tx} ${ty}`} fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="4 8" className="opacity-90">
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1s" repeatCount="indefinite" />
                  </path>
                </g>
              )
           })()}
        </svg>
      </div>

      {/* --- The Grid --- */}
      {Array.from({ length: 4 }).map((_, r) => (
        Array.from({ length: 4 }).map((_, c) => {
          const isDetached = DETACHED[`${r},${c}`];
          return <PuzzlePiece key={`${r}-${c}`} r={r} c={c} detachedProps={isDetached} />;
        })
      ))}

      {/* --- Upload Node --- */}
      <motion.div
        style={{ position: 'absolute', left: UPLOAD_NODE.x, top: UPLOAD_NODE.y, z: UPLOAD_NODE.z, transformStyle: 'preserve-3d' }}
        animate={{ y: [UPLOAD_NODE.y, UPLOAD_NODE.y - 15, UPLOAD_NODE.y] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.15)] overflow-hidden relative group cursor-pointer">
           <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 opacity-50 group-hover:opacity-100 transition-opacity" />
           <ImageIcon className="w-6 h-6 text-white/90 mb-1 z-10" />
           <div className="text-[9px] font-medium tracking-wider text-white/80 z-10 uppercase">Create</div>
        </div>
      </motion.div>

      {/* --- Avatars --- */}
      {AVATARS.map((av, i) => (
        <motion.div
          key={av.id}
          style={{ position: 'absolute', left: av.x, top: av.y, z: av.z, transformStyle: 'preserve-3d' }}
          animate={{ y: [av.y, av.y - 10, av.y], rotateY: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 3.5 + i * 0.5, ease: "easeInOut", delay: i * 0.3 }}
        >
          <div className="relative group cursor-pointer">
             <div className="absolute -inset-1 rounded-full opacity-60 group-hover:opacity-100 blur-md transition-opacity duration-500" style={{ backgroundColor: av.color }} />
             <div className="relative w-12 h-12 rounded-full p-[2px] bg-white/10 backdrop-blur-md overflow-hidden" style={{ border: `1px solid ${av.color}80` }}>
               <ImageWithFallback src={av.img} alt="Player" className="w-full h-full rounded-full object-cover" />
             </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}


export default function App() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX / window.innerWidth);
    mouseY.set(e.clientY / window.innerHeight);
  };

  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  // Moderate tilt based on mouse position
  const rotateX = useTransform(smoothY, [0, 1], [35, 15]);
  const rotateY = useTransform(smoothX, [0, 1], [-25, -5]);

  return (
    <div 
      onMouseMove={handleMouseMove} 
      className="w-full min-h-screen relative overflow-hidden text-white selection:bg-purple-500/30 font-['Space_Grotesk']"
      style={{ backgroundColor: '#090B12' }} // Deep digital space base
    >
      {/* --- Background Parallax Layer --- */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_150%,_#1a0b2e_0%,_#090b12_50%,_#090b12_100%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-screen"
           style={{
              backgroundImage: `
                linear-gradient(rgba(0, 240, 255, 0.15) 1px, transparent 1px), 
                linear-gradient(90deg, rgba(0, 240, 255, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '120px 120px',
              transform: 'perspective(1200px) rotateX(65deg) translateY(-200px) scale(4)',
              transformOrigin: 'top center'
           }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090B12]/50 to-[#090B12] pointer-events-none" />

      {/* --- Foreground Parallax Elements (Fastest) --- */}
      <StandalonePiece img={MOUNTAIN_IMG} x="5vw" y="20vh" scale={1.4} rotate={15} speed={0.8} smoothX={smoothX} smoothY={smoothY} zIndex={40} />
      <StandalonePiece img={MOUNTAIN_IMG} x="85vw" y="15vh" scale={1.1} rotate={-25} speed={0.9} smoothX={smoothX} smoothY={smoothY} zIndex={40} />
      <StandalonePiece img={MOUNTAIN_IMG} x="12vw" y="75vh" scale={1.8} rotate={45} speed={1.2} smoothX={smoothX} smoothY={smoothY} zIndex={40} />
      <StandalonePiece img={MOUNTAIN_IMG} x="82vw" y="70vh" scale={1.5} rotate={-15} speed={1.1} smoothX={smoothX} smoothY={smoothY} zIndex={40} />

      {/* --- Main Content --- */}
      <div className="relative z-20 flex flex-col min-h-screen">
        
        {/* Navbar */}
        <header className="w-full flex items-center justify-between px-8 py-6 max-w-7xl mx-auto pointer-events-auto z-50">
           <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 border border-white/10">
                 <Hexagon className="text-white w-6 h-6 fill-white/20" />
              </div>
              <span className="text-xl font-bold tracking-wide font-['Outfit']">PuzzleVerse</span>
           </div>

           <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
              <a href="#" className="hover:text-white transition-colors">Explore</a>
              <a href="#" className="hover:text-white transition-colors">Community</a>
              <a href="#" className="flex items-center gap-2 hover:text-white transition-colors">
                <Upload className="w-4 h-4" /> Create Puzzle
              </a>
           </nav>

           <div className="flex items-center gap-4">
              <button className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:block">Log In</button>
              <button className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium backdrop-blur-md transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                Get Started
              </button>
           </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-start pt-12 md:pt-16 px-4">
           
           {/* Text Content */}
           <div className="text-center max-w-4xl mx-auto z-30 pointer-events-auto">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6"
              >
                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 <span className="text-xs font-medium text-emerald-100 tracking-wide uppercase">Multiplayer Lobbies Live</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold tracking-tight font-['Outfit'] leading-tight"
              >
                Your Images. <br className="md:hidden" />
                Your Friends.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
                  Your World. Puzzled.
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="mt-6 text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
              >
                The ultimate collaborative, custom jigsaw experience. Create, connect, and complete together.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                 <button className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-lg transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] hover:-translate-y-1 flex items-center gap-2">
                    <Play className="w-5 h-5 fill-white/20" /> Start Your First Puzzle Free
                 </button>
              </motion.div>
           </div>

           {/* 3D Scene Wrapper */}
           <div className="flex-1 w-full max-w-6xl relative flex flex-col items-center justify-center mt-12 md:mt-24 pointer-events-auto z-10" style={{ perspective: 1500 }}>
              <motion.div
                 style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    rotateX,
                    rotateY,
                    rotateZ: 4,
                    transformStyle: 'preserve-3d'
                 }}
              >
                 <MidgroundScene />
              </motion.div>
           </div>
        </main>
      </div>
    </div>
  );
}
