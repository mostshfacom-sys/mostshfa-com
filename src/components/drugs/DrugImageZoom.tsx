'use client';

import { useCallback, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { EntityImage } from '@/components/ui/EntityImage';

type DrugImageZoomProps = {
  src: string | null | undefined;
  alt: string;
  drugId?: number | string;
  className?: string;
  size?: 'md' | 'lg';
};

export default function DrugImageZoom({
  src,
  alt,
  drugId,
  className = '',
  size = 'lg',
}: DrugImageZoomProps) {
  const [open, setOpen] = useState(false);

  const { width, height } = useMemo(() => {
    if (size === 'md') return { width: 96, height: 96 };
    return { width: 120, height: 120 };
  }, [size]);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleOverlayClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    },
    [handleClose]
  );

  const zoomedImage = useMemo(() => {
    return (
      <div className="relative h-[min(70vh,720px)] w-[min(92vw,720px)] overflow-hidden rounded-[1.75rem] bg-white shadow-2xl dark:bg-slate-900">
        <EntityImage
          src={src}
          alt={alt}
          entityType="drug"
          entityId={drugId}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 92vw, 720px"
          priority
        />
      </div>
    );
  }, [alt, drugId, src]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`relative overflow-hidden rounded-[1.75rem] ${className}`}
        style={{ width, height }}
        aria-label="تكبير صورة الدواء"
      >
        <div className="absolute inset-0 cursor-zoom-in">
          <EntityImage
            src={src}
            alt={alt}
            entityType="drug"
            entityId={drugId}
            fill
            className="object-cover transition-transform duration-300 hover:scale-[1.06]"
            sizes={`${width}px`}
          />
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          onClick={handleOverlayClick}
        >
          <div className="relative">
            <button
              type="button"
              onClick={handleClose}
              className="absolute -right-3 -top-3 rounded-full bg-white/90 px-3 py-2 text-sm font-black text-slate-900 shadow-lg transition hover:bg-white dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              aria-label="إغلاق"
            >
              ×
            </button>
            {zoomedImage}
          </div>
        </div>
      )}
    </>
  );
}
