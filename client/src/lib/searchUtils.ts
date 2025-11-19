import MiniSearch from 'minisearch';
import { normalizeHebrew, transliterateHebrew, containsHebrew, expandSearchTerm } from './hebrewUtils';

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

// Document type for MiniSearch indexing
interface SearchDocument {
  id: string;
  title: string;
  titleTransliterated: string;
  secondary: string;
  secondaryTransliterated: string;
  keywords: string;
  category: string;
}

/**
 * Create a MiniSearch instance with fuzzy matching and Hebrew support
 */
export function createSearchIndex(records: SearchRecord[]): MiniSearch<SearchDocument> {
  const miniSearch = new MiniSearch<SearchDocument>({
    fields: ['title', 'titleTransliterated', 'secondary', 'secondaryTransliterated', 'keywords', 'category'],
    storeFields: ['id'],
    searchOptions: {
      boost: {
        title: 5,           // Title matches get highest priority
        titleTransliterated: 4,  // Transliterated title matches
        secondary: 3,       // Secondary text matches
        secondaryTransliterated: 2, // Transliterated secondary
        keywords: 1,        // Keywords
        category: 0.5       // Category matches
      },
      fuzzy: 0.2,          // Allow ~20% character difference for typos
      prefix: true,        // Enable prefix matching
      combineWith: 'AND'   // All terms must match (can be changed to 'OR')
    }
  });
  
  // Prepare documents for indexing with error handling
  const documents: SearchDocument[] = records.map(record => {
    try {
      const titleNormalized = containsHebrew(record.title) 
        ? normalizeHebrew(record.title)
        : record.title.toLowerCase();
      
      const titleTransliterated = containsHebrew(record.title)
        ? transliterateHebrew(record.title)
        : '';
      
      const secondaryNormalized = record.secondaryText && containsHebrew(record.secondaryText)
        ? normalizeHebrew(record.secondaryText)
        : (record.secondaryText || '').toLowerCase();
      
      const secondaryTransliterated = record.secondaryText && containsHebrew(record.secondaryText)
        ? transliterateHebrew(record.secondaryText)
        : '';
      
      // Expand keywords with synonyms and transliterations - handle errors
      const expandedKeywords = record.keywords.flatMap(kw => {
        try {
          return expandSearchTerm(kw);
        } catch (err) {
          console.warn(`Failed to expand keyword: ${kw}`, err);
          return [kw]; // Return original keyword if expansion fails
        }
      });
      
      const keywordsNormalized = expandedKeywords
        .map(kw => {
          try {
            return containsHebrew(kw) ? normalizeHebrew(kw) : kw.toLowerCase();
          } catch (err) {
            console.warn(`Failed to normalize keyword: ${kw}`, err);
            return kw.toLowerCase(); // Fallback to simple lowercase
          }
        })
        .join(' ');
      
      return {
        id: record.id,
        title: titleNormalized,
        titleTransliterated,
        secondary: secondaryNormalized,
        secondaryTransliterated,
        keywords: keywordsNormalized,
        category: record.category.toLowerCase()
      };
    } catch (error) {
      console.error(`Failed to process search record: ${record.id}`, error);
      // Return minimal valid document if processing fails
      return {
        id: record.id,
        title: (record.title || '').toLowerCase(),
        titleTransliterated: '',
        secondary: (record.secondaryText || '').toLowerCase(),
        secondaryTransliterated: '',
        keywords: record.keywords.join(' ').toLowerCase(),
        category: (record.category || 'other').toLowerCase()
      };
    }
  });
  
  // Index all documents
  miniSearch.addAll(documents);
  
  return miniSearch;
}

/**
 * Search records with fuzzy matching, Hebrew support, and synonym expansion
 */
export function searchRecords(
  records: SearchRecord[], 
  query: string,
  miniSearch?: MiniSearch<SearchDocument>
): SearchRecord[] {
  if (!query || !query.trim()) {
    return [];
  }
  
  // If no MiniSearch index provided, fall back to simple search
  if (!miniSearch) {
    return simpleSearch(records, query);
  }
  
  // Normalize and expand the query
  const queryTerms = query.toLowerCase().trim().split(/\s+/);
  const expandedTerms = queryTerms.flatMap(term => expandSearchTerm(term));
  
  // Detect if query contains Hebrew
  const isHebrewQuery = containsHebrew(query);
  
  // For Hebrew queries, search Hebrew fields; for English, search both
  const searchQuery = isHebrewQuery
    ? expandedTerms.map(term => normalizeHebrew(term)).join(' ')
    : expandedTerms.join(' ');
  
  try {
    // Perform fuzzy search
    const results = miniSearch.search(searchQuery, {
      fuzzy: 0.2,
      prefix: true,
      combineWith: 'OR' // Use OR for more results with expanded synonyms
    });
    
    // Map results back to original records
    const resultIds = new Set(results.map(r => r.id));
    return records
      .filter(record => resultIds.has(record.id))
      .sort((a, b) => {
        const scoreA = results.find(r => r.id === a.id)?.score || 0;
        const scoreB = results.find(r => r.id === b.id)?.score || 0;
        return scoreB - scoreA;
      });
  } catch (error) {
    // Fallback to simple search if MiniSearch fails
    console.error('MiniSearch error:', error);
    return simpleSearch(records, query);
  }
}

/**
 * Simple fallback search without MiniSearch (for compatibility)
 */
function simpleSearch(records: SearchRecord[], query: string): SearchRecord[] {
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
  
  const scored = records.map(record => {
    const normalizedTitle = record.title.toLowerCase();
    const normalizedSecondary = (record.secondaryText || '').toLowerCase();
    const normalizedKeywords = record.keywords.map(k => k.toLowerCase());
    
    let score = 0;
    
    for (const word of queryWords) {
      if (normalizedTitle.includes(word)) score += 50;
      if (normalizedSecondary.includes(word)) score += 30;
      if (normalizedKeywords.some(k => k.includes(word))) score += 20;
    }
    
    return { record, score };
  });
  
  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ record }) => record);
}
