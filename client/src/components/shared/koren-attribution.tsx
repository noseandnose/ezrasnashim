import { useLocationStore } from '@/hooks/use-jewish-times';

// Shared Koren attribution component to avoid duplication
export const KorenAttribution = () => {
  const { coordinates } = useLocationStore();
  
  // Check if user is in Israel based on coordinates
  const isInIsrael = coordinates && 
    coordinates.lat >= 29.5 && coordinates.lat <= 33.5 && 
    coordinates.lng >= 34.0 && coordinates.lng <= 36.0;
  
  const korenUrl = isInIsrael 
    ? "https://korenpub.co.il/collections/siddurim/products/koren-shalem-siddurhardcoverstandardashkenaz"
    : "https://korenpub.com/collections/siddurim/products/koren-shalem-siddur-ashkenaz-1";
  
  return (
    <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
      <p className="text-sm platypi-medium text-black">
        All tefilla texts courtesy of <a href={korenUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a> and Rabbi Sacks Legacy
      </p>
    </div>
  );
};