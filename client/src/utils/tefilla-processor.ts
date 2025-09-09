// Tefilla text processor for conditional content based on location, time, and Jewish calendar

// Hebrew date helper functions
function parseHebrewDate(hebrewDate: any): { month: string; day: number } | null {
  if (!hebrewDate) return null;
  
  try {
    // The hebrewDate object from API has hebrewMonth and hebrewDay properties
    const month = hebrewDate.hebrewMonth || '';
    const day = hebrewDate.hebrewDay || 0;
    
    return { month, day };
  } catch {
    return null;
  }
}

// Check if current Hebrew date falls within a range that may span years
function isInHebrewDateRange(
  hebrewDate: any,
  startMonth: string,
  startDay: number,
  endMonth: string,
  endDay: number
): boolean {
  const current = parseHebrewDate(hebrewDate);
  if (!current) return false;
  
  const { month: currentMonth, day: currentDay } = current;
  
  // Define month order in Hebrew calendar
  const monthOrder = [
    'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar',
    'Nissan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul'
  ];
  
  // Handle Adar I/II - treat both as "Adar"
  const normalizeMonth = (month: string) => {
    if (month.includes('Adar')) return 'Adar';
    return month;
  };
  
  const currentMonthIndex = monthOrder.indexOf(normalizeMonth(currentMonth));
  const startMonthIndex = monthOrder.indexOf(startMonth);
  const endMonthIndex = monthOrder.indexOf(endMonth);
  
  if (currentMonthIndex === -1 || startMonthIndex === -1 || endMonthIndex === -1) {
    return false;
  }
  
  // Check if range spans across Hebrew year (e.g., Tishrei to Nissan)
  if (startMonthIndex > endMonthIndex) {
    // Range spans Hebrew year boundary
    if (currentMonthIndex >= startMonthIndex) {
      // We're in the first part (from start month to end of year)
      return currentMonthIndex > startMonthIndex || 
             (currentMonthIndex === startMonthIndex && currentDay >= startDay);
    } else if (currentMonthIndex <= endMonthIndex) {
      // We're in the second part (from start of year to end month)
      return currentMonthIndex < endMonthIndex || 
             (currentMonthIndex === endMonthIndex && currentDay <= endDay);
    }
    return false;
  } else {
    // Range within same Hebrew year
    if (currentMonthIndex < startMonthIndex || currentMonthIndex > endMonthIndex) {
      return false;
    }
    if (currentMonthIndex === startMonthIndex && currentDay < startDay) {
      return false;
    }
    if (currentMonthIndex === endMonthIndex && currentDay > endDay) {
      return false;
    }
    return true;
  }
}

// Check if current English date is between two specific dates
function isInEnglishDateRange(
  currentDate: Date,
  startMonth: number,  // 1-12
  startDay: number,
  endMonth: number,    // 1-12
  endDay: number
): boolean {
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  const currentDay = currentDate.getDate();
  
  // Check if range spans across calendar year (e.g., December to March)
  if (startMonth > endMonth) {
    // Range spans year boundary
    if (currentMonth >= startMonth) {
      // We're in the first part (from start month to end of year)
      return currentMonth > startMonth || 
             (currentMonth === startMonth && currentDay >= startDay);
    } else if (currentMonth <= endMonth) {
      // We're in the second part (from start of year to end month)
      return currentMonth < endMonth || 
             (currentMonth === endMonth && currentDay <= endDay);
    }
    return false;
  } else {
    // Range within same calendar year
    if (currentMonth < startMonth || currentMonth > endMonth) {
      return false;
    }
    if (currentMonth === startMonth && currentDay < startDay) {
      return false;
    }
    if (currentMonth === endMonth && currentDay > endDay) {
      return false;
    }
    return true;
  }
}

