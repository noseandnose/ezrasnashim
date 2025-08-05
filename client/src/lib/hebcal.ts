import type { HebcalResponse } from "./types";

export async function fetchHebcalData(location: string = "5128581"): Promise<HebcalResponse> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/hebcal/${location}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Hebcal data');
    }
    return await response.json();
  } catch (error) {

    throw error;
  }
}

// Local halachic time adjustments (in minutes)
const HALACHIC_ADJUSTMENTS: { [key: string]: { shkia: number; sunrise: number } } = {
  'New York': {
    shkia: -42,  // 42 minutes earlier than astronomical sunset
    sunrise: -3  // 3 minutes earlier than astronomical sunrise
  }
};

function adjustTime(timeStr: string, adjustmentMinutes: number): string {
  if (!timeStr || timeStr === 'N/A') return timeStr;
  
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    
    date.setMinutes(date.getMinutes() + adjustmentMinutes);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    });
  } catch {
    return timeStr;
  }
}

export function parseJewishTimes(hebcalData: HebcalResponse) {
  const location = hebcalData.location?.title || 'New York';
  const adjustments = HALACHIC_ADJUSTMENTS[location] || HALACHIC_ADJUSTMENTS['New York'];
  
  const times: Record<string, string> = {};
  
  // Find specific times from the items array
  hebcalData.items.forEach(item => {
    const time = item.time;
    if (!time) return;
    
    const timeStr = new Date(time).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    });
    
    switch (item.title.toLowerCase()) {
      case 'sunrise':
        times.sunrise = adjustTime(time, adjustments.sunrise);
        break;
      case 'sunset':
        times.shkia = adjustTime(time, adjustments.shkia);
        break;
      case 'tzeit hakochavim':
        times.tzaitHakochavim = timeStr;
        break;
      case 'mincha gedolah':
        times.minchaGedolah = timeStr;
        break;
      case 'mincha ketanah':
        times.minchaKetanah = timeStr;
        break;
      case 'candle lighting':
        times.candleLighting = timeStr;
        break;
      case 'havdalah':
        times.havdalah = timeStr;
        break;
    }
  });

  return {
    hebrewDate: hebcalData.date?.hebrew || '',
    location: location,
    sunrise: times.sunrise || 'N/A',
    shkia: times.shkia || 'N/A',
    tzaitHakochavim: times.tzaitHakochavim || 'N/A',
    minchaGedolah: times.minchaGedolah || 'N/A',
    minchaKetanah: times.minchaKetanah || 'N/A',
    candleLighting: times.candleLighting,
    havdalah: times.havdalah
  };
}
