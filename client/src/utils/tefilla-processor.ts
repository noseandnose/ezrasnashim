// Tefilla text processor for conditional content based on location, time, and Jewish calendar

export interface TefillaConditions {
  isInIsrael: boolean;
  isRoshChodesh: boolean;
  isFastDay: boolean;
  hebrewDate?: {
    hebrew: string;
    date: string;
    isRoshChodesh: boolean;
    events: string[];
  };
  location?: {
    country: string;
    city: string;
  };
}

/**
 * Process Tefilla text with conditional sections
 * 
 * Code words you can use in Supabase:
 * 
 * [[OUTSIDE_ISRAEL]]content[[/OUTSIDE_ISRAEL]] - Only shows for users outside Israel
 * [[ISRAEL_ONLY]]content[[/ISRAEL_ONLY]] - Only shows for users in Israel
 * [[ROSH_CHODESH]]content[[/ROSH_CHODESH]] - Only shows on Rosh Chodesh
 * [[FAST_DAY]]content[[/FAST_DAY]] - Only shows on fast days
 * [[NOT_FAST_DAY]]content[[/NOT_FAST_DAY]] - Only shows when it's NOT a fast day
 * [[WEEKDAY]]content[[/WEEKDAY]] - Only shows on weekdays (not Shabbat/Yom Tov)
 * [[SHABBAT]]content[[/SHABBAT]] - Only shows on Shabbat
 * [[YOM_TOV]]content[[/YOM_TOV]] - Only shows on Jewish holidays
 * 
 * You can also combine conditions:
 * [[OUTSIDE_ISRAEL,ROSH_CHODESH]]content[[/OUTSIDE_ISRAEL,ROSH_CHODESH]] - Shows only for users outside Israel on Rosh Chodesh
 */
export function processTefillaText(text: string, conditions: TefillaConditions): string {
  if (!text) return text;

  let processedText = text;

  // Define condition checkers
  const conditionCheckers = {
    OUTSIDE_ISRAEL: () => !conditions.isInIsrael,
    ISRAEL_ONLY: () => conditions.isInIsrael,
    ROSH_CHODESH: () => conditions.isRoshChodesh,
    FAST_DAY: () => conditions.isFastDay,
    NOT_FAST_DAY: () => !conditions.isFastDay,
    WEEKDAY: () => {
      // Check if it's not Shabbat or Yom Tov
      const events = conditions.hebrewDate?.events || [];
      const isShabbat = events.some(event => event.toLowerCase().includes('shabbat'));
      const isYomTov = events.some(event => 
        event.toLowerCase().includes('rosh hashana') ||
        event.toLowerCase().includes('yom kippur') ||
        event.toLowerCase().includes('sukkot') ||
        event.toLowerCase().includes('pesach') ||
        event.toLowerCase().includes('shavuot') ||
        event.toLowerCase().includes('purim') ||
        event.toLowerCase().includes('chanukah')
      );
      return !isShabbat && !isYomTov;
    },
    SHABBAT: () => {
      const events = conditions.hebrewDate?.events || [];
      return events.some(event => event.toLowerCase().includes('shabbat'));
    },
    YOM_TOV: () => {
      const events = conditions.hebrewDate?.events || [];
      return events.some(event => 
        event.toLowerCase().includes('rosh hashana') ||
        event.toLowerCase().includes('yom kippur') ||
        event.toLowerCase().includes('sukkot') ||
        event.toLowerCase().includes('pesach') ||
        event.toLowerCase().includes('shavuot') ||
        event.toLowerCase().includes('purim') ||
        event.toLowerCase().includes('chanukah')
      );
    }
  };

  // Process all conditional sections
  const conditionalPattern = /\[\[([^\]]+)\]\]([\s\S]*?)\[\[\/([^\]]+)\]\]/g;
  
  processedText = processedText.replace(conditionalPattern, (match, openTag, content, closeTag) => {
    // Ensure opening and closing tags match
    if (openTag !== closeTag) {
      console.warn(`Mismatched conditional tags: ${openTag} !== ${closeTag}`);
      return match; // Return original if tags don't match
    }

    // Split conditions by comma for multiple conditions (AND logic)
    const conditions_list = openTag.split(',').map((c: string) => c.trim());
    
    // Check if all conditions are met
    const allConditionsMet = conditions_list.every((condition: string) => {
      const checker = conditionCheckers[condition as keyof typeof conditionCheckers];
      if (!checker) {
        console.warn(`Unknown condition: ${condition}`);
        return false;
      }
      return checker();
    });

    // Return content if all conditions are met, otherwise return empty string
    return allConditionsMet ? content : '';
  });

  return processedText;
}

/**
 * Get current conditions based on location and Hebrew calendar data
 */
export async function getCurrentTefillaConditions(
  latitude?: number, 
  longitude?: number
): Promise<TefillaConditions> {
  try {
    // Get location information
    let isInIsrael = false;
    let location = undefined;

    if (latitude && longitude) {
      // Check if coordinates are in Israel (approximate bounds)
      // Israel bounds: roughly 29.5-33.4°N, 34.3-35.9°E
      isInIsrael = (
        latitude >= 29.5 && latitude <= 33.4 &&
        longitude >= 34.3 && longitude <= 35.9
      );

      // Get more precise location data
      try {
        const locationResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/location/${latitude}/${longitude}`
        );
        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          isInIsrael = locationData.country?.toLowerCase().includes('israel') || 
                      locationData.country?.toLowerCase().includes('palestine') ||
                      isInIsrael; // fallback to coordinate check
          location = {
            country: locationData.country || 'Unknown',
            city: locationData.city || 'Unknown'
          };
        }
      } catch (error) {
        console.warn('Could not fetch location data:', error);
      }
    }

    // Get Hebrew calendar information
    let isRoshChodesh = false;
    let isFastDay = false;
    let hebrewDate = undefined;

    try {
      const today = new Date().toISOString().split('T')[0];
      const hebrewResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/hebrew-date/${today}`
      );
      
      if (hebrewResponse.ok) {
        hebrewDate = await hebrewResponse.json();
        isRoshChodesh = hebrewDate.isRoshChodesh || false;
        
        // Check for fast days in events
        const events = hebrewDate.events || [];
        isFastDay = events.some((event: string) => 
          event.toLowerCase().includes('fast') ||
          event.toLowerCase().includes('tzom') ||
          event.toLowerCase().includes('taanis') ||
          event.toLowerCase().includes('asara btevet') ||
          event.toLowerCase().includes('tisha bav') ||
          event.toLowerCase().includes('gedaliah') ||
          event.toLowerCase().includes('esther')
        );
      }
    } catch (error) {
      console.warn('Could not fetch Hebrew date data:', error);
    }

    return {
      isInIsrael,
      isRoshChodesh,
      isFastDay,
      hebrewDate,
      location
    };
  } catch (error) {
    console.error('Error getting Tefilla conditions:', error);
    
    // Return safe defaults
    return {
      isInIsrael: false,
      isRoshChodesh: false,
      isFastDay: false
    };
  }
}

/**
 * Debug function to test conditions
 */
export function debugTefillaConditions(conditions: TefillaConditions): void {
  console.log('Tefilla Conditions Debug:', {
    isInIsrael: conditions.isInIsrael,
    isRoshChodesh: conditions.isRoshChodesh,
    isFastDay: conditions.isFastDay,
    location: conditions.location,
    hebrewDate: conditions.hebrewDate
  });
}