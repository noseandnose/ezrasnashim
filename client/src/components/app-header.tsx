import { useJewishTimes } from "@/hooks/use-jewish-times";

export default function AppHeader() {
  const { data: times, isLoading } = useJewishTimes();

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <header className="gradient-header p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ezras Nashim</h1>
          <p className="text-sm opacity-90">
            {isLoading ? "Loading..." : times?.hebrewDate || "Hebrew Date"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{isLoading ? "Loading..." : times?.sunset || getCurrentTime()}</p>
          <p className="text-xs opacity-90">
            Shkiah
          </p>
        </div>
      </div>
    </header>
  );
}
