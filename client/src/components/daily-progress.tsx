import { useDailyCompletionStore } from "@/lib/types";
import state0Image from "@assets/State 0_1752568332614.png";
import state1Image from "@assets/State 1_1752568332613.png";
import state2Image from "@assets/State 2_1752568332613.png";
import state3Image from "@assets/State 3_1752568332607.png";

interface DailyProgressProps {
  size?: number;
}

export default function DailyProgress({ size = 36 }: DailyProgressProps) {
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  
  // Count completed sections
  const completedCount = [torahCompleted, tefillaCompleted, tzedakaCompleted].filter(Boolean).length;
  
  // Map completion count to the appropriate image and size
  const getProgressImage = () => {
    switch (completedCount) {
      case 0:
        return {
          src: state0Image,
          width: size * 2.2, // 80px when size=36
          height: size * 2.2,
          alt: "No completions - empty state"
        };
      case 1:
        return {
          src: state1Image,
          width: size * 1.7, // 60px when size=36
          height: size * 1.7,
          alt: "One completion"
        };
      case 2:
        return {
          src: state2Image,
          width: size * 2.2, // 80px when size=36
          height: size * 2.2,
          alt: "Two completions"
        };
      case 3:
        return {
          src: state3Image,
          width: size * 2.8, // 100px when size=36
          height: size * 2.8,
          alt: "All three completions - celebration!"
        };
      default:
        return {
          src: state0Image,
          width: size * 2.2,
          height: size * 2.2,
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
        width={progressImage.width}
        height={progressImage.height}
        className="object-contain"
        style={{
          maxWidth: '100px',
          maxHeight: '100px',
          width: `${progressImage.width}px`,
          height: `${progressImage.height}px`
        }}
      />
    </div>
  );
}