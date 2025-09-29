import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  borderRadius = '4px',
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };

  return (
    <div
      className={`${baseClasses} ${animationClasses[animation]} ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
        borderRadius
      }}
    />
  );
};

// Predefined skeleton components for common UI patterns
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 border rounded-lg ${className}`}>
    <Skeleton height="20px" width="60%" className="mb-2" />
    <Skeleton height="16px" width="100%" className="mb-2" />
    <Skeleton height="16px" width="80%" className="mb-4" />
    <div className="flex justify-between items-center">
      <Skeleton height="32px" width="100px" borderRadius="16px" />
      <Skeleton height="16px" width="60px" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ 
  items?: number; 
  className?: string;
  showAvatar?: boolean;
}> = ({ items = 5, className = '', showAvatar = false }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3 p-3">
        {showAvatar && (
          <Skeleton width="40px" height="40px" borderRadius="50%" />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton height="16px" width="70%" />
          <Skeleton height="14px" width="50%" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`overflow-hidden ${className}`}>
    <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: rows * columns }).map((_, index) => (
        <Skeleton key={index} height="20px" />
      ))}
    </div>
  </div>
);

export const SkeletonText: React.FC<{ 
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}> = ({ lines = 3, className = '', lastLineWidth = '60%' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height="16px"
        width={index === lines - 1 ? lastLineWidth : '100%'}
      />
    ))}
  </div>
);

export const SkeletonImage: React.FC<{ 
  width?: string | number;
  height?: string | number;
  className?: string;
}> = ({ width = '100%', height = '200px', className = '' }) => (
  <Skeleton
    width={width}
    height={height}
    borderRadius="8px"
    className={className}
  />
);

export const SkeletonButton: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: '80px', height: '32px' },
    md: { width: '120px', height: '40px' },
    lg: { width: '160px', height: '48px' }
  };

  return (
    <Skeleton
      width={sizes[size].width}
      height={sizes[size].height}
      borderRadius="6px"
      className={className}
    />
  );
};

export const SkeletonAvatar: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: '32px',
    md: '40px',
    lg: '64px'
  };

  return (
    <Skeleton
      width={sizes[size]}
      height={sizes[size]}
      borderRadius="50%"
      className={className}
    />
  );
};

export default Skeleton;