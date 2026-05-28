import { motion, useTransform, MotionValue } from 'motion/react';

interface StandaloneProps {
  x: string;
  y: string;
  scale: number;
  rotate: number;
  speed: number;
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;
  img: string;
  zIndex: number;
}

export default function StandalonePiece({ x, y, scale, rotate, speed, smoothX, smoothY, img, zIndex }: StandaloneProps) {
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
        filter: 'drop-shadow(0px 40px 30px rgba(0,0,0,0.8)) blur(2px)'
      }}
      className="pointer-events-none opacity-30"
    >
      <div style={{ width: 120, height: 120 }}>
        <svg viewBox="-30 -30 160 160" className="w-full h-full">
          <defs>
            <clipPath id={`stand-clip-${x}-${y}`}>
              <path d={path} />
            </clipPath>
          </defs>
          <image href={img} width="300" height="300" clipPath={`url(#stand-clip-${x}-${y})`} x="-80" y="-80" preserveAspectRatio="xMidYMid slice" />
          <path d={path} fill="none" stroke="#d3c5f640" strokeWidth="2" />
        </svg>
      </div>
    </motion.div>
  );
}