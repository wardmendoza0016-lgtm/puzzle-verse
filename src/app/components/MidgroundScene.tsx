import { motion } from 'motion/react';
import { ImageIcon } from 'lucide-react';
import PuzzlePiece from './PuzzlePiece';
import { ImageWithFallback } from './figma/ImageWithFallback';

const DETACHED: Record<string, any> = {
  "3,1": { x: 40, y: 140, z: 90, rotateZ: 15, rotateX: 20 },
  "2,3": { x: 120, y: 20, z: 130, rotateZ: -25, rotateY: 30 },
  "0,3": { x: 90, y: -100, z: 60, rotateZ: 35, rotateX: -20 },
  "3,3": { x: 160, y: 160, z: 180, rotateZ: -10, rotateX: 40 }
};

const AVATARS = [
  { id: 1, x: 460, y: 20, z: 80, img: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", target: { r: 0, c: 2 }, color: '#d3c5f6' },
  { id: 2, x: 520, y: 150, z: 120, img: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", target: { r: 1, c: 3 }, color: '#d3c5f6' },
  { id: 3, x: 440, y: 290, z: 100, img: "https://images.unsplash.com/photo-1672462478040-a5920e2c23d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", target: { r: 2, c: 2 }, color: '#d3c5f6' },
];

const UPLOAD_NODE = { x: -200, y: 140, z: 110 };

export default function MidgroundScene({ activeImage }: { activeImage: string }) {
  const getSvgCoords = (domX: number, domY: number) => [domX + 400, domY + 400];
  const getPieceCenter = (c: number, r: number) => [c * 100 + 50, r * 100 + 50];

  return (
    <div className="relative w-[400px] h-[400px]" style={{ transformStyle: 'preserve-3d' }}>
      <div className="absolute -inset-10 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-[0_0_50px_rgba(59,42,96,0.3)] pointer-events-none" style={{ transform: 'translateZ(-40px)' }} />

      <div style={{ position: 'absolute', inset: -400, transform: 'translateZ(-20px)', pointerEvents: 'none' }}>
        <svg viewBox="0 0 1200 1200" className="w-full h-full">
           {AVATARS.map(av => {
             const [startX, startY] = getSvgCoords(av.x + 24, av.y + 24);
             const [targetX, targetY] = getPieceCenter(av.target.c, av.target.r);
             const [endX, endY] = getSvgCoords(targetX, targetY);
             const cx = (startX + endX) / 2;
             const cy = Math.min(startY, endY) - 80;
             return (
               <g key={av.id}>
                 <path d={`M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`} fill="none" stroke={av.color} strokeWidth="1.5" className="opacity-20" />
                 <path d={`M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`} fill="none" stroke={av.color} strokeWidth="2.5" strokeDasharray="6 10" className="opacity-70">
                   <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.5s" repeatCount="indefinite" />
                 </path>
               </g>
             );
           })}

           {(() => {
              const [ux, uy] = getSvgCoords(UPLOAD_NODE.x + 32, UPLOAD_NODE.y + 32);
              const [tx, ty] = getSvgCoords(getPieceCenter(0, 1)[0], getPieceCenter(0, 1)[1]);
              const cx = (ux + tx) / 2;
              const cy = Math.max(uy, ty) + 60;
              return (
                <g>
                  <path d={`M ${ux} ${uy} Q ${cx} ${cy} ${tx} ${ty}`} fill="none" stroke="#d3c5f6" strokeWidth="1.5" className="opacity-20" />
                  <path d={`M ${ux} ${uy} Q ${cx} ${cy} ${tx} ${ty}`} fill="none" stroke="#d3c5f6" strokeWidth="2.5" strokeDasharray="4 8" className="opacity-60">
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1s" repeatCount="indefinite" />
                  </path>
                </g>
              );
           })()}
        </svg>
      </div>

      {Array.from({ length: 4 }).map((_, r) => (
        Array.from({ length: 4 }).map((_, c) => {
          const isDetached = DETACHED[`${r},${c}`];
          return <PuzzlePiece key={`${r}-${c}`} r={r} c={c} detachedProps={isDetached} activeImage={activeImage} />;
        })
      ))}

      <motion.div
        style={{ position: 'absolute', left: UPLOAD_NODE.x, top: UPLOAD_NODE.y, z: UPLOAD_NODE.z, transformStyle: 'preserve-3d' }}
        animate={{ y: [UPLOAD_NODE.y, UPLOAD_NODE.y - 15, UPLOAD_NODE.y] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(211,197,246,0.15)] overflow-hidden relative group cursor-pointer">
           <div className="absolute inset-0 bg-gradient-to-tr from-[#d3c5f6]/10 to-[#3b2a60]/20 opacity-50 group-hover:opacity-100 transition-opacity" />
           <ImageIcon className="w-6 h-6 text-[#d3c5f6] mb-1 z-10" />
           <div className="text-[9px] font-bold tracking-wider text-white/80 z-10 uppercase font-['Space_Grotesk']">Create</div>
        </div>
      </motion.div>

      {AVATARS.map((av, i) => (
        <motion.div
          key={av.id}
          style={{ position: 'absolute', left: av.x, top: av.y, z: av.z, transformStyle: 'preserve-3d' }}
          animate={{ y: [av.y, av.y - 10, av.y], rotateY: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 3.5 + i * 0.5, ease: "easeInOut", delay: i * 0.3 }}
        >
          <div className="relative group cursor-pointer">
             <div className="absolute -inset-1 rounded-full opacity-40 group-hover:opacity-80 blur-md transition-opacity duration-500" style={{ backgroundColor: av.color }} />
             <div className="relative w-12 h-12 rounded-full p-[2px] bg-white/10 backdrop-blur-md overflow-hidden" style={{ border: `1px solid ${av.color}60` }}>
               <ImageWithFallback src={av.img} alt="Player" className="w-full h-full rounded-full object-cover" />
             </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}