export interface TefillaConditions {
  isInIsrael: boolean;
  isRoshChodesh: boolean;
  isFastDay: boolean;
  isAseretYemeiTeshuva: boolean;
  isSukkot: boolean;
  isPesach: boolean;
  isRoshChodeshSpecial: boolean;
  isSunday: boolean;
  isMonday: boolean;
  isTuesday: boolean;
  isWednesday: boolean;
  isThursday: boolean;
  isFriday: boolean;
  isSaturday: boolean;
  // New seasonal and location-based conditions
  isMH: boolean;    // 22 Tishrei - 14 Nissan
  isMT: boolean;    // 15 Nissan - 21 Tishrei
  isTBI: boolean;   // 15 Nissan - 6 Cheshvan (Israel only)
  isTTI: boolean;   // 7 Cheshvan - 14 Nissan (Israel only)
  isTTC: boolean;   // Dec 5 - 15 Nissan (outside Israel)
  isTBC: boolean;   // 15 Nissan - Dec 4 (outside Israel)
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
 * [[ROSH_CHODESH_SPECIAL]]content[[/ROSH_CHODESH_SPECIAL]] - HIDES content during Rosh Chodesh, Pesach, or Sukkot
 * [[SUNDAY]]content[[/SUNDAY]] - Only shows on Sundays
 * [[MONDAY]]content[[/MONDAY]] - Only shows on Mondays
 * [[TUESDAY]]content[[/TUESDAY]] - Only shows on Tuesdays
 * [[WEDNESDAY]]content[[/WEDNESDAY]] - Only shows on Wednesdays
 * [[THURSDAY]]content[[/THURSDAY]] - Only shows on Thursdays
 * [[FRIDAY]]content[[/FRIDAY]] - Only shows on Fridays
 * [[SATURDAY]]content[[/SATURDAY]] - Only shows on Saturdays
 * 
 * Seasonal and location-based conditions:
 * [[MH]]content[[/MH]] - Shows from 22 Tishrei until 14 Nissan
 * [[MT]]content[[/MT]] - Shows from 15 Nissan until 21 Tishrei  
 * [[TBI]]content[[/TBI]] - Shows from 15 Nissan until 6 Cheshvan (Israel only)
 * [[TTI]]content[[/TTI]] - Shows from 7 Cheshvan until 14 Nissan (Israel only)
 * [[TTC]]content[[/TTC]] - Shows from December 5th until 15 Nissan (outside Israel only)
 * [[TBC]]content[[/TBC]] - Shows from 15 Nissan until December 4th (outside Israel only)
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
    SUNDAY: () => conditions.isSunday,
    MONDAY: () => conditions.isMonday,
    TUESDAY: () => conditions.isTuesday,
    WEDNESDAY: () => conditions.isWednesday,
    THURSDAY: () => conditions.isThursday,
    FRIDAY: () => conditions.isFriday,
    SATURDAY: () => conditions.isSaturday,
    // New seasonal and location-based conditions
    MH: () => conditions.isMH,
    MT: () => conditions.isMT,
    TBI: () => conditions.isTBI,
    TTI: () => conditions.isTTI,
    TTC: () => conditions.isTTC,
    TBC: () => conditions.isTBC,
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

  // Additional cleanup: Remove any remaining unprocessed conditional blocks
  // This handles cases where the main processor missed some blocks
  if (!conditions.isAseretYemeiTeshuva) {
    // Remove any remaining ASERET_YEMEI_TESHUVA blocks that weren't processed
    processedText = processedText.replace(/\[\[ASERET_YEMEI_TESHUVA\]\]([\s\S]*?)\[\[\/ASERET_YEMEI_TESHUVA\]\]/g, '');
    // Also remove any loose ASERET_YEMEI_TESHUVA content
    processedText = processedText.replace(/הַמֶּֽלֶךְְְ הַמִּשְְְׁפָּט/g, '');
  }
  
