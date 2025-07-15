import { useDailyCompletionStore } from "@/lib/types";

interface DailyProgressProps {
  size?: number;
}

export default function DailyProgress({ size = 36 }: DailyProgressProps) {
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  
  // Count completed sections
  const completedCount = [torahCompleted, tefillaCompleted, tzedakaCompleted].filter(Boolean).length;
  
  // Map completion count to the appropriate image and size
  const getProgressImage = () => {
    const baseUrl = '/attached_assets/';
    switch (completedCount) {
      case 0:
        return {
          src: `${baseUrl}State 0_1752568332614.png`,
          width: size * 3.0, // 108px when size=36
          height: size * 3.0,
          alt: "No completions - empty state"
        };
      case 1:
        return {
          src: `${baseUrl}State 1_1752568332613.png`,
          width: size * 2.5, // 90px when size=36
          height: size * 2.5,
          alt: "One completion"
        };
      case 2:
        return {
          src: `${baseUrl}State 2_1752568332613.png`,
          width: size * 3.0, // 108px when size=36
          height: size * 3.0,
          alt: "Two completions"
        };
      case 3:
        return {
          src: `${baseUrl}State 3_1752568332607.png`,
          width: size * 3.2, // 115px when size=36
          height: size * 3.2,
          alt: "All three completions - celebration!"
        };
      default:
        return {
          src: `${baseUrl}State 0_1752568332614.png`,
          width: size * 3.0,
          height: size * 3.0,
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
          maxWidth: '115px',
          maxHeight: '115px',
          width: `${progressImage.width}px`,
          height: `${progressImage.height}px`
        }}
      />
    </div>
  );
}