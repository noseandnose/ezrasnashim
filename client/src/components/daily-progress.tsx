import { useDailyCompletionStore } from "@/lib/types";
import state0Image from '@assets/State 0_1752569595325.png';
import state1Image from '@assets/State 1_1752569595325.png';
import state2Image from '@assets/State 2_1752569595325.png';
import state3Image from '@assets/State 3_1752569595324.png';

interface DailyProgressProps {
  size?: number;
}

export default function DailyProgress({ size = 36 }: DailyProgressProps) {
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  
  // Count completed sections
  const completedCount = [torahCompleted, tefillaCompleted, tzedakaCompleted].filter(Boolean).length;
  
  // Map completion count to the appropriate image using imported static assets
  const getProgressImage = () => {
    switch (completedCount) {
      case 0:
        return {
          src: state0Image,
          scale: 0.9,
          alt: "No completions"
        };
      case 1:
        return {
          src: state1Image,
          scale: 0.8,
          alt: "One completion"
        };
      case 2:
        return {
          src: state2Image,
          scale: 0.9,
          alt: "Two completions"
        };
      case 3:
        return {
          src: state3Image,
          scale: 1.0,
          alt: "All three completions!"
        };
      default:
        return {
          src: state0Image,
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
      />
    </div>
  );
}