import { useState, useEffect } from 'react';
import { timeAgo } from '@/lib/utils';

interface RefreshControlProps {
  lastRefreshed: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function RefreshControl({ lastRefreshed, isRefreshing, onRefresh }: RefreshControlProps) {
  const [displayTime, setDisplayTime] = useState(() => timeAgo(lastRefreshed));
  
  // Update the "X ago" text every second
  useEffect(() => {
    setDisplayTime(timeAgo(lastRefreshed));
    
    const interval = setInterval(() => {
      setDisplayTime(timeAgo(lastRefreshed));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastRefreshed]);

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-text-muted hidden sm:inline">
        Updated {displayTime}
      </span>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="px-3 py-1.5 rounded-lg bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 disabled:opacity-50 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent-cyan"
        aria-label={isRefreshing ? 'Refreshing...' : 'Refresh data'}
      >
        <svg 
          className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
        <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
      </button>
    </div>
  );
}
