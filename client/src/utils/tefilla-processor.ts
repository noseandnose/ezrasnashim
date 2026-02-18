// Tefilla text processor for conditional content based on location, time, and Jewish calendar

// Hebrew date helper functions
function normalizeHebrewMonth(month: string): string {
  if (month.includes('Adar')) return 'Adar';
  if (month === "Sh'vat" || month === "Shvat") return 'Shevat';
  if (month === 'Nisan') return 'Nissan';
  if (month === 'Iyyar') return 'Iyar';
  return month;
}

function parseHebrewDate(hebrewDate: any): { month: string; day: number } | null {
  if (!hebrewDate) return null;
  
  try {
    const rawMonth = hebrewDate.hebrewMonth || '';
    const month = normalizeHebrewMonth(rawMonth);
    const day = parseInt(hebrewDate.hebrewDay) || 0;
    
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
  
  // Define month order in Hebrew calendar (Tishrei is first month, index 0)
  const monthOrder = [
    'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar',
    'Nissan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul'
  ];
  
  const normalizeMonth = normalizeHebrewMonth;
  
  const currentMonthIndex = monthOrder.indexOf(normalizeMonth(currentMonth));
  const startMonthIndex = monthOrder.indexOf(startMonth);
  const endMonthIndex = monthOrder.indexOf(endMonth);
  
  if (currentMonthIndex === -1 || startMonthIndex === -1 || endMonthIndex === -1) {
    return false;
  }
  
  // Check if range spans across Hebrew year (e.g., Cheshvan to Nissan)
  // Note: Tishrei is month 0, Elul is month 11 in our array
  // IMPORTANT: A range like "Cheshvan to Nissan" (indices 1 to 6) does NOT span the year
  // A range like "Nissan to Cheshvan" (indices 6 to 1) DOES span the year
  if (startMonthIndex > endMonthIndex) {
    // Range spans Hebrew year boundary
    // For a range like Cheshvan (1) to Nissan (6), we're IN the range if:
    // - We're >= Cheshvan (months 1-11) OR
    // - We're <= Nissan (months 0-6)
    // But for Elul (11), we need to check if we're actually after the start
    
    if (currentMonthIndex >= startMonthIndex) {
      // We're potentially in the first part (from start month through Elul)
      if (currentMonthIndex > startMonthIndex) {
        return true; // Definitely after start month
      }
      // Same month as start, check day
      return currentDay >= startDay;
    } else if (currentMonthIndex <= endMonthIndex) {
      // We're potentially in the second part (from Tishrei through end month)  
      if (currentMonthIndex < endMonthIndex) {
        return true; // Definitely before end month
      }
      // Same month as end, check day
      return currentDay <= endDay;
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
  isChanuka: boolean;
  isPurim: boolean;
  isRoshChodeshSpecial: boolean;  // True when ANY special day (Rosh Chodesh, Pesach, Sukkot, Chanuka, Purim)
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
 * [[CHANUKA]]content[[/CHANUKA]] - Only shows during Chanuka
 * [[PURIM]]content[[/PURIM]] - Only shows during Purim
 * [[SPECIAL_REMOVE]]content[[/SPECIAL_REMOVE]] - HIDES content during ANY special day (Rosh Chodesh, Pesach, Sukkot, Chanuka, Purim)
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
    CHANUKA: () => conditions.isChanuka,
    PURIM: () => conditions.isPurim,
    SPECIAL_REMOVE: () => !conditions.isRoshChodeshSpecial, // Exclusion logic: shows when NOT in any special period
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


  // SPECIAL PREPROCESSING: Handle seasonal conditions first to ensure mutual exclusivity
  // Replace the specific 4-condition seasonal pattern with only the appropriate one
  const seasonalPattern = /\[\[TTI\]\]([^\[]*?)\[\[\/TTI\]\]\[\[TBI\]\]([^\[]*?)\[\[\/TBI\]\]\[\[TTC\]\]([^\[]*?)\[\[\/TTC\]\]\[\[TBC\]\]([^\[]*?)\[\[\/TBC\]\]/g;
  processedText = processedText.replace(seasonalPattern, (_, ttiContent, tbiContent, ttcContent, tbcContent) => {
    let selectedContent = '';
    if (conditions.isInIsrael) {
      // Israel: TBI (summer) vs TTI (winter) 
      selectedContent = conditions.isTBI ? tbiContent : (conditions.isTTI ? ttiContent : '');
    } else {
      // Outside Israel: TBC (summer) vs TTC (winter)
      selectedContent = conditions.isTBC ? tbcContent : (conditions.isTTC ? ttcContent : '');
    }
    // Preserve formatting markers in selected content
    return selectedContent;
  });

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
    
    let foundNewOverlaps = true;
    while (foundNewOverlaps) {
      foundNewOverlaps = false;
      for (let i = matchesToCluster.length - 1; i >= 0; i--) {
        const candidate = matchesToCluster[i];
        
        const overlapsWithCluster = cluster.some(clusterMatch => {
          const actuallyOverlap = candidate.startIndex < clusterMatch.endIndex && 
                                  candidate.endIndex > clusterMatch.startIndex;
          return actuallyOverlap &&
            candidate.conditions.some(cond => clusterMatch.conditions.includes(cond));
        });
        
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
  // Create a new regex to avoid lastIndex issues from the exec() loop
  const replacementPattern = /\[\[([^\]]+)\]\]([\s\S]*?)\[\[\/([^\]]+)\]\]/g;
  processedText = processedText.replace(replacementPattern, (match, openTag, content, closeTag) => {
    if (openTag !== closeTag) {
      return match;
    }
    
    // When we keep content, preserve any formatting markers like ** that might be inside
    const contentToReturn = matchesToKeep.has(match) ? content : '';
    return contentToReturn;
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
  const orphanedTagPattern = /\[\[(?:\/?)(?:OUTSIDE_ISRAEL|ONLY_ISRAEL|ROSH_CHODESH|FAST_DAY|ASERET_YEMEI_TESHUVA|SUKKOT|PESACH|CHANUKA|PURIM|SPECIAL_REMOVE|MH|MT|TBI|TTI|TTC|TBC|grain|wine|fruit)(?:,[^\\]]*)?(?:\|[^\\]]*)?\]\]/g;
  
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
// Using a Map to support multiple cache entries (Maariv, daytime prayers, etc.)
const conditionsCache = new Map<string, {
  data: TefillaConditions;
  timestamp: number;
}>();

const CONDITIONS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_ENTRIES = 10; // Prevent unbounded growth

/**
 * Get current conditions based on location and Hebrew calendar data
 * @param latitude - Optional latitude coordinate
 * @param longitude - Optional longitude coordinate
 * @param checkTomorrowForRoshChodesh - If true, checks tomorrow's date for Rosh Chodesh (for Maariv which starts the next Jewish day)
 */
export async function getCurrentTefillaConditions(
  latitude?: number, 
  longitude?: number,
  checkTomorrowForRoshChodesh: boolean = false
): Promise<TefillaConditions> {
  try {
    const { getLocalDateString, getLocalTomorrowString } = await import('../lib/dateUtils');
    const today = getLocalDateString();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    // CRITICAL: Check if we're after sunset BEFORE creating cache key
    // This ensures cache is invalidated at sunset transition
    let isAfterSunset = false;
    if (latitude && longitude) {
      try {
        const zmanimResponse = await fetch(
          `${apiUrl}/api/zmanim/${today}?lat=${latitude}&lng=${longitude}`
        );
        if (zmanimResponse.ok) {
          const zmanimData = await zmanimResponse.json();
          if (zmanimData.shkia) {
            const now = new Date();
            const sunsetTime = new Date(zmanimData.shkia);
            isAfterSunset = now >= sunsetTime;
          }
        }
      } catch (error) {
        // If API fails, stay conservative - don't switch to tomorrow's holiday
        isAfterSunset = false;
      }
    }
    
    // Use halachic day state in cache key - this invalidates cache at sunset
    const halachicDayKey = (checkTomorrowForRoshChodesh || isAfterSunset) ? 'next-day' : 'current-day';
    const cacheKey = `${today}-${latitude ?? 'no-lat'}-${longitude ?? 'no-lng'}-${halachicDayKey}`;
    
    // Check if we have valid cached data
    const cached = conditionsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CONDITIONS_CACHE_DURATION) {
      return cached.data;
    }
    
    // Clean up old cache entries if we have too many
    if (conditionsCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = conditionsCache.keys().next().value;
      if (oldestKey) {
        conditionsCache.delete(oldestKey);
      }
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
        if (import.meta.env.DEV) {
          console.warn('Could not fetch location data:', error);
        }
      }
    }

    // Get Hebrew calendar information
    let isRoshChodesh = false;
    let isFastDay = false;
    let isAseretYemeiTeshuva = false;
    let isSukkot = false;
    let isPesach = false;
    let isChanuka = false;
    let isPurim = false;
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
      // For Maariv (evening prayer) OR after sunset, check tomorrow's date
      // since Jewish days begin at sunset
      const dateToCheck = (checkTomorrowForRoshChodesh || isAfterSunset) ? getLocalTomorrowString() : today;
      
      const hebrewResponse = await fetch(
        `${apiUrl}/api/hebrew-date/${dateToCheck}`
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
        
        // Check for Sukkot (but not Erev Sukkot)
        isSukkot = events.some((event: string) => {
          const eventLower = event.toLowerCase();
          // Don't match "Erev Sukkot" - only actual Sukkot days
          if (eventLower.includes('erev')) return false;
          return eventLower.includes('sukkot') ||
                 eventLower.includes('hoshanah') ||
                 eventLower.includes('simchat torah') ||
                 eventLower.includes('shemini atzeret');
        });
        
        // Check for Pesach (but not Erev Pesach)
        isPesach = events.some((event: string) => {
          const eventLower = event.toLowerCase();
          // Don't match "Erev Pesach" - only actual Pesach days
          if (eventLower.includes('erev')) return false;
          return eventLower.includes('pesach') ||
                 eventLower.includes('passover') ||
                 eventLower.includes('seder');
        });
        
        // Check for Chanuka
        isChanuka = events.some((event: string) => {
          const eventLower = event.toLowerCase();
          return eventLower.includes('chanuk') ||
                 eventLower.includes('hanuk') ||
                 eventLower.includes('chanukkah') ||
                 eventLower.includes('hanukkah');
        });
        
        // Check for Purim (but not Erev Purim)
        isPurim = events.some((event: string) => {
          const eventLower = event.toLowerCase();
          if (eventLower.includes('erev')) return false;
          return eventLower.includes('purim') ||
                 eventLower.includes('shushan purim');
        });
        
        // Check if we're in any special period (for exclusion logic)
        // SPECIAL_REMOVE hides content during ANY of these special days
        isRoshChodeshSpecial = isRoshChodesh || isPesach || isSukkot || isChanuka || isPurim;
        
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Could not fetch Hebrew date data:', error);
      }
    }

    // Calculate new seasonal conditions
    const currentDate = new Date();
    
    // MH: 22 Tishrei - 14 Nissan
    const isMH = isInHebrewDateRange(hebrewDate, 'Tishrei', 22, 'Nissan', 14);
    
    // MT: 15 Nissan - 21 Tishrei  
    const isMT = isInHebrewDateRange(hebrewDate, 'Nissan', 15, 'Tishrei', 21);
    
    // For Israel, we have two complementary seasonal periods:
    // TBI: 15 Nissan through 6 Cheshvan (spring/summer/early fall - approx April to October)
    // TTI: 7 Cheshvan through 14 Nissan (late fall/winter/early spring - approx November to March)
    
    // These should be mutually exclusive - only one should be true at a time
    let isTBI = false;
    let isTTI = false;
    
    if (isInIsrael && hebrewDate) {
      const parsed = parseHebrewDate(hebrewDate);
      if (parsed) {
        // TBI: Check if we're between 15 Nissan and 6 Cheshvan
        // This period starts at Nissan 15 and goes through summer into early fall
        isTBI = isInHebrewDateRange(hebrewDate, 'Nissan', 15, 'Cheshvan', 6);
        
        // TTI: Only true if NOT in TBI period (they're complementary)
        // TTI covers 7 Cheshvan through 14 Nissan (the winter period)
        if (isTBI) {
          isTTI = false; // Ensure mutual exclusivity - if TBI is true, TTI must be false
        } else {
          isTTI = isInHebrewDateRange(hebrewDate, 'Cheshvan', 7, 'Nissan', 14);
        }
      }
    }
    
    
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
      isChanuka,
      isPurim,
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
    conditionsCache.set(cacheKey, {
      data: finalConditions,
      timestamp: Date.now()
    });
    
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
      isChanuka: false,
      isPurim: false,
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