  // Clean up any orphaned conditional tags that weren't properly matched
  const orphanedTagPattern = /\[\[(?:\/?)(?:OUTSIDE_ISRAEL|ONLY_ISRAEL|ROSH_CHODESH|FAST_DAY|ASERET_YEMEI_TESHUVA|SUKKOT|PESACH|ROSH_CHODESH_SPECIAL|grain|wine|fruit)(?:,[^\\]]*)?(?:\|[^\\]]*)?\]\]/g;
  
  processedText = processedText.replace(orphanedTagPattern, () => {
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
    
    // Check individual days of the week
    const dayOfWeek = new Date().getDay();
    const isSunday = dayOfWeek === 0;
    const isMonday = dayOfWeek === 1;
    const isTuesday = dayOfWeek === 2;
    const isWednesday = dayOfWeek === 3;
    const isThursday = dayOfWeek === 4;
    const isFriday = dayOfWeek === 5;
    const isSaturday = dayOfWeek === 6;
    let hebrewDate = undefined;

    try {
      const { getLocalDateString } = await import('../lib/dateUtils');
      const today = getLocalDateString();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const hebrewResponse = await fetch(
        `${apiUrl}/api/hebrew-date/${today}`
      );
      
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
        isRoshChodeshSpecial = isRoshChodesh || isPesach || isSukkot;
        
      }
    } catch (error) {
      console.warn('Could not fetch Hebrew date data:', error);
    }

    // Calculate new seasonal conditions
    const currentDate = new Date();
    
    // MH: 22 Tishrei - 14 Nissan
    const isMH = isInHebrewDateRange(hebrewDate, 'Tishrei', 22, 'Nissan', 14);
    
    // MT: 15 Nissan - 21 Tishrei  
    const isMT = isInHebrewDateRange(hebrewDate, 'Nissan', 15, 'Tishrei', 21);
    
    // TBI: 15 Nissan - 6 Cheshvan (Israel only)
    const isTBI = isInIsrael && isInHebrewDateRange(hebrewDate, 'Nissan', 15, 'Cheshvan', 6);
    
    // TTI: 7 Cheshvan - 14 Nissan (Israel only)
    const isTTI = isInIsrael && isInHebrewDateRange(hebrewDate, 'Cheshvan', 7, 'Nissan', 14);
    
    // TTC: Dec 5 - 15 Nissan (outside Israel)
    // This uses mixed English and Hebrew dates
    let isTTC = false;
    if (!isInIsrael && hebrewDate) {
      const isAfterDec5 = isInEnglishDateRange(currentDate, 12, 5, 12, 31); // Dec 5 to end of year
      const isBeforeNissan15 = isInHebrewDateRange(hebrewDate, 'Tishrei', 1, 'Nissan', 14); // Start of Hebrew year to 14 Nissan
      const isExactlyTo15Nissan = parseHebrewDate(hebrewDate)?.month === 'Nissan' && 
                                  parseHebrewDate(hebrewDate)?.day === 15;
      isTTC = isAfterDec5 || isBeforeNissan15 || isExactlyTo15Nissan;
    }
    
    // TBC: 15 Nissan - Dec 4 (outside Israel)
    // This uses mixed Hebrew and English dates
    let isTBC = false;
    if (!isInIsrael && hebrewDate) {
      const isAfterNissan15 = isInHebrewDateRange(hebrewDate, 'Nissan', 15, 'Elul', 29); // 15 Nissan to end of Hebrew year
      const isBeforeDec4 = isInEnglishDateRange(currentDate, 1, 1, 12, 4); // Start of year to Dec 4
      isTBC = isAfterNissan15 || isBeforeDec4;
    }

    const finalConditions = {
      isInIsrael,
      isRoshChodesh,
      isFastDay,
      isAseretYemeiTeshuva,
      isSukkot,
      isPesach,
      isRoshChodeshSpecial,
      isSunday,
      isMonday,
      isTuesday,
      isWednesday,
      isThursday,
      isFriday,
      isSaturday,
      // New seasonal conditions
      isMH,
      isMT,
      isTBI,
      isTTI,
      isTTC,
      isTBC,
      hebrewDate,
      location
    };
    
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
    // Check individual days of the week for fallback too
    const dayOfWeek = new Date().getDay();
    const isSunday = dayOfWeek === 0;
    const isMonday = dayOfWeek === 1;
    const isTuesday = dayOfWeek === 2;
    const isWednesday = dayOfWeek === 3;
    const isThursday = dayOfWeek === 4;
    const isFriday = dayOfWeek === 5;
    const isSaturday = dayOfWeek === 6;
    
    return {
      isInIsrael: false,
      isRoshChodesh: false,
      isFastDay: false,
      isAseretYemeiTeshuva: false,
      isSukkot: false,
      isPesach: false,
      isRoshChodeshSpecial: false,
      isSunday,
      isMonday,
      isTuesday,
      isWednesday,
      isThursday,
      isFriday,
      isSaturday,
      // Default values for new seasonal conditions
      isMH: false,
      isMT: false,
      isTTI: false,
      isTBI: false,
      isTTC: false,
      isTBC: false
    };
  }
}

