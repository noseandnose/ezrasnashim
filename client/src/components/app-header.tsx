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
    <header className="gradient-header p-3 text-white">
      <div className="flex items-center justify-start text-[#4a4a4a] pl-3">
        <h1 className="text-xl font-semibold">Ezras Nashim</h1>
      </div>
    </header>
  );
}
