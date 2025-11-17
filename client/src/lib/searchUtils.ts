export interface SearchRecord {
  id: string;
  category: string;
  title: string;
  secondaryText?: string;
  keywords: string[];
  route?: string;
  modalId?: string;
  action?: () => void;
}

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

export function normalizeEnglish(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .trim();
}

export function normalizeText(text: string): string {
  if (!text) return '';
  
  // Check if text contains Hebrew characters
  const hasHebrew = /[\u0590-\u05FF]/.test(text);
  
  if (hasHebrew) {
    return normalizeHebrew(text);
  }
  
  return normalizeEnglish(text);
}

export function searchRecords(records: SearchRecord[], query: string): SearchRecord[] {
  if (!query || !query.trim()) {
    return [];
  }
  
  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
  
  const scored = records.map(record => {
    const normalizedTitle = normalizeText(record.title);
    const normalizedSecondary = normalizeText(record.secondaryText || '');
    const normalizedKeywords = record.keywords.map(k => normalizeText(k));
    
    let score = 0;
    
    for (const word of queryWords) {
      // Prefix match in title (highest priority)
      if (normalizedTitle.startsWith(word)) {
        score += 100;
      }
      // Contains match in title
      else if (normalizedTitle.includes(word)) {
        score += 50;
      }
      
      // Secondary text match
      if (normalizedSecondary.includes(word)) {
        score += 30;
      }
      
      // Keyword match
      for (const keyword of normalizedKeywords) {
        if (keyword.includes(word)) {
          score += 20;
          break;
        }
      }
      
      // Category match
      if (normalizeText(record.category).includes(word)) {
        score += 10;
      }
    }
    
    return { record, score };
  });
  
  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ record }) => record);
}
