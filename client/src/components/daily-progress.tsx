import { useDailyCompletionStore } from "@/lib/types";

interface DailyProgressProps {
  size?: number;
}

export default function DailyProgress({ size = 36 }: DailyProgressProps) {
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  
  // Count completed sections
  const completedCount = [torahCompleted, tefillaCompleted, tzedakaCompleted].filter(Boolean).length;
  
  // Map completion count to the appropriate image
  const getProgressImage = () => {
    switch (completedCount) {
      case 0:
        return {
          src: `/attached_assets/State 0_1752568332614.png`,
          scale: 0.9, // Large scale within fixed container
          alt: "No completions"
        };
      case 1:
        return {
          src: `/attached_assets/State 1_1752568332613.png`,
          scale: 0.8, // Medium scale
          alt: "One completion"
        };
      case 2:
        return {
          src: `/attached_assets/State 2_1752568332613.png`,
          scale: 0.9, // Large scale
          alt: "Two completions"
        };
      case 3:
        return {
          src: `/attached_assets/State 3_1752568332607.png`,
          scale: 1.0, // Fills container
          alt: "All three completions!"
        };
      default:
        return {
          src: `/attached_assets/State 0_1752568332614.png`,
          scale: 0.9,
          alt: "Daily progress"
        };
    }
  };

  const progressImage = getProgressImage();

  return (
    <div 
      className="flex items-center justify-center"
      style={{
        width: '120px',
        height: '120px',
        position: 'relative'
      }}
    >
      <img
        src={progressImage.src}
        alt={progressImage.alt}
        className="object-contain"
        style={{
          width: `${120 * progressImage.scale}px`,
          height: `${120 * progressImage.scale}px`,
          maxWidth: '114px',
          maxHeight: '114px'
        }}
        onError={(e) => {
          console.error('Image failed to load:', progressImage.src);
          console.error('Tried path:', progressImage.src);
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', progressImage.src);
        }}
      />
    </div>
  );
}