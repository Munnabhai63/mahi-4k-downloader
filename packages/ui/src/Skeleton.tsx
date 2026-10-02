'use client';

import React from 'react';
import { cn } from './utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'rounded', ...props }, ref) => {
    const variants = {
      rectangular: 'rounded-none',
      circular: 'rounded-full',
      rounded: 'rounded-[12px]',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-[#E2E8F0] dark:bg-slate-200 relative overflow-hidden',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
