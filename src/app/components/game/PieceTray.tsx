import { useState } from 'react';
import { PuzzlePiece, Puzzle } from '../Game';

interface PieceTrayProps {
  puzzle: Puzzle;
  pieces: PuzzlePiece[];
  cols: number;
  boardSize: number;
}

const TRAY_PIECE_SIZE = 72;

export default function PieceTray({ puzzle, pieces, cols, boardSize }: PieceTrayProps) {
  const [dragPieceId, setDragPieceId] = useState<number | null>(null);

  const BOARD_SIZE_REF = 500; // reference for background-size calculation
  const CELL_REF = boardSize / cols;

  const getPieceStyle = (piece: PuzzlePiece): React.CSSProperties => {
    const scale = TRAY_PIECE_SIZE / CELL_REF;
    return {
      width: TRAY_PIECE_SIZE,
      height: TRAY_PIECE_SIZE,
      backgroundImage: `url(${puzzle.image_url})`,
      backgroundSize: `${BOARD_SIZE_REF * scale}px ${BOARD_SIZE_REF * scale}px`,
      backgroundPosition: `-${piece.correctCol * CELL_REF * scale}px -${piece.correctRow * CELL_REF * scale}px`,
      backgroundRepeat: 'no-repeat',
      flexShrink: 0,
    };
  };

  if (pieces.length === 0) return (
    <div className="relative z-20 flex-shrink-0 h-24 flex items-center justify-center border-t border-white/5 bg-[#090b12]/80 backdrop-blur-md">
      <p className="text-sm text-emerald-400 font-bold font-['Outfit'] animate-pulse">
        🎉 All pieces placed!
      </p>
    </div>
  );

  return (
    <div className="relative z-20 flex-shrink-0 border-t border-white/5 bg-[#090b12]/80 backdrop-blur-md">
      {/* Label */}
      <div className="px-4 pt-2 pb-1 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-[#d3c5f6]/40 font-bold">
          Piece Tray
        </span>
        <span className="text-[10px] text-[#d3c5f6]/40 font-bold">
          {pieces.length} remaining
        </span>
      </div>

      {/* Scrollable piece row */}
      <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {pieces.map(piece => (
          <div
            key={piece.id}
            draggable
            onDragStart={(e) => {
              setDragPieceId(piece.id);
              // Store piece id + center offset in dataTransfer
              e.dataTransfer.setData('pieceId', String(piece.id));
              e.dataTransfer.setData('offsetX', String(TRAY_PIECE_SIZE / 2));
              e.dataTransfer.setData('offsetY', String(TRAY_PIECE_SIZE / 2));
              // Custom drag image
              const img = new Image();
              img.src = puzzle.image_url;
              e.dataTransfer.setDragImage(img, 0, 0);
            }}
            onDragEnd={() => setDragPieceId(null)}
            className={`rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all duration-150 flex-shrink-0
              ${dragPieceId === piece.id
                ? 'border-[#d3c5f6] opacity-50 scale-95'
                : 'border-white/10 hover:border-[#d3c5f6]/60 hover:scale-105'
              }`}
            style={getPieceStyle(piece)}
            title={`Piece ${piece.id + 1}`}
          />
        ))}
      </div>
    </div>
  );
}