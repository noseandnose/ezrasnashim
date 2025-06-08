import type { HebcalResponse } from "./types";

export async function fetchHebcalData(location: string = "5128581"): Promise<HebcalResponse> {
  try {
    const response = await fetch(`/api/hebcal/${location}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Hebcal data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Hebcal data:', error);
    throw error;
  }
}

export function parseJewishTimes(hebcalData: HebcalResponse) {
  const candleLighting = hebcalData.items.find(item => item.category === 'candles')?.time;
  const havdalah = hebcalData.items.find(item => item.category === 'havdalah')?.time;

  return {
    hebrewDate: hebcalData.date?.hebrew || '',
    location: hebcalData.location?.title || '',
    candleLighting,
    havdalah,
    // These would typically come from the API as well
    sunrise: '7:12 AM',
    sunset: '4:32 PM'
  };
}
