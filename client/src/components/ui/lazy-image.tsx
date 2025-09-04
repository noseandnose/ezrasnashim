import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
}

export function LazyImage({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  fallback,
  onLoad,
  onError,
  onClick 
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Set up Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load image when it comes into view
  useEffect(() => {
    if (isIntersecting && src) {
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        setImageSrc(src);
        onLoad?.();
      };
      
      img.onerror = () => {
        if (fallback) {
          setImageSrc(fallback);
        }
        onError?.();
      };
    }
  }, [isIntersecting, src, fallback, onLoad, onError]);

  return (
    <img
      ref={imgRef}
      src={imageSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E'}
      alt={alt}
      className={`${className} ${!imageSrc ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
      style={{
        ...style,
        backgroundColor: !imageSrc ? '#f5f5f5' : undefined
      }}
      loading="lazy"
      onClick={onClick}
    />
  );
}