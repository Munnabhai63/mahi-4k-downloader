'use client';

import React from 'react';
import { cn } from './utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'quality' | 'mint';
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', size = 'sm', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-full transition-colors whitespace-nowrap';

    const variants = {
      neutral: 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]',
      success: 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]',
      mint: 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]',
      warning: 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
      error: 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]',
      quality: 'bg-[#16A34A] text-white font-semibold shadow-xs',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-0.5',
      md: 'text-sm px-3.5 py-1',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
