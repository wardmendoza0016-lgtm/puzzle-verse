import { useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { PuzzlePiece, Puzzle } from '../Game';

interface PuzzleBoardProps {
  puzzle: Puzzle;
  pieces: PuzzlePiece[];
  cols: number;
  session: Session;
  onPiecePlaced: (pieceId: number) => void;
  boardSize: number;
}

const SNAP_TOLERANCE = 0.4;

export default function PuzzleBoard({
  puzzle,
  pieces,
  cols,
  session,
  onPiecePlaced,
  boardSize
}: PuzzleBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);

  const placedPieces = pieces.filter(p => p.placed);

  // ── Board sizing ────────────────────────────────────────────
  const BOARD_SIZE = boardSize; // ← use prop directly
  const CELL_SIZE = BOARD_SIZE / cols;

  // ── Drag handlers ───────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // required to allow drop
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!boardRef.current) return;

    const pieceId = parseInt(e.dataTransfer.getData('pieceId'));
    const offsetX = parseFloat(e.dataTransfer.getData('offsetX')) || CELL_SIZE / 2;
    const offsetY = parseFloat(e.dataTransfer.getData('offsetY')) || CELL_SIZE / 2;

    if (isNaN(pieceId)) return;

    const rect = boardRef.current.getBoundingClientRect();
    const dropX = e.clientX - rect.left - offsetX;
    const dropY = e.clientY - rect.top - offsetY;

    // Which cell was targeted
    const droppedCol = Math.round(dropX / CELL_SIZE);
    const droppedRow = Math.round(dropY / CELL_SIZE);

    const piece = pieces.find(p => p.id === pieceId);
    if (!piece || piece.placed) return;

    // Bounds check — ignore drops outside the grid
    if (droppedCol < 0 || droppedCol >= cols || droppedRow < 0 || droppedRow >= cols) return;

    // Snap tolerance check
    const snapX = droppedCol * CELL_SIZE;
    const snapY = droppedRow * CELL_SIZE;
    const distX = Math.abs(dropX - snapX);
    const distY = Math.abs(dropY - snapY);
    const tolerance = CELL_SIZE * SNAP_TOLERANCE;

    const isCorrectCell =
      droppedCol === piece.correctCol &&
      droppedRow === piece.correctRow &&
      distX < tolerance &&
      distY < tolerance;

    if (isCorrectCell) onPiecePlaced(piece.id);
  };

  // ── Piece image clip ────────────────────────────────────────
  const getPieceStyle = (piece: PuzzlePiece): React.CSSProperties => ({
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundImage: `url(${puzzle.image_url})`,
    backgroundSize: `${BOARD_SIZE}px ${BOARD_SIZE}px`,
    backgroundPosition: `-${piece.correctCol * CELL_SIZE}px -${piece.correctRow * CELL_SIZE}px`,
    backgroundRepeat: 'no-repeat',
  });

  // ── Color per placer ────────────────────────────────────────
  const placerColors: Record<string, string> = {};
  const colorList = [
    'rgba(211,197,246,0.5)',
    'rgba(99,210,199,0.4)',
    'rgba(248,180,100,0.4)',
    'rgba(248,113,113,0.4)',
    'rgba(129,200,255,0.4)',
  ];
  pieces
    .filter(p => p.placedBy)
    .forEach(p => {
      if (p.placedBy && !placerColors[p.placedBy]) {
        const idx = Object.keys(placerColors).length % colorList.length;
        placerColors[p.placedBy] = colorList[idx];
      }
    });

  return (
    <div
      ref={boardRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative rounded-xl overflow-hidden shadow-[0_0_60px_rgba(59,42,96,0.6)] border border-white/10 flex-shrink-0"
      style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
    >
      {/* Faint ghost image — reduced to 5% */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url(${puzzle.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: cols + 1 }).map((_, i) => (
          <div
            key={`v${i}`}
            className="absolute top-0 bottom-0 border-l border-white/5"
            style={{ left: i * CELL_SIZE }}
          />
        ))}
        {Array.from({ length: cols + 1 }).map((_, i) => (
          <div
            key={`h${i}`}
            className="absolute left-0 right-0 border-t border-white/5"
            style={{ top: i * CELL_SIZE }}
          />
        ))}
      </div>

      {/* Placed pieces */}
      {placedPieces.map(piece => (
        <div
          key={piece.id}
          className="absolute transition-all duration-300"
          style={{
            left: piece.correctCol * CELL_SIZE,
            top: piece.correctRow * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
          }}
        >
          <div className="w-full h-full" style={getPieceStyle(piece)} />

          {/* Placer color overlay */}
          {piece.placedBy && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: placerColors[piece.placedBy] || 'transparent' }}
            />
          )}

          {/* Current user glow */}
          {piece.placedBy === session.user.id && (
            <div className="absolute inset-0 ring-1 ring-[#d3c5f6]/40 pointer-events-none" />
          )}
        </div>
      ))}

      {/* All pieces placed overlay */}
      {placedPieces.length === pieces.length && pieces.length > 0 && (
        <div className="absolute inset-0 bg-[#d3c5f6]/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
          <span className="text-4xl">🧩</span>
        </div>
      )}
    </div>
  );
}