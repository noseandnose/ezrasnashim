import { useDailyCompletionStore } from "@/lib/types";

interface DailyProgressProps {
  size?: number;
}

export default function DailyProgress({ size = 36 }: DailyProgressProps) {
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  
  // Count completed sections
  const completedCount = [torahCompleted, tefillaCompleted, tzedakaCompleted].filter(Boolean).length;
  
  // For development, show a placeholder until we fix the image loading
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div 
          className="rounded-full border-2 border-blush flex items-center justify-center text-xs font-bold text-blush"
          style={{
            width: `${100 * 0.9}px`,
            height: `${100 * 0.9}px`,
            maxWidth: '100px',
            maxHeight: '100px'
          }}
        >
          {completedCount}/3
        </div>
      </div>
    );
  }
  
  // Map completion count to the appropriate image using static serving
  const getProgressImage = () => {
    switch (completedCount) {
      case 0:
        return {
          src: `http://localhost:5000/attached_assets/State%200_1752568332614.png`,
          scale: 0.9, // Large scale within fixed container
          alt: "No completions"
        };
      case 1:
        return {
          src: `http://localhost:5000/attached_assets/State%201_1752568332613.png`,
          scale: 0.8, // Medium scale
          alt: "One completion"
        };
      case 2:
        return {
          src: `http://localhost:5000/attached_assets/State%202_1752568332613.png`,
          scale: 0.9, // Large scale
          alt: "Two completions"
        };
      case 3:
        return {
          src: `http://localhost:5000/attached_assets/State%203_1752568332607.png`,
          scale: 1.0, // Fills container
          alt: "All three completions!"
        };
      default:
        return {
          src: `http://localhost:5000/attached_assets/State%200_1752568332614.png`,
          scale: 0.9,
          alt: "Daily progress"
        };
    }
  };

  const progressImage = getProgressImage();

  return (
    <div className="flex items-center justify-center w-full h-full">
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
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', progressImage.src);
        }}
      />
    </div>
  );
}