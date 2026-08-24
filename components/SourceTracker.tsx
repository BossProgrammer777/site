'use client';

import { useEffect } from 'react';
import { captureFirstTouch } from '@/lib/attribution';

// Ничего не рисует — на первом заходе фиксирует источник перехода (first-touch).
export function SourceTracker() {
  useEffect(() => { captureFirstTouch(); }, []);
  return null;
}
