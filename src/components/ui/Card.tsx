'use client';

import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({
  children,
  hover = true,
  glass = false,
  padding = 'md',
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border transition-all duration-300 overflow-hidden',

        glass
          ? 'bg-white/70 backdrop-blur-xl border-white/30 shadow-xl'
          : 'bg-white border-slate-200 shadow-sm',

        hover &&
          'hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10',

        {
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-5': padding === 'md',
          'p-8': padding === 'lg',
        },

        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}