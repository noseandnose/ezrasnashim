import DOMPurify from 'dompurify';

/**
 * Safely sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHTML(htmlContent: string): string {
  return DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'br', 'div', 'span', 'sup', 'h2', 'h3', 'a'],
    ALLOWED_ATTR: ['style', 'class', 'href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM: false,
    SANITIZE_DOM: true
  });
}

/**
 * Aggressively cleans Hebrew text to eliminate all display issues while preserving legitimate Hebrew content
 */
function cleanHebrewText(text: string): string {
  // First pass: Remove only problematic characters while preserving Hebrew vowels (nekudot)
  let cleaned = text
    // Replace Hebrew sof pasuq with period (better visual)
    .replace(/׃/g, '.')
    // Remove only cantillation marks (ta'amim) that cause display issues - preserve vowels
    .replace(/[\u0591-\u05AE]/g, '') // Remove ta'amim but keep vowels (05AF and above)
    .replace(/[\u05BD\u05BF\u05C0\u05C3\u05C4\u05C5\u05C6]/g, '') // Additional Hebrew punctuation
    // Remove all geometric shapes, symbols, and technical characters - but preserve specific Hebrew punctuation
    .replace(/[\u2000-\u206F]/g, (char) => {
      const code = char.charCodeAt(0);
      // Keep only normal spaces and Hebrew punctuation
      if (code === 0x2000 || code === 0x2002 || code === 0x2003 || code === 0x2009) return ' '; // Convert spaces
      if (code === 0x2013 || code === 0x2014) return '-'; // Keep dashes
      return ''; // Remove everything else in this range
    })
    .replace(/[\u2100-\u21FF]/g, '')  // Remove letterlike symbols and arrows
    .replace(/[\u2200-\u23FF]/g, '')  // Remove mathematical and technical symbols
    .replace(/[\u2400-\u24FF]/g, '')  // Remove control pictures and enclosed alphanumerics
    .replace(/[\u2500-\u25FF]/g, '')  // Remove box drawing and geometric shapes
    .replace(/[\u2600-\u27BF]/g, '')  // Remove miscellaneous symbols and dingbats
    .replace(/[\u2800-\u28FF]/g, '')  // Remove braille patterns
    .replace(/[\uE000-\uF8FF]/g, '')  // Remove private use area
    .replace(/[\uFE00-\uFE0F]/g, '')  // Remove variation selectors
    .replace(/[\uFFF0-\uFFFF]/g, '')  // Remove specials
    // Remove specific problematic characters that cause circles
    .replace(/[\uFFFD\uFFFC]/g, '')  // Remove replacement characters
    .replace(/[\u00A0]/g, ' ')       // Convert non-breaking space to regular space
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, ''); // Remove control characters but keep newline (0x0A)
  
  // Second pass: Character-by-character filtering to keep only safe characters
  let result = '';
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const code = char.charCodeAt(0);
    
    // Keep basic ASCII (0-127) including newlines
    if (code <= 127) {
      result += char;
      continue;
    }
    
    // Keep Hebrew block including letters, vowels (nekudot), and essential punctuation
    if (code >= 0x0590 && code <= 0x05FF) {
      // Keep Hebrew letters, vowels (nekudot), and essential punctuation
      if ((code >= 0x05D0 && code <= 0x05EA) || // Hebrew letters
          (code >= 0x05B0 && code <= 0x05BC) || // Hebrew vowels (nekudot) - restore these!
          (code >= 0x05C1 && code <= 0x05C2) || // Additional vowel marks
          code === 0x05BE || // Maqaf (Hebrew hyphen)
          code === 0x05C7) { // Hebrew vowel qamatz qatan
        
        // Skip specific problematic vowel combinations that display as squares
        if (code === 0x05BA || // holam haser for vav - causes squares
            code === 0x05C4 || // upper dot (mark upper dot) - can cause display issues
            code === 0x05C5) { // lower dot (mark lower dot) - can cause display issues
          continue;
        }
        
        result += char;
      }
      continue;
    }
    
    // Keep Hebrew presentation forms
    if (code >= 0xFB1D && code <= 0xFB4F) {
      result += char;
      continue;
    }
    
    // Special handling for vertical bar character
    if (code === 0x007C) { // Vertical bar |
      result += ' '; // Replace with space
      continue;
    }
    
    // Keep Latin Extended-A characters (includes ĥ and other diacritical marks)
    if (code >= 0x0100 && code <= 0x017F) {
      result += char;
      continue;
    }
    
    // Keep Latin-1 Supplement characters (accented letters like é, ñ, etc.)
    if (code >= 0x00C0 && code <= 0x00FF) {
      result += char;
      continue;
    }
    
    // Keep specific Latin extended characters that might be needed
    if ((code >= 0x00A0 && code <= 0x00BF)) {
      if (char === ' ' || code === 0x00A0) {
        result += ' '; // Convert non-breaking space to regular space
      } else {
        result += char; // Keep other characters in this range
      }
      continue;
    }
    
    // Skip all other characters (this removes circles, squares, etc.)
  }
  
  // Final cleanup - preserve line breaks and spacing
  return result
    .replace(/[ \t]{2,}/g, ' ')  // Replace multiple spaces/tabs with single space (but not newlines)
    .replace(/\n{3,}/g, '\n\n')  // Limit to max 2 consecutive newlines
    .trim();
}

