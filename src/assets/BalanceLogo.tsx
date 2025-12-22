import React from 'react';

interface BalanceLogoProps {
  className?: string;
  size?: number;
}

export default function BalanceLogo({ className = '', size = 40 }: BalanceLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circular background */}
      <circle cx="50" cy="50" r="48" fill="url(#balanceGradient)" />
      
      {/* Balance scales icon */}
      <g transform="translate(15, 20)">
        {/* Center pole */}
        <rect x="33" y="5" width="5" height="50" fill="white" opacity="0.95" />
        
        {/* Base */}
        <rect x="20" y="55" width="30" height="4" rx="2" fill="white" opacity="0.95" />
        
        {/* Left scale pan */}
        <line x1="10" y1="25" x2="28" y2="25" stroke="white" strokeWidth="3.5" opacity="0.95" />
        <line x1="19" y1="25" x2="19" y2="18" stroke="white" strokeWidth="3" opacity="0.95" />
        <ellipse cx="19" cy="28" rx="12" ry="4" fill="white" opacity="0.8" />
        
        {/* Right scale pan */}
        <line x1="42" y1="25" x2="60" y2="25" stroke="white" strokeWidth="3.5" opacity="0.95" />
        <line x1="51" y1="25" x2="51" y2="18" stroke="white" strokeWidth="3" opacity="0.95" />
        <ellipse cx="51" cy="28" rx="12" ry="4" fill="white" opacity="0.8" />
        
        {/* Top beam */}
        <line x1="10" y1="18" x2="60" y2="18" stroke="white" strokeWidth="4" opacity="0.95" />
        <line x1="35" y1="18" x2="35" y2="10" stroke="white" strokeWidth="3.5" opacity="0.95" />
        <circle cx="35" cy="8" r="3" fill="white" opacity="0.95" />
      </g>
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00A859" />
          <stop offset="100%" stopColor="#007A3D" />
        </linearGradient>
      </defs>
    </svg>
  );
}
