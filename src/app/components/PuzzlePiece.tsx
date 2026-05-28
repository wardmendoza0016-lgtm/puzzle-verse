import { motion } from 'motion/react';
import { getPiecePath } from '../utils/geometry';
import { TargetAndTransition } from 'motion/react';

interface PuzzlePieceProps {
  r: number;
  c: number;
  detachedProps?: any;
  activeImage: string;
}

export default function PuzzlePiece({ r, c, detachedProps, activeImage }: PuzzlePieceProps) {
  const path = getPiecePath(c, r);
  const isDetached = !!detachedProps;
  
  const initial = isDetached 
    ? { x: detachedProps.x, y: detachedProps.y, z: detachedProps.z, rotateX: detachedProps.rotateX || 0, rotateY: detachedProps.rotateY || 0, rotateZ: detachedProps.rotateZ || 0 }
    : { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0 };

  const floatAnimation: TargetAndTransition | undefined = isDetached ? {
  y: [detachedProps.y, detachedProps.y - 15, detachedProps.y],
  z: [detachedProps.z, detachedProps.z + 10, detachedProps.z],
  transition: { 
    repeat: Infinity, 
    duration: 4 + ((r * c) % 3), 
    ease: "easeInOut" // TypeScript now knows exactly what shape this is
  }
} : undefined; // Use undefined instead of an empty object {}

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
        
        <image
          href={activeImage}
          width="400"
          height="400"
          x={-c * 100}
          y={-r * 100}
          clipPath={`url(#clip-${r}-${c})`}
          preserveAspectRatio="xMidYMid slice"
          className="brightness-100 contrast-100"
        />
        
        <path d={path} fill="none" stroke="#d3c5f650" strokeWidth="1.5" />
        <path d={path} fill="none" stroke="#3b2a6040" strokeWidth="3" className="mix-blend-overlay" />
        
        {!isDetached && (
           <path d={path} fill="rgba(211, 197, 246, 0.08)" className="opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-auto" />
        )}
      </svg>
    </motion.div>
  );
}