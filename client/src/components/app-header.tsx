import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useHebrewDate } from "@/hooks/use-hebrew-date";

export default function AppHeader() {
  const { data: times, isLoading: timesLoading } = useJewishTimes();
  const { data: hebrewDate, isLoading: dateLoading } = useHebrewDate();

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <header className="bg-gradient-to-r from-blush/10 to-lavender/10 backdrop-blur-sm border-b border-blush/20 p-4">
      <div className="flex items-center justify-center">
        <h1 className="font-serif text-2xl font-semibold text-warm-gray">Ezras Nashim</h1>
      </div>
    </header>
  );
}
