'use client';

import React from 'react';

/**
 * Modern vector illustration of stacked books, notepad with pencil, and leaves
 * matching the teacher welcome banner artwork.
 */
export function TeacherBannerArt({ className = "w-36 h-28" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Soft Drop Shadows */}
        <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.08" />
        </filter>
        <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Gradients */}
        <linearGradient id="cloudGlow" x1="120" y1="20" x2="120" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e0f2fe" stopOpacity="0.7" />
          <stop stopColor="#f0f9ff" stopOpacity="0.2" />
        </linearGradient>

        <linearGradient id="blueBookCover" x1="30" y1="120" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop stopColor="#3b82f6" />
        </linearGradient>

        <linearGradient id="yellowBookCover" x1="40" y1="95" x2="150" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" />
          <stop stopColor="#fbbf24" />
        </linearGradient>

        <linearGradient id="notepadHeader" x1="120" y1="40" x2="200" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e2e8f0" />
          <stop stopColor="#cbd5e1" />
        </linearGradient>

        <linearGradient id="pencilWood" x1="180" y1="90" x2="210" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f97316" />
          <stop stopColor="#ea580c" />
        </linearGradient>

        <linearGradient id="leafGrad" x1="10" y1="60" x2="40" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Background Soft Ambient Glow */}
      <circle cx="130" cy="90" r="70" fill="url(#cloudGlow)" />
      
      {/* Decorative Sparkles / Floating Confetti */}
      <circle cx="195" cy="40" r="3" fill="#38bdf8" opacity="0.9" />
      <circle cx="215" cy="85" r="2.5" fill="#f59e0b" opacity="0.8" />
      <circle cx="45" cy="65" r="2.5" fill="#10b981" opacity="0.8" />
      <circle cx="85" cy="25" r="2" fill="#818cf8" opacity="0.7" />

      {/* Decorative Green Leaves on Left */}
      <g filter="url(#softShadow)">
        <path
          d="M28 85 C18 70 24 55 35 52 C38 65 34 78 28 85 Z"
          fill="url(#leafGrad)"
        />
        <path
          d="M36 82 C48 72 58 75 62 88 C49 90 40 86 36 82 Z"
          fill="#34d399"
        />
        <path
          d="M30 92 C15 95 18 108 26 114 C32 105 32 96 30 92 Z"
          fill="#059669"
        />
        <path d="M28 85 Q33 88 38 105" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Bottom Blue Book */}
      <g filter="url(#softShadow)">
        {/* Pages under cover */}
        <rect x="52" y="132" width="102" height="18" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
        <line x1="58" y1="137" x2="148" y2="137" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="58" y1="142" x2="148" y2="142" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
        
        {/* Cover Spine and Flap */}
        <path
          d="M44 128 C44 128 46 150 46 152 C48 155 52 155 55 155 L158 155 C161 155 163 153 163 150 L160 128 C160 125 158 124 155 124 L52 124 C48 124 44 125 44 128 Z"
          fill="url(#blueBookCover)"
        />
        <path d="M46 128 L46 152" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Middle Yellow Book */}
      <g filter="url(#softShadow)">
        <rect x="58" y="108" width="94" height="15" rx="3" fill="#ffffff" stroke="#fef3c7" strokeWidth="1" />
        <line x1="64" y1="113" x2="146" y2="113" stroke="#fde68a" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="64" y1="117" x2="146" y2="117" stroke="#fde68a" strokeWidth="1.2" strokeLinecap="round" />

        <path
          d="M50 104 C50 104 52 122 52 124 C53 126 56 126 59 126 L154 126 C157 126 159 124 159 121 L156 104 C156 101 154 100 151 100 L58 100 C54 100 50 101 50 104 Z"
          fill="url(#yellowBookCover)"
        />
        <path d="M52 104 L52 124" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Notepad Standing Upright Behind/Beside Books */}
      <g filter="url(#softShadow)">
        {/* Main Notepad Paper Body */}
        <rect
          x="122"
          y="35"
          width="82"
          height="115"
          rx="8"
          fill="#ffffff"
          stroke="#93c5fd"
          strokeWidth="2.5"
        />

        {/* Top Header of Notepad */}
        <rect x="122" y="35" width="82" height="18" rx="6" fill="#f8fafc" />
        <circle cx="132" cy="44" r="3" fill="#ef4444" opacity="0.8" />
        <circle cx="142" cy="44" r="3" fill="#f59e0b" opacity="0.8" />
        <circle cx="152" cy="44" r="3" fill="#10b981" opacity="0.8" />
        <line x1="122" y1="53" x2="204" y2="53" stroke="#e2e8f0" strokeWidth="1.5" />

        {/* Notepad Ruling Lines */}
        <line x1="134" y1="68" x2="192" y2="68" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="134" y1="80" x2="192" y2="80" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <line x1="134" y1="92" x2="182" y2="92" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <line x1="134" y1="104" x2="192" y2="104" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <line x1="134" y1="116" x2="175" y2="116" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <line x1="134" y1="128" x2="186" y2="128" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Leaning Yellow-Orange Pencil */}
      <g filter="url(#softShadow)" transform="rotate(-28 190 120)">
        {/* Pencil body */}
        <rect x="178" y="55" width="10" height="75" rx="1.5" fill="url(#pencilWood)" />
        {/* Metal Ferrule */}
        <rect x="178" y="130" width="10" height="8" fill="#94a3b8" />
        {/* Pink Eraser */}
        <path d="M178 138 C178 142 188 142 188 138 Z" fill="#f43f5e" />
        {/* Sharpened Lead Tip */}
        <polygon points="178,55 188,55 183,42" fill="#fde68a" />
        <polygon points="181,46 185,46 183,42" fill="#1e293b" />
      </g>
    </svg>
  );
}

