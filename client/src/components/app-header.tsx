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
    <header className="gradient-header p-4 text-white">
      <div className="flex items-center justify-between text-[#4a4a4a]">
        <div>
          <h1 className="text-xl font-semibold">Ezras Nashim</h1>
          <p className="text-sm opacity-90">
            {dateLoading ? "Loading..." : hebrewDate || "Hebrew Date"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{timesLoading ? "Loading..." : times?.shkia || "7:44 PM"}</p>
          <p className="text-xs opacity-90">
            Shkiah
          </p>
        </div>
      </div>
    </header>
  );
}
