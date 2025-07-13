import React from 'react';

interface FlowerProgressProps {
  completed: boolean;
  size?: number;
}

export default function FlowerProgress({ completed, size = 20 }: FlowerProgressProps) {
  if (completed) {
    return (
      <div className="relative">
        <svg width={size} height={size} viewBox="0 0 24 24" className="text-pink-500">
          {/* Flower petals */}
          <g className="origin-center">
            {/* Top petal */}
            <ellipse cx="12" cy="8" rx="2" ry="4" fill="currentColor" />
            {/* Right petal */}
            <ellipse cx="16" cy="12" rx="4" ry="2" fill="currentColor" />
            {/* Bottom petal */}
            <ellipse cx="12" cy="16" rx="2" ry="4" fill="currentColor" />
            {/* Left petal */}
            <ellipse cx="8" cy="12" rx="4" ry="2" fill="currentColor" />
            {/* Center circle */}
            <circle cx="12" cy="12" r="2" fill="#FFD700" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-300">
        {/* Flower outline */}
        <g className="origin-center">
          {/* Top petal */}
          <ellipse cx="12" cy="8" rx="2" ry="4" fill="none" stroke="currentColor" strokeWidth="1" />
          {/* Right petal */}
          <ellipse cx="16" cy="12" rx="4" ry="2" fill="none" stroke="currentColor" strokeWidth="1" />
          {/* Bottom petal */}
          <ellipse cx="12" cy="16" rx="2" ry="4" fill="none" stroke="currentColor" strokeWidth="1" />
          {/* Left petal */}
          <ellipse cx="8" cy="12" rx="4" ry="2" fill="none" stroke="currentColor" strokeWidth="1" />
          {/* Center circle */}
          <circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}