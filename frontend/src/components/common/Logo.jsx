import React from 'react';

const Logo = ({ size = 'md', showSubtitle = true, hideText = false, className = '' }) => {
  // Size mapping
  const sizes = {
    sm: { icon: 'h-8',  title: 'text-xl',   subtitle: 'text-[9px]',  gap: 'gap-2' },
    md: { icon: 'h-12', title: 'text-3xl',  subtitle: 'text-[12px]', gap: 'gap-2.5' },
    lg: { icon: 'h-16', title: 'text-4xl',  subtitle: 'text-[15px]', gap: 'gap-3' },
    xl: { icon: 'h-24', title: 'text-6xl',  subtitle: 'text-[20px]', gap: 'gap-5' },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center ${currentSize.gap} ${className} select-none`}>
      {/* Icon Section */}
      <div className={`${currentSize.icon} aspect-square relative flex-shrink-0`}>
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          <defs>
            <linearGradient id="crossGradient" x1="60" y1="0" x2="60" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#87AFB7" />
              <stop offset="100%" stopColor="#4A6178" />
            </linearGradient>
            
            <filter id="mascotShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Medical Cross Background - Extra rounded corners */}
          <rect x="40" y="5" width="40" height="110" rx="16" fill="url(#crossGradient)" />
          <rect x="5" y="40" width="110" height="40" rx="16" fill="url(#crossGradient)" />

          {/* AI Robot Mascot - Absolute Fidelity */}
          <g filter="url(#mascotShadow)">
            {/* Thick White Outer Badge Shape */}
            <path 
              d="M92 48 C92 38 84 30 72 30 H50 C38 30 30 38 30 48 V72 C30 82 38 90 50 90 H52 L42 108 L68 90 H72 C84 90 92 82 92 72 V48Z" 
              fill="white" 
            />
            
            {/* Robot Head Core (Navy) */}
            <path 
              d="M86 50 C86 42 80 36 72 36 H50 C42 36 36 42 36 50 V70 C36 78 42 84 50 84 H52 L46 96 L64 84 H72 C80 84 86 78 86 70 V50Z" 
              fill="#27487fff" 
            />

            {/* Peak Antenna */}
            <path d="M61 36 L66 20 H56 L61 36Z" fill="#ffffffff" />
            <path d="M61 36 L63 28 H59 L61 36Z" fill="white" opacity="0.8" />

            {/* Side Ear Panels */}
            <path d="M22 56 C22 52 26 48 30 48 V82 C26 82 22 78 22 74 V56Z" fill="white" />
            <path d="M92 48 C96 48 100 52 100 56 V74 C100 78 96 82 92 82 V48Z" fill="white" />
            
            <rect x="25" y="58" width="5" height="14" rx="2.5" fill="#1F365F" opacity="0.2" />
            <rect x="92" y="58" width="5" height="14" rx="2.5" fill="#1F365F" opacity="0.2" />

            {/* Happy Eyes (Tilted Ovals) */}
            <ellipse cx="50" cy="62" rx="4" ry="5.5" fill="white" transform="rotate(-12 50 62)" />
            <ellipse cx="72" cy="62" rx="4" ry="5.5" fill="white" transform="rotate(12 72 62)" />

            {/* Wide Happy Smile */}
            <path 
              d="M54 74 Q61 82 68 74" 
              stroke="white" 
              strokeWidth="4" 
              strokeLinecap="round" 
              fill="none" 
            />

            {/* Digital Pulse Line */}
            <path 
              d="M100 65 H106 L112 55 L118 75 L124 65 H132" 
              stroke="#ffffffff" 
              strokeWidth="5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </g>
        </svg>
      </div>

      {/* Text Section */}
      {!hideText && (
        <div className="flex flex-col justify-center leading-none">
          <div className={`${currentSize.title} font-extrabold tracking-tighter flex items-center`}>
            <span className="text-[#1F365F] font-sans">MediAssist</span>
            <span className="text-[#86AE3A] ml-2 font-sans">AI</span>
          </div>
          {showSubtitle && (
            <span className={`${currentSize.subtitle} font-extrabold text-[#5D708B] mt-1 space-x-1 tracking-tight uppercase opacity-90`}>
              Smart Hospital Reception System
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