/**
 * Formats text content to handle special markers:
 * - ** for bold text
 * - ## for title text (bigger and bold)
 * - --- for line breaks
 * - ~~ for greyed out text
 * - ++ for larger text
 * - -- for smaller text
 * - [[ ]] for grey box content (Hebrew/conditional content)
 * - {{ }} for grey box content (English content)
 * - Conditional content with [[ ]] tags is processed separately by tefilla processor
 * @param text - The raw text to format
 * @returns The formatted HTML string
 */
export function formatTextContent(text: string | null | undefined): string {
  if (!text) return '';
  
  // Clean Hebrew text first to remove problematic characters
  let formatted = cleanHebrewText(text);
  
  // Remove hyphenated line breaks that appear in formatted text
  // This handles cases like "be- gins" -> "begins", "Howev- er" -> "However"
  formatted = formatted.replace(/([a-zA-Z])-\s+([a-zA-Z])/g, '$1$2');
  
  // Format footnote numbers for English text BEFORE any other processing
  // Match standalone numbers or numbers after punctuation/spaces
  // This catches: ". 39 ", " 39 ", "(39)", etc.
  formatted = formatted.replace(/(\s|^|[."\]\()>])(\d{1,2})(\s|[.,;:!?\)\]]|$)/g, (_match, before, num, after) => {
    return `${before}<sup style="font-size: 0.65em; font-weight: normal;">${num}</sup>${after}`;
  });
  
  // Convert newlines to HTML breaks FIRST before any other processing
  formatted = formatted.replace(/\n/g, '<br />');
  
  // Replace --- with line breaks (double breaks for spacing)
  formatted = formatted.replace(/---/g, '<br /><br />');
  
  // Process [[ ]] for grey boxes (only simple text, not conditional content)
  // This handles [[text]] that doesn't contain conditional keywords
  formatted = formatted.replace(/\[\[([^\]]+?)\]\]/g, (match, content) => {
    // Check if this is conditional content (contains known keywords)
    const conditionalKeywords = [
      'OUTSIDE_ISRAEL', 'ONLY_ISRAEL', 'ROSH_CHODESH', 'FAST_DAY', 
      'ASERET_YEMEI_TESHUVA', 'SUKKOT', 'PESACH', 'ROSH_CHODESH_SPECIAL',
      // Seasonal and location conditions
      'MH', 'MT', 'TTI', 'TBI', 'TTC', 'TBC',
      // Day conditions
      'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
      // Food selection conditions
      'grain', 'wine', 'fruit'
    ];
    
    // Check if this is conditional content - must contain actual conditional keywords
    // Only consider comma/pipe as conditional if combined with keywords
    const hasConditionalKeyword = conditionalKeywords.some(keyword => content.includes(keyword));
    // Also check for day-specific conditions with pipes
    const hasDayCondition = /\b(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\b/.test(content);
    const isConditional = hasConditionalKeyword || hasDayCondition;
    
    if (isConditional) {
      // This is conditional content, leave it for tefilla processor
      return match;
    }
    
    // This is regular grey box content - don't set font-family, let it inherit properly
    return `<div style="background-color: #f3f4f6; padding: 12px; border-radius: 8px; margin: 8px 0; border-left: 4px solid #d1d5db;">${content}</div>`;
  });

  // Process {{ }} for grey boxes (English content)
  // This handles {{text}} for regular grey box content
  formatted = formatted.replace(/\{\{([^}]+?)\}\}/g, (_match, content) => {
    // This is regular grey box content for English text - add class to identify English content
    return `<div class="grey-box-english" style="background-color: #f3f4f6; padding: 12px; border-radius: 8px; margin: 8px 0; border-left: 4px solid #d1d5db;">${content}</div>`;
  });
  
  // First, handle {{grey}} blocks before character-by-character processing
  formatted = formatted.replace(/\{\{grey\}\}([\s\S]*?)\{\{\/grey\}\}/g, 
    '<div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border-l-4 border-gray-300 dark:border-gray-600 my-2 text-gray-700 dark:text-gray-300">$1</div>');

  // Use regex-based processing for more robust formatting handling
  // This approach better handles nested formatting from conditional content
  
  // Process ## (title) markers - bigger and bold
  formatted = formatted.replace(/##([^#]*?)##/g, '<span style="font-size: 1.5em; font-weight: bold; display: block; margin: 0.5em 0; font-family: inherit;">$1</span>');
  
  // Process ** (bold) markers - handle nested content robustly
  // Use [\s\S] instead of . to properly match all characters including Hebrew with nikud
  formatted = formatted.replace(/\*\*([\s\S]*?)\*\*/g, '<strong style="font-family: inherit;">$1</strong>');
  
  // Process ~~ (grey) markers
  formatted = formatted.replace(/~~([\s\S]*?)~~/g, '<span style="color: #9CA3AF; opacity: 0.8; font-family: inherit;">$1</span>');
  
  // Process ++ (bold text) markers 
  formatted = formatted.replace(/\+\+([\s\S]*?)\+\+/g, '<strong style="font-family: inherit;">$1</strong>');
  
  // Process -- (smaller text) markers - but avoid conflicts with line breaks
  // Use negative lookahead to avoid matching --- (line breaks)
  formatted = formatted.replace(/--(?!-)([\s\S]+?)--(?!-)/g, '<span style="font-size: 0.85em; font-family: inherit;">$1</span>');
  
  let result = formatted;
  
  // Clean up excessive whitespace and empty lines BEFORE converting to HTML
  result = result
    .replace(/\n\s*\n\s*\n/g, '\n\n')  // Reduce multiple line breaks
    .replace(/[ \t]+$/gm, '')          // Remove trailing whitespace
    .replace(/^\s+|\s+$/g, '');        // Remove leading/trailing whitespace

  // Footnote processing already done earlier in the function

  // Convert newlines to <br> tags for proper HTML rendering with preserved spacing
  result = result.replace(/\n/g, '<br />');
  
  // Clean up multiple consecutive <br> tags but preserve double line breaks
  result = result.replace(/(<br\s*\/?>){4,}/gi, '<br /><br /><br />'); // Max 3 line breaks
  
  // Remove empty <br> tags at the start and end
  result = result.replace(/^(<br\s*\/?>)+/gi, '').replace(/(<br\s*\/?>)+$/gi, '');
  
  // Preserve multiple spaces by replacing them with non-breaking spaces
  result = result.replace(/  +/g, (match) => {
    return match.split('').map(() => '&nbsp;').join('');
  });
  
  return sanitizeHTML(result);
}

// Removed problematic English text wrapping function

/**
 * Formats text content with additional processing for apostrophes and footnotes
 * Used specifically for Halacha content
 * @param text - The raw text to format
 * @returns The formatted HTML string
 */
export function formatHalachaContent(text: string | null | undefined): string {
  if (!text) return '';
  
  // Use the base formatter first (this already handles footnotes)
  let formatted = formatTextContent(text);
  
  // Replace apostrophes with spaces
  formatted = formatted.replace(/'/g, ' ');
  
  // Don't format footnotes again - formatTextContent already handled them
  // This prevents duplicate processing and inconsistent sizing
  
  return sanitizeHTML(formatted);
}