import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'white';
}

export function Logo({ className = '', size = 'md', variant = 'dark' }: LogoProps) {
  // Height sizing map to ensure proportional scaling without distortion
  const heightMap = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-12 sm:h-14',
    xl: 'h-18 sm:h-20',
  };

  const activeHeight = heightMap[size];

  // If the logo needs to be placed on a dark background, we can apply a filter
  const filterClass = variant === 'white' ? 'brightness-0 invert' : '';

  return (
    <div id="bks-logo-brand" className={`flex items-center select-none ${className}`}>
      <img
        src="https://grooweb.com/wp-content/uploads/2026/07/WhatsApp-Image-2026-07-13-at-1.17.33-PM-Photoroom-e1784010911265.png"
        alt="BKS 2015"
        className={`${activeHeight} object-contain transition-all duration-300 ${filterClass}`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
