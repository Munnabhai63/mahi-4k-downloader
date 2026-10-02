'use client';

import React from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#64748B]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-white text-[#0F172A] placeholder-[#94A3B8] border border-[#E2E8F0] rounded-[12px] px-4 py-2.5 text-sm transition-all duration-150',
              'focus:outline-none focus:border-[#16A34A] focus:ring-4 focus:ring-[#DCFCE7]',
              'disabled:bg-[#F8FAF9] disabled:text-[#94A3B8] disabled:cursor-not-allowed',
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              error ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#FEE2E2]' : '',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-[#64748B]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-[#EF4444] font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
