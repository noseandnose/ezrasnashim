// Hebrew text normalization and transliteration utilities

/**
 * Remove Hebrew vowel points (niqqud) and normalize final forms
 */
export function normalizeHebrew(text: string): string {
  if (!text) return '';
  
  // Remove nikkud (Hebrew vowel points) - Unicode range U+0591 to U+05C7
  let normalized = text.replace(/[\u0591-\u05C7]/g, '');
  
  // Normalize final forms to regular forms
  const finalForms: Record<string, string> = {
    'ך': 'כ',
    'ם': 'מ',
    'ן': 'נ',
    'ף': 'פ',
    'ץ': 'צ'
  };
  
  normalized = normalized.split('').map(char => finalForms[char] || char).join('');
  
  return normalized.trim().toLowerCase();
}

/**
 * Transliterate Hebrew characters to English phonetic equivalents
 * This allows English queries to match Hebrew content
 * Uses vowel-aware mapping for better matches with common English spellings
 */
export function transliterateHebrew(text: string): string {
  if (!text) return '';
  
  // First normalize Hebrew to remove niqqud and final forms
  const normalized = normalizeHebrew(text);
  const chars = normalized.split('');
  
  const result: string[] = [];
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    
    // Transliteration with vowel awareness
    switch (char) {
      case 'א':
        // Alef often silent or 'a' depending on context
        result.push(i === 0 ? 'a' : 'a');
        break;
      case 'ב':
        result.push('b');
        break;
      case 'ג':
        result.push('g');
        break;
      case 'ד':
        result.push('d');
        break;
      case 'ה':
        // Heh at end is often silent or 'a', otherwise 'h'
        result.push(i === chars.length - 1 ? 'a' : 'h');
        break;
      case 'ו':
        // Vav can be 'v', 'o', or 'u' - use 'o' for better matching
        result.push('o');
        break;
      case 'ז':
        result.push('z');
        break;
      case 'ח':
        result.push('ch');
        break;
      case 'ט':
        result.push('t');
        break;
      case 'י':
        // Yud can be 'y' or 'i' - use 'i' for better matching
        result.push(i === chars.length - 1 ? 'i' : 'i');
        break;
      case 'כ':
      case 'ך':
        result.push('k');
        break;
      case 'ל':
        result.push('l');
        break;
      case 'מ':
      case 'ם':
        result.push('m');
        break;
      case 'נ':
      case 'ן':
        result.push('n');
        break;
      case 'ס':
        result.push('s');
        break;
      case 'ע':
        // Ayin is often 'a' or silent
        result.push('a');
        break;
      case 'פ':
      case 'ף':
        result.push('p');
        break;
      case 'צ':
      case 'ץ':
        result.push('tz');
        break;
      case 'ק':
        result.push('k');
        break;
      case 'ר':
        result.push('r');
        break;
      case 'ש':
        result.push('sh');
        break;
      case 'ת':
        result.push('t');
        break;
      default:
        // Keep non-Hebrew characters as-is
        result.push(char);
    }
  }
  
  return result.join('').toLowerCase().trim();
}

/**
 * Check if text contains Hebrew characters
 */
export function containsHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

/**
 * Get the appropriate font class based on whether text contains Hebrew
 * Returns 'koren-siddur-hebrew' for Hebrew text, 'koren-siddur-english' for English
 */
export function getHebrewFontClass(text: string | null | undefined, defaultClass: string = 'koren-siddur-english'): string {
  if (!text) return defaultClass;
  return containsHebrew(text) ? 'koren-siddur-hebrew' : defaultClass;
}

/**
 * Common search synonyms for cross-language matching
 * Maps English terms to Hebrew equivalents and common variations
 */
export const searchSynonyms: Record<string, string[]> = {
  // Prayers
  'tehillim': ['תהילים', 'psalms', 'psalm'],
  'mincha': ['מנחה', 'afternoon'],
  'maariv': ['מעריב', 'evening', 'night'],
  'shacharit': ['שחרית', 'morning'],
  'nishmas': ['נשמת', 'nishmat'],
  'brochas': ['ברכות', 'blessings', 'brocha', 'bracha'],
  
  // Torah
  'halacha': ['הלכה', 'law', 'jewish law', 'halachah', 'halakha'],
  'chizuk': ['חיזוק', 'inspiration', 'strength'],
  'emuna': ['אמונה', 'faith', 'emunah'],
  'torah': ['תורה', 'study', 'learning'],
  'avot': ['אבות', 'fathers', 'pirkei avot', 'ethics'],
  
  // Special terms
  'shabbat': ['שבת', 'sabbath', 'shabbos', 'shabbas'],
  'kotel': ['כותל', 'wall', 'western wall'],
  'tzedaka': ['צדקה', 'charity', 'tzedakah'],
  'refuah': ['רפואה', 'healing', 'health'],
  'parnasa': ['פרנסה', 'livelihood', 'parnassa'],
  
  // Life
  'recipe': ['מתכון', 'cooking', 'food'],
  'marriage': ['נישואין', 'נישואים', 'relationship', 'spouse'],
  'family': ['משפחה', 'children', 'kids'],
  
  // Tools
  'compass': ['מצפן', 'direction', 'mizrach', 'מזרח', 'jerusalem'],
  'calendar': ['לוח', 'date', 'hebrew date']
};

/**
 * Expand a search term with its synonyms and transliterations
 * Returns an array of equivalent search terms
 */
export function expandSearchTerm(term: string): string[] {
  const normalizedTerm = term.toLowerCase().trim();
  const results = [normalizedTerm];
  
  // Add transliteration if Hebrew
  if (containsHebrew(normalizedTerm)) {
    const transliterated = transliterateHebrew(normalizedTerm);
    if (transliterated && transliterated !== normalizedTerm) {
      results.push(transliterated);
    }
  }
  
  // Add synonyms from map
  for (const [key, values] of Object.entries(searchSynonyms)) {
    if (key === normalizedTerm || values.some(v => v === normalizedTerm)) {
      results.push(key, ...values);
    }
  }
  
  // Add transliterations of any Hebrew synonyms found
  results.forEach(result => {
    if (containsHebrew(result)) {
      const trans = transliterateHebrew(result);
      if (trans && !results.includes(trans)) {
        results.push(trans);
      }
    }
  });
  
  // Return unique results
  return Array.from(new Set(results));
}
