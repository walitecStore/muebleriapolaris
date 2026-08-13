'use client';

import React from 'react';
import clsx from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'dark';

  size?: 'sm' | 'md' | 'lg';
}

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-semibold',

        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-3 py-1 text-sm': size === 'md',
          'px-4 py-1.5 text-base': size === 'lg',
        },

        {
          'bg-cyan-100 text-cyan-700': variant === 'primary',
          'bg-emerald-100 text-emerald-700': variant === 'secondary',
          'bg-green-100 text-green-700': variant === 'success',
          'bg-yellow-100 text-yellow-700': variant === 'warning',
          'bg-red-100 text-red-700': variant === 'danger',
          'bg-slate-900 text-white': variant === 'dark',
        },

        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}