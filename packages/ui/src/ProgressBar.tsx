'use client';

import React from 'react';
import { cn } from './utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  progress?: number; // 0 to 100
  isIndeterminate?: boolean;
  showLabel?: boolean;
  speedText?: string;
  etaText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      progress = 0,
      isIndeterminate = false,
      showLabel = false,
      speedText,
      etaText,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const clampedProgress = Math.min(100, Math.max(0, progress));

    const heightClasses = {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {(showLabel || speedText || etaText) && (
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1.5 font-medium">
            <span>{isIndeterminate ? 'Processing...' : `${Math.round(clampedProgress)}%`}</span>
            <div className="flex items-center gap-3">
              {speedText && <span>{speedText}</span>}
              {etaText && <span>ETA: {etaText}</span>}
            </div>
          </div>
        )}
        <div
          className={cn(
            'w-full bg-[#E2E8F0] rounded-full overflow-hidden relative',
            heightClasses[size]
          )}
        >
          {isIndeterminate ? (
            <div className="h-full w-1/3 bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-full animate-pulse transform -translate-x-full" />
          ) : (
            <div
              className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          )}
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
