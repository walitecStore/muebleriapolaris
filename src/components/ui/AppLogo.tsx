'use client';

import React, { memo, useMemo } from 'react';
import AppIcon from './AppIcon';
import AppImage from './AppImage';

interface AppLogoProps {
  src?: string;
  iconName?: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

const AppLogo = memo(function AppLogo({
  src = '/assets/images/ab15ca76-b580-4192-ac0c-2ff41094db8d-1784506178116.jpg',
  iconName = 'SparklesIcon',
  size = 64,
  className = '',
  onClick,
}: AppLogoProps) {
  const containerClassName = useMemo(() => {
    const classes = [
      'group',
      'flex',
      'items-center',
      'select-none',
      'transition-all',
      'duration-300',
    ];

    if (onClick) {
      classes.push('cursor-pointer', 'hover:scale-105', 'active:scale-95');
    }

    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  }, [className, onClick]);

  return (
    <div className={containerClassName} onClick={onClick} aria-label="Logo Mueblería Polaris">
      {src ? (
        <div
          className="
            flex-shrink-0
            overflow-hidden
            rounded-2xl
            ring-2
            ring-white/80
            bg-white
            shadow-xl
            shadow-cyan-500/10
            transition-all
            duration-300
            group-hover:rotate-1
            group-hover:shadow-cyan-500/30
          "
          style={{
            width: size,
            height: size,
            minWidth: size,
            minHeight: size,
          }}
        >
          <AppImage
            src={src}
            alt="Logo Mueblería Polaris"
            width={size}
            height={size}
            priority
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            unoptimized={src.endsWith('.svg')}
          />
        </div>
      ) : (
        <AppIcon
          name={iconName}
          size={size}
          className="transition-transform duration-300 group-hover:scale-110"
        />
      )}
    </div>
  );
});

AppLogo.displayName = 'AppLogo';

export default AppLogo;
