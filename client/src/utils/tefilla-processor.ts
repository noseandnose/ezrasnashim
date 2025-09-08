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
  } | undefined;
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
 * [[OUTSIDE_ISRAEL,ROSH_CHODESH]]content[[/OUTSIDE_ISRAEL,ROSH_CHODESH]] - Shows only for users outside Israel AND on Rosh Chodesh (both must be true)
 * [[ROSH_CHODESH|SUKKOT|PESACH]]content[[/ROSH_CHODESH|SUKKOT|PESACH]] - Shows during any of these holidays (OR logic)
 * [[ONLY_ISRAEL,SUKKOT]]content[[/ONLY_ISRAEL,SUKKOT]] - Shows only for users in Israel AND during Sukkot (both must be true)
 */
export function processTefillaText(text: string, conditions: TefillaConditions): string {
  if (!text) return text;

  let processedText = text;
  
  // Extract selectedFoodTypes if present
  const extendedConditions = conditions as any;
  const selectedFoodTypes = extendedConditions?.selectedFoodTypes || {};

  // Define condition checkers for all special conditions
  const conditionCheckers = {
    OUTSIDE_ISRAEL: () => !conditions.isInIsrael,
    ONLY_ISRAEL: () => conditions.isInIsrael,
    ROSH_CHODESH: () => conditions.isRoshChodesh,
    FAST_DAY: () => conditions.isFastDay,
    ASERET_YEMEI_TESHUVA: () => conditions.isAseretYemeiTeshuva,
    SUKKOT: () => conditions.isSukkot,
    PESACH: () => conditions.isPesach,
    ROSH_CHODESH_SPECIAL: () => !conditions.isRoshChodeshSpecial, // Exclusion logic: shows when NOT in special periods
    // Me'ein Shalosh food selection conditions
    grain: () => selectedFoodTypes.grain === true,
    wine: () => selectedFoodTypes.wine === true,
    fruit: () => selectedFoodTypes.fruit === true
  };


  // Process all conditional sections with localized priority logic
  const conditionalPattern = /\[\[([^\]]+)\]\]([\s\S]*?)\[\[\/([^\]]+)\]\]/g;
  const matches: Array<{
    fullMatch: string;
    tag: string;
    content: string;
    conditions: string[];
    priority: number;
    startIndex: number;
    endIndex: number;
  }> = [];
  
  // Collect all matches first
  let match;
  while ((match = conditionalPattern.exec(processedText)) !== null) {
    const [fullMatch, openTag, content, closeTag] = match;
    if (openTag === closeTag) {
      matches.push({
        fullMatch,
        tag: openTag,
        content,
        conditions: openTag.includes('|') ? openTag.split('|').map(c => c.trim()) : openTag.split(',').map(c => c.trim()),
        priority: openTag.includes('|') ? openTag.split('|').length : openTag.split(',').length,
        startIndex: match.index!,
        endIndex: match.index! + fullMatch.length
      });
    }
  }
  
  // Sort by position first, then by priority within overlapping regions
  matches.sort((a, b) => a.startIndex - b.startIndex);
  
  // Group matches into overlapping clusters and process each cluster by priority
  const processedMatches = new Set<string>();
  const matchesToKeep = new Set<string>();
  
  // Build clusters of overlapping matches
  const clusters: Array<typeof matches> = [];
  const matchesToCluster = [...matches];
  
  while (matchesToCluster.length > 0) {
    const seed = matchesToCluster.shift()!;
    const cluster = [seed];
    
    // Find all matches that overlap with any match in the current cluster
    let foundNewOverlaps = true;
    while (foundNewOverlaps) {
      foundNewOverlaps = false;
      for (let i = matchesToCluster.length - 1; i >= 0; i--) {
        const candidate = matchesToCluster[i];
        
        // Check if this candidate overlaps with any match in the current cluster
        const overlapsWithCluster = cluster.some(clusterMatch =>
          Math.abs(candidate.startIndex - clusterMatch.startIndex) <= 300 &&
          candidate.conditions.some(cond => clusterMatch.conditions.includes(cond))
        );
        
        if (overlapsWithCluster) {
          cluster.push(candidate);
          matchesToCluster.splice(i, 1);
          foundNewOverlaps = true;
        }
      }
    }
    
    clusters.push(cluster);
  }
  
  // Process each cluster independently with proper priority handling
  for (const cluster of clusters) {
    // Sort cluster by priority (highest first)
    const sortedCluster = cluster.sort((a, b) => b.priority - a.priority);
    const usedConditionsInCluster = new Set<string>();
    
    for (const matchInfo of sortedCluster) {
      // Check if this match's conditions conflict with already-selected matches in this cluster
      const hasConflict = matchInfo.conditions.some(cond => usedConditionsInCluster.has(cond));
      
      if (!hasConflict) {
        // Check if conditions are met
        let conditionsMet = false;
        
        if (matchInfo.tag.includes('|')) {
          conditionsMet = matchInfo.conditions.some((condition: string) => {
            const checker = conditionCheckers[condition as keyof typeof conditionCheckers];
            return checker ? checker() : false;
          });
        } else {
          conditionsMet = matchInfo.conditions.every((condition: string) => {
            const checker = conditionCheckers[condition as keyof typeof conditionCheckers];
            return checker ? checker() : false;
          });
        }
        
        if (conditionsMet) {
          // Mark all conditions as used to prevent lower-priority matches with same conditions
          matchInfo.conditions.forEach(cond => usedConditionsInCluster.add(cond));
          matchesToKeep.add(matchInfo.fullMatch);
        }
      }
      
      processedMatches.add(matchInfo.fullMatch);
    }
  }
  
  // Now process the text, keeping only the matches we want
  processedText = processedText.replace(conditionalPattern, (match, openTag, content, closeTag) => {
    if (openTag !== closeTag) {
      return match;
    }
    return matchesToKeep.has(match) ? content : '';
  });

  // Clean up any orphaned conditional tags that weren't properly matched
  // This handles cases where opening/closing tags are unmatched
  const orphanedTagPattern = /\[\[(?:\/?)(?:OUTSIDE_ISRAEL|ONLY_ISRAEL|ROSH_CHODESH|FAST_DAY|ASERET_YEMEI_TESHUVA|SUKKOT|PESACH|ROSH_CHODESH_SPECIAL|grain|wine|fruit)(?:,[^\\]]*)?(?:\|[^\\]]*)?\]\]/g;
  
  processedText = processedText.replace(orphanedTagPattern, (match) => {
    return ''; // Remove orphaned conditional tags only
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

// Cache for Tefilla conditions to avoid redundant API calls
let conditionsCache: {
  key: string;
  data: TefillaConditions;
  timestamp: number;
} | null = null;

const CONDITIONS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get current conditions based on location and Hebrew calendar data
 */
export async function getCurrentTefillaConditions(
  latitude?: number, 
  longitude?: number
): Promise<TefillaConditions> {
  try {
    // Create cache key from coordinates and date
    const { getLocalDateString } = await import('../lib/dateUtils');
    const today = getLocalDateString();
    const cacheKey = `${today}-${latitude}-${longitude}`;
    
    // Check if we have valid cached data
    if (conditionsCache && 
        conditionsCache.key === cacheKey && 
        Date.now() - conditionsCache.timestamp < CONDITIONS_CACHE_DURATION) {
      return conditionsCache.data;
    }
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
      const { getLocalDateString } = await import('../lib/dateUtils');
      const today = getLocalDateString();
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
        // Days 1-10 of Tishrei
        isAseretYemeiTeshuva = (
          hebrewDate.hebrewMonth === 'Tishrei' && 
          hebrewDate.hebrewDay >= 1 && 
          hebrewDate.hebrewDay <= 10
        );
        
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
    
    // Cache the result
    conditionsCache = {
      key: cacheKey,
      data: finalConditions,
      timestamp: Date.now()
    };
    
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