import { useDailyCompletionStore } from "@/lib/types";

interface DailyProgressProps {
  size?: number;
}

export default function DailyProgress({ size = 36 }: DailyProgressProps) {
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  
  // Count completed sections
  const completedCount = [torahCompleted, tefillaCompleted, tzedakaCompleted].filter(Boolean).length;
  
  // Map completion count to the appropriate image using your new images
  const getProgressImage = () => {
    // Add cache busting and try absolute URLs
    const timestamp = Date.now();
    const baseUrl = 'http://localhost:5000'; // Direct to backend
    
    switch (completedCount) {
      case 0:
        return {
          src: `${baseUrl}/api/media/State%200_1752569595325.png?t=${timestamp}`,
          scale: 0.9, // Large scale within fixed container
          alt: "No completions"
        };
      case 1:
        return {
          src: `${baseUrl}/api/media/State%201_1752569595325.png?t=${timestamp}`,
          scale: 0.8, // Medium scale
          alt: "One completion"
        };
      case 2:
        return {
          src: `${baseUrl}/api/media/State%202_1752569595325.png?t=${timestamp}`,
          scale: 0.9, // Large scale
          alt: "Two completions"
        };
      case 3:
        return {
          src: `${baseUrl}/api/media/State%203_1752569595324.png?t=${timestamp}`,
          scale: 1.0, // Fills container
          alt: "All three completions!"
        };
      default:
        return {
          src: `${baseUrl}/api/media/State%200_1752569595325.png?t=${timestamp}`,
          scale: 0.9,
          alt: "Daily progress"
        };
    }
  };

  const progressImage = getProgressImage();

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative">
        <img
          src={progressImage.src}
          alt={progressImage.alt}
          className="object-contain"
          style={{
            width: `${100 * progressImage.scale}px`,
            height: `${100 * progressImage.scale}px`,
            maxWidth: '100px',
            maxHeight: '100px'
          }}
          onError={(e) => {
            console.error('Image failed to load:', progressImage.src);
            console.error('Current target src:', e.currentTarget.src);
            console.error('Completion count:', completedCount);
            console.error('Error event:', e);
            
            // Try alternative paths in order
            const altSrc1 = progressImage.src.replace('/api/media/', '/attached_assets/');
            const altSrc2 = progressImage.src.replace('http://localhost:5000/api/media/', '/attached_assets/');
            console.log('Trying alternative paths:', altSrc1, altSrc2);
            
            // Try first alternative
            if (e.currentTarget.src.includes('api/media')) {
              e.currentTarget.src = altSrc1;
            } else if (e.currentTarget.src.includes('attached_assets')) {
              e.currentTarget.src = altSrc2;
            }
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', progressImage.src);
          }}
        />
        {/* Debug info overlay */}
        <div className="absolute bottom-0 left-0 text-xs bg-black bg-opacity-50 text-white px-1 rounded">
          {completedCount}
        </div>
      </div>
    </div>
  );
}