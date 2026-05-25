import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'header' | 'icon';
  className?: string;
}

export default function BrandLogo({ variant = 'header', className = '' }: BrandLogoProps) {
  // Deep logo teal and warm logo orange colors are mapped in our index.css theme
  
  if (variant === 'icon') {
    return (
      <svg 
        viewBox="0 0 100 65" 
        className={`h-10 text-logo-teal ${className}`} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        id="aluga-itb-logo-icon"
      >
        {/* Leftmost ground entry */}
        <path d="M 5,55 L 14,55" />
        {/* Floor line inside tower and connecting building */}
        <path d="M 54.5,55 C 57,55 58,51 60.5,51" />
        {/* Main Front Window Storefront Box */}
        <rect x="17" y="21" width="35" height="35" rx="1.5" strokeWidth="1.8" />
        {/* Horizontal Split Line */}
        <line x1="17" y1="36" x2="52" y2="36" strokeWidth="1.8" />
        {/* Vertical Split Line */}
        <line x1="34" y1="21" x2="34" y2="56" strokeWidth="1.8" stroke="currentColor" />
        {/* Window Glares (Diagonal Glass Reflections) */}
        <line x1="22" y1="46" x2="26" y2="40" strokeWidth="1.25" strokeOpacity="0.7" />
        <line x1="39" y1="46" x2="43" y2="40" strokeWidth="1.25" strokeOpacity="0.7" />
        <line x1="45" y1="46" x2="49" y2="40" strokeWidth="1.25" strokeOpacity="0.7" />
        {/* Structural Background Sloped Line for Architectural Depth */}
        <path d="M 14,25 L 14,14 L 52,19" strokeWidth="1.5" />
        {/* Tower Building Core on Right */}
        <path d="M 53,55 M 55,27 L 55,16 L 81,16 L 81,51.5 L 81,55" strokeWidth="1.8" />
        {/* Tall Outer Round Archway inside tower */}
        <path d="M 60,55 A 10.5 10.5 0 0 1 71,44.5 A 10.5 10.5 0 0 1 82,55" strokeWidth="1.8" />
        {/* Tiny Door Arch inside the giant archway */}
        <path d="M 64.5,55 L 64.5,47 A 5.5 5.5 0 0 1 70,41.5 A 5.5 5.5 0 0 1 75.5,47 L 75.5,55" strokeWidth="1.5" />
        {/* Ground Line Right Extension */}
        <path d="M 81,55 L 94,55" strokeWidth="1.8" />
      </svg>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col md:flex-row items-center justify-center gap-6 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-4xl mx-auto ${className}`} id="aluga-itb-logo-full">
        {/* Elegant architectural drawing */}
        <div className="shrink-0 scale-125 my-4">
          <BrandLogo variant="icon" className="w-[120px] h-auto text-[#0E5A60]" />
        </div>
        
        {/* Corporate branding texts */}
        <div className="text-center md:text-left select-none">
          <div className="flex items-baseline justify-center md:justify-start gap-1 font-display">
            <span className="text-5xl font-extrabold tracking-tight text-[#0E5A60]">ALUGA</span>
            <span className="text-5xl font-black tracking-tight text-[#D17624]">ITB</span>
          </div>
          <div className="mt-2 text-slate-500 font-sans tracking-[0.22em] text-[10.5px] uppercase font-bold leading-tight">
            Aluguel de Espaços
          </div>
          <div className="text-slate-500 font-sans tracking-[0.22em] text-[10.5px] uppercase font-bold leading-tight">
            Para Eventos Itaituba
          </div>
        </div>
      </div>
    );
  }

  // Header compact version as primary
  return (
    <div className={`flex items-center gap-3 ${className}`} id="aluga-itb-logo-header">
      {/* Small beautiful minimalist line art icon */}
      <div className="shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-150/40">
        <BrandLogo variant="icon" className="w-14 h-9 text-[#0E5A60]" />
      </div>
      
      {/* Brand typographic side */}
      <div className="leading-tight select-none">
        <div className="flex items-baseline gap-0.5 font-display">
          <span className="text-xl font-extrabold tracking-tight text-[#0E5A60]">ALUGA</span>
          <span className="text-xl font-black tracking-tight text-[#D17624]">ITB</span>
          <span className="ml-1 text-[8.5px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-md uppercase font-mono tracking-wider">
            Itaituba
          </span>
        </div>
        <p className="text-[10px] text-slate-500 font-semibold tracking-wide mt-0.5">
          Aluguel de Espaços para Eventos
        </p>
      </div>
    </div>
  );
}
