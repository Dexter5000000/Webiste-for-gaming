import { useContext } from 'react';
import { TimelineContext, TimelineContextValue } from './timelineContextTypes';

export function useTimeline(): TimelineContextValue {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
}
