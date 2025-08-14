// Tefilla text processor for conditional content based on location, time, and Jewish calendar

export interface TefillaConditions {
  isInIsrael: boolean;
  isRoshChodesh: boolean;
  isFastDay: boolean;
  isAseretYemeiTeshuva: boolean;
  isSukkot: boolean;
  isPesach: boolean;
  isRoshChodeshSpecial: boolean;
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
 * Code words you can use in Supabase (default content always shows):
 * 
 * [[OUTSIDE_ISRAEL]]content[[/OUTSIDE_ISRAEL]] - Only shows for users outside Israel
 * [[ONLY_ISRAEL]]content[[/ONLY_ISRAEL]] - Only shows for users in Israel
 * [[ROSH_CHODESH]]content[[/ROSH_CHODESH]] - Only shows on Rosh Chodesh
 * [[FAST_DAY]]content[[/FAST_DAY]] - Only shows on fast days
 * [[ASERET_YEMEI_TESHUVA]]content[[/ASERET_YEMEI_TESHUVA]] - Only shows during days between Rosh Hashana and Yom Kippur
 * [[SUKKOT]]content[[/SUKKOT]] - Only shows during Sukkot
 * [[PESACH]]content[[/PESACH]] - Only shows during Pesach
 * [[ROSH_CHODESH_SPECIAL]]content[[/ROSH_CHODESH_SPECIAL]] - HIDES content during Rosh Chodesh, Pesach, Sukkot, or Aseret Yemei Teshuva
 * 
 * You can combine conditions:
 * [[OUTSIDE_ISRAEL,ROSH_CHODESH]]content[[/OUTSIDE_ISRAEL,ROSH_CHODESH]] - Shows only for users outside Israel on Rosh Chodesh
 * [[ONLY_ISRAEL,SUKKOT]]content[[/ONLY_ISRAEL,SUKKOT]] - Shows only for users in Israel during Sukkot
 */
export function processTefillaText(text: string, conditions: TefillaConditions): string {
  if (!text) return text;

  let processedText = text;

  // Define condition checkers for all special conditions
  const conditionCheckers = {
    OUTSIDE_ISRAEL: () => !conditions.isInIsrael,
    ONLY_ISRAEL: () => conditions.isInIsrael,
    ROSH_CHODESH: () => conditions.isRoshChodesh,
    FAST_DAY: () => conditions.isFastDay,
    ASERET_YEMEI_TESHUVA: () => conditions.isAseretYemeiTeshuva,
    SUKKOT: () => conditions.isSukkot,
    PESACH: () => conditions.isPesach,
    ROSH_CHODESH_SPECIAL: () => !conditions.isRoshChodeshSpecial // Exclusion logic: shows when NOT in special periods
  };

  // Process all conditional sections with opening and closing tags
  const conditionalPattern = /\[\[([^\]]+)\]\]([\s\S]*?)\[\[\/([^\]]+)\]\]/g;
  
  processedText = processedText.replace(conditionalPattern, (match, openTag, content, closeTag) => {
    // Ensure opening and closing tags match
    if (openTag !== closeTag) {
      console.warn(`Mismatched conditional tags: ${openTag} !== ${closeTag}`);
      return match; // Return original if tags don't match
    }

    // Split conditions by comma for multiple conditions (AND logic)
    const conditions_list = openTag.split(',').map((c: string) => c.trim());
    
    // Debug logging
    console.log(`Processing conditional tag: ${openTag}`);
    console.log(`Current conditions:`, {
      isInIsrael: conditions.isInIsrael,
      isRoshChodesh: conditions.isRoshChodesh,
      isFastDay: conditions.isFastDay,
      isAseretYemeiTeshuva: conditions.isAseretYemeiTeshuva,
      isSukkot: conditions.isSukkot,
      isPesach: conditions.isPesach,
      isRoshChodeshSpecial: conditions.isRoshChodeshSpecial
    });
    
    // Check if all conditions are met
    const allConditionsMet = conditions_list.every((condition: string) => {
      const checker = conditionCheckers[condition as keyof typeof conditionCheckers];
      if (!checker) {
        console.warn(`Unknown condition: ${condition}`);
        return false;
      }
      const result = checker();
      console.log(`Condition ${condition}: ${result}`);
      return result;
    });

    console.log(`All conditions met: ${allConditionsMet}, returning:`, allConditionsMet ? content : '[HIDDEN]');

    // Return content if all conditions are met, otherwise return empty string
    return allConditionsMet ? content : '';
  });

  // Also remove any malformed single bracket conditional tags that don't have proper format
  processedText = processedText.replace(/\[\[([^\]]*(?:ROSH_CHODESH|PESACH|SUKKOT|FAST_DAY|ASERET_YEMEI_TESHUVA|OUTSIDE_ISRAEL|ROSH_CHODESH_SPECIAL)[^\]]*)\]\]/g, (match, content) => {
    // If it looks like a malformed condition tag without proper opening/closing, remove it
    const knownConditions = ['ROSH_CHODESH', 'PESACH', 'SUKKOT', 'FAST_DAY', 'ASERET_YEMEI_TESHUVA', 'OUTSIDE_ISRAEL', 'ROSH_CHODESH_SPECIAL'];
    const hasKnownCondition = knownConditions.some(condition => content.includes(condition));
    
    if (hasKnownCondition) {
      console.log(`Removing malformed conditional tag: ${match}`);
      return ''; // Remove malformed conditional tags
    }
    
    return match; // Keep non-conditional content in brackets
  });

  // Clean up excessive whitespace and empty lines left by hidden content
  processedText = processedText
    // Remove multiple consecutive line breaks (more than 2)
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Remove trailing whitespace from lines
    .replace(/[ \t]+$/gm, '')
    // Remove leading/trailing empty lines
    .trim();

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
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const locationResponse = await fetch(
          `${apiUrl}/api/location/${latitude}/${longitude}`
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
    let isAseretYemeiTeshuva = false;
    let isSukkot = false;
    let isPesach = false;
    let isRoshChodeshSpecial = false;
    let hebrewDate = undefined;

    try {
      const today = new Date().toISOString().split('T')[0];
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const hebrewResponse = await fetch(
        `${apiUrl}/api/hebrew-date/${today}`
      );
      
      console.log(`Fetching Hebrew date from: ${apiUrl}/api/hebrew-date/${today}`);
      
      if (hebrewResponse.ok) {
        hebrewDate = await hebrewResponse.json();
        isRoshChodesh = hebrewDate.isRoshChodesh || false;
        
        // Check for events in Hebrew calendar
        const events = hebrewDate.events || [];
        
        // Check for fast days
        isFastDay = events.some((event: string) => 
          event.toLowerCase().includes('fast') ||
          event.toLowerCase().includes('tzom') ||
          event.toLowerCase().includes('taanis') ||
          event.toLowerCase().includes('asara btevet') ||
          event.toLowerCase().includes('tisha bav') ||
          event.toLowerCase().includes('gedaliah') ||
          event.toLowerCase().includes('esther')
        );
        
        // Check for Aseret Yemei Teshuva (between Rosh Hashana and Yom Kippur)
        isAseretYemeiTeshuva = events.some((event: string) => 
          event.toLowerCase().includes('rosh hashana') ||
          event.toLowerCase().includes('tzom gedaliah') ||
          event.toLowerCase().includes('yom kippur')
        ) || (hebrewDate.hebrew && (
          hebrewDate.hebrew.includes('תשרי') && 
          (hebrewDate.hebrew.includes('א׳') || hebrewDate.hebrew.includes('ב׳') || 
           hebrewDate.hebrew.includes('ג׳') || hebrewDate.hebrew.includes('ד׳') || 
           hebrewDate.hebrew.includes('ה׳') || hebrewDate.hebrew.includes('ו׳') || 
           hebrewDate.hebrew.includes('ז׳') || hebrewDate.hebrew.includes('ח׳') || 
           hebrewDate.hebrew.includes('ט׳') || hebrewDate.hebrew.includes('י׳'))
        ));
        
        // Check for Sukkot
        isSukkot = events.some((event: string) => 
          event.toLowerCase().includes('sukkot') ||
          event.toLowerCase().includes('hoshanah') ||
          event.toLowerCase().includes('simchat torah') ||
          event.toLowerCase().includes('shemini atzeret')
        );
        
        // Check for Pesach
        isPesach = events.some((event: string) => 
          event.toLowerCase().includes('pesach') ||
          event.toLowerCase().includes('passover') ||
          event.toLowerCase().includes('seder')
        );
        
        // Check if we're in any special period (for exclusion logic)
        isRoshChodeshSpecial = isRoshChodesh || isPesach || isSukkot || isAseretYemeiTeshuva;
        
        console.log('Hebrew calendar conditions loaded:', {
          isRoshChodesh,
          isFastDay,
          isAseretYemeiTeshuva,
          isSukkot,
          isPesach,
          isRoshChodeshSpecial,
          events,
          hebrewDate: hebrewDate.hebrew
        });
      }
    } catch (error) {
      console.warn('Could not fetch Hebrew date data:', error);
    }

    const finalConditions = {
      isInIsrael,
      isRoshChodesh,
      isFastDay,
      isAseretYemeiTeshuva,
      isSukkot,
      isPesach,
      isRoshChodeshSpecial,
      hebrewDate,
      location
    };
    
    console.log('Final Tefilla conditions:', finalConditions);
    return finalConditions;
  } catch (error) {
    console.error('Error getting Tefilla conditions:', error);
    
    // Return safe defaults
    return {
      isInIsrael: false,
      isRoshChodesh: false,
      isFastDay: false,
      isAseretYemeiTeshuva: false,
      isSukkot: false,
      isPesach: false,
      isRoshChodeshSpecial: false
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
    isAseretYemeiTeshuva: conditions.isAseretYemeiTeshuva,
    isSukkot: conditions.isSukkot,
    isPesach: conditions.isPesach,
    isRoshChodeshSpecial: conditions.isRoshChodeshSpecial,
    location: conditions.location,
    hebrewDate: conditions.hebrewDate
  });
}