'use client';

import React from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'whatsapp';

  size?: 'sm' | 'md' | 'lg';

  loading?: boolean;

  fullWidth?: boolean;

  leftIcon?: React.ReactNode;

  rightIcon?: React.ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',

        {
          'px-4 py-2 text-sm': size === 'sm',
          'px-6 py-3 text-base': size === 'md',
          'px-8 py-4 text-lg': size === 'lg',
        },

        {
          'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg hover:shadow-cyan-500/30':
            variant === 'primary',

          'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg': variant === 'secondary',

          'border border-slate-300 bg-white hover:bg-slate-100': variant === 'outline',

          'bg-transparent hover:bg-slate-100': variant === 'ghost',

          'bg-red-600 text-white hover:bg-red-700': variant === 'danger',

          'bg-green-600 text-white hover:bg-green-700': variant === 'success',

          'bg-[#25D366] text-white hover:bg-[#20bd5a]': variant === 'whatsapp',
        },

        fullWidth && 'w-full',

        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".2" />

          <path
            d="M22 12a10 10 0 00-10-10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <>
          {leftIcon}

          {children}

          {rightIcon}
        </>
      )}
    </button>
  );
}
