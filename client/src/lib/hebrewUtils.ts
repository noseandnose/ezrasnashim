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
 */
export function transliterateHebrew(text: string): string {
  if (!text) return '';
  
  const transliterationMap: Record<string, string> = {
    // Regular letters
    'א': 'a',
    'ב': 'b',
    'ג': 'g',
    'ד': 'd',
    'ה': 'h',
    'ו': 'v',
    'ז': 'z',
    'ח': 'ch',
    'ט': 't',
    'י': 'y',
    'כ': 'k',
    'ל': 'l',
    'מ': 'm',
    'נ': 'n',
    'ס': 's',
    'ע': '',
    'פ': 'p',
    'צ': 'tz',
    'ק': 'k',
    'ר': 'r',
    'ש': 'sh',
    'ת': 't',
    // Final forms (will be normalized first, but including for completeness)
    'ך': 'k',
    'ם': 'm',
    'ן': 'n',
    'ף': 'p',
    'ץ': 'tz'
  };
  
  // First normalize Hebrew to remove niqqud and final forms
  const normalized = normalizeHebrew(text);
  
  // Then transliterate each character
  return normalized
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('')
    .toLowerCase()
    .trim();
}

/**
 * Check if text contains Hebrew characters
 */
export function containsHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
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
  return [...new Set(results)];
}
