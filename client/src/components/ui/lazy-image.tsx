import { useState, useEffect, useRef, memo } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
  webpSrc?: string;
}

let webpSupported: boolean | null = null;

function checkWebPSupport(): Promise<boolean> {
  if (webpSupported !== null) return Promise.resolve(webpSupported);
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      webpSupported = img.width > 0 && img.height > 0;
      resolve(webpSupported);
    };
    img.onerror = () => {
      webpSupported = false;
      resolve(false);
    };
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
}

function getWebPUrl(src: string): string | null {
  if (!src) return null;
  if (src.endsWith('.webp')) return src;
  if (src.includes('cloudinary.com')) {
    return src.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
  }
  return null;
}

function LazyImageComponent({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  fallback,
  onLoad,
  onError,
  onClick,
  webpSrc
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

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
        rootMargin: '50px',
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

  useEffect(() => {
    if (isIntersecting && src) {
      const loadImage = async () => {
        const supportsWebP = await checkWebPSupport();
        const webpUrl = webpSrc || getWebPUrl(src);
        const urlToTry = supportsWebP && webpUrl ? webpUrl : src;
        
        const img = new Image();
        img.src = urlToTry;
        
        img.onload = () => {
          setImageSrc(urlToTry);
          onLoad?.();
        };
        
        img.onerror = () => {
          if (urlToTry !== src) {
            const fallbackImg = new Image();
            fallbackImg.src = src;
            fallbackImg.onload = () => {
              setImageSrc(src);
              onLoad?.();
            };
            fallbackImg.onerror = () => {
              if (fallback) setImageSrc(fallback);
              onError?.();
            };
          } else if (fallback) {
            setImageSrc(fallback);
            onError?.();
          } else {
            onError?.();
          }
        };
      };
      
      loadImage();
    }
  }, [isIntersecting, src, webpSrc, fallback, onLoad, onError]);

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

export const LazyImage = memo(LazyImageComponent);