import React, { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import { useEscapeToClose } from '../lib/useEscapeToClose';

interface ImageLightboxProps {
  src: string | null | undefined;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;

/**
 * Full-screen photo viewer with zoom.
 * - Mouse wheel / +, - buttons to zoom
 * - Drag to pan while zoomed in
 * - Double-click toggles between fit and 2.5x
 */
export default function ImageLightbox({ src, alt = '', isOpen, onClose }: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ active: boolean; startX: number; startY: number; originX: number; originY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  useEscapeToClose(onClose, isOpen);

  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, src]);

  const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

  const zoomBy = (delta: number) => {
    setScale((current) => {
      const next = clampScale(current + delta);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isOpen) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = clampScale(scale - e.deltaY * 0.0015);
      setScale(next);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [isOpen, scale]);

  if (!isOpen || !src) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset({ x: dragState.current.originX + dx, y: dragState.current.originY + dy });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current.active = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image preview'}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/15"
        aria-label="Close image"
      >
        <X size={22} />
      </button>

      <div
        ref={containerRef}
        className="relative flex h-full w-full items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={() => {
          if (scale > 1) reset();
          else setScale(2.5);
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ cursor: scale > 1 ? (dragState.current.active ? 'grabbing' : 'grab') : 'zoom-in' }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-[88vh] max-w-[92vw] select-none rounded-2xl object-contain shadow-2xl transition-transform duration-75 ease-out"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        />
      </div>

      <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 flex items-center gap-1.5 rounded-2xl border border-white/15 bg-gray-900/80 p-2 backdrop-blur">
        <button
          type="button"
          onClick={() => zoomBy(-0.5)}
          disabled={scale <= MIN_SCALE}
          className="p-2 rounded-xl text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut size={18} />
        </button>
        <span className="min-w-[3.25rem] text-center text-[11px] font-black text-white/80 tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(0.5)}
          disabled={scale >= MAX_SCALE}
          className="p-2 rounded-xl text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn size={18} />
        </button>
        <div className="mx-1 h-6 w-px bg-white/15" />
        <button
          type="button"
          onClick={reset}
          className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
          aria-label="Reset zoom"
        >
          <RotateCcw size={17} />
        </button>
      </div>

      <div className="absolute bottom-5 right-5 z-20 hidden sm:flex items-center gap-1.5 rounded-xl bg-gray-900/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
        <Move size={12} /> Scroll to zoom · drag to pan
      </div>
    </div>
  );
}
