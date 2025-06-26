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
    <header className="bg-gradient-soft p-3">
      <div className="flex items-center justify-center">
        <h1 className="font-serif text-xl font-semibold text-black tracking-wide">Ezras Nashim</h1>
      </div>
    </header>
  );
}
