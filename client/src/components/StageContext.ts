import { createContext, useContext } from 'react';
import type { Camera, Geometry } from '../model/layout';

export interface StageInfo {
  cam: Camera;
  geo: Geometry;
  size: { w: number; h: number };
  settled: boolean;
}

export const StageContext = createContext<StageInfo | null>(null);

export function useStage(): StageInfo {
  const v = useContext(StageContext);
  if (!v) throw new Error('useStage outside <Stage>');
  return v;
}
