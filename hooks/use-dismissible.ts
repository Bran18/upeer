'use client';

import { useEffect, type RefObject } from 'react';

export function useDismissible(
  open: boolean,
  onClose: () => void,
  anchors: RefObject<HTMLElement | null>[],
) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const inside = anchors.some((ref) => ref.current?.contains(target));
      if (!inside) {
        onClose();
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, onClose, anchors]);
}
