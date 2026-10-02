'use client';

import React from 'react';
import { cn } from './utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'surface' | 'mint' | 'interactive';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-[#E2E8F0] shadow-[0_4px_24px_rgba(22,163,74,0.06)]',
      surface: 'bg-[#F8FAF9] border border-[#E2E8F0]',
      mint: 'bg-[#F0FDF4] border border-[#DCFCE7]',
      interactive:
        'bg-white border border-[#E2E8F0] shadow-[0_4px_24px_rgba(22,163,74,0.06)] hover:shadow-[0_8px_32px_rgba(22,163,74,0.12)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-[16px] p-6 text-[#0F172A]', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