/**
 * 3D Style Calendar with Clock illustration for Empty Today's Schedule state
 */
export function EmptyScheduleArt({ className = "w-32 h-28" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="calShadow" x="-15%" y="-15%" width="135%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1e293b" floodOpacity="0.08" />
        </filter>
        <linearGradient id="calBg" x1="30" y1="20" x2="130" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop stopColor="#f8fafc" />
        </linearGradient>
        <linearGradient id="clockBlue" x1="85" y1="75" x2="125" y2="115" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      {/* Floating Confetti Diamonds */}
      <polygon points="28,35 32,31 36,35 32,39" fill="#a78bfa" opacity="0.8" />
      <polygon points="138,42 142,38 146,42 142,46" fill="#34d399" opacity="0.8" />
      <circle cx="22" cy="78" r="2.5" fill="#f59e0b" opacity="0.8" />
      <circle cx="146" cy="88" r="2.5" fill="#38bdf8" opacity="0.8" />

      {/* Calendar Card Body */}
      <g filter="url(#calShadow)">
        <rect
          x="35"
          y="28"
          width="82"
          height="76"
          rx="14"
          fill="url(#calBg)"
          stroke="#cbd5e1"
          strokeWidth="2.5"
        />

        {/* Top Header Strip of Calendar */}
        <path
          d="M36 42 C36 34 42 29 48 29 L104 29 C110 29 116 34 116 42 L116 45 L36 45 Z"
          fill="#e2e8f0"
        />

        {/* Calendar Ring Tabs */}
        <rect x="52" y="22" width="6" height="12" rx="3" fill="#64748b" />
        <rect x="74" y="22" width="6" height="12" rx="3" fill="#64748b" />
        <rect x="96" y="22" width="6" height="12" rx="3" fill="#64748b" />

        {/* Calendar Day Grid Tiles (soft muted rounded squares) */}
        <rect x="47" y="55" width="8" height="7" rx="2" fill="#cbd5e1" />
        <rect x="61" y="55" width="8" height="7" rx="2" fill="#cbd5e1" />
        <rect x="75" y="55" width="8" height="7" rx="2" fill="#cbd5e1" />
        <rect x="89" y="55" width="8" height="7" rx="2" fill="#cbd5e1" />

        <rect x="47" y="68" width="8" height="7" rx="2" fill="#cbd5e1" />
        <rect x="61" y="68" width="8" height="7" rx="2" fill="#93c5fd" />
        <rect x="75" y="68" width="8" height="7" rx="2" fill="#cbd5e1" />
        <rect x="89" y="68" width="8" height="7" rx="2" fill="#cbd5e1" />

        <rect x="47" y="81" width="8" height="7" rx="2" fill="#cbd5e1" />
        <rect x="61" y="81" width="8" height="7" rx="2" fill="#cbd5e1" />
      </g>

      {/* Prominent Circular Blue Clock on Bottom-Right */}
      <g filter="url(#calShadow)">
        <circle cx="106" cy="94" r="18" fill="url(#clockBlue)" stroke="#ffffff" strokeWidth="3" />
        {/* Clock Hands */}
        <line x1="106" y1="94" x2="106" y2="84" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="106" y1="94" x2="114" y2="98" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="106" cy="94" r="2" fill="#ffffff" />
      </g>
    </svg>
  );
}
