/**
 * Cleans Hebrew text by removing problematic Unicode characters and Hebrew vowel marks (nikud)
 * that may appear as strange circles or boxes in the Koren font
 */
function cleanHebrewText(text: string): string {
  // Remove common problematic Unicode characters that cause display issues
  return text
    // Remove Hebrew vowel marks (nikud/nikkudot) - Unicode range U+05B0 to U+05C7
    .replace(/[\u05B0-\u05C7]/g, '')
    // Remove Hebrew accent marks - Unicode range U+0591 to U+05AF
    .replace(/[\u0591-\u05AF]/g, '')
    // Remove Hebrew cantillation marks - Unicode range U+05A0 to U+05AC
    .replace(/[\u05A0-\u05AC]/g, '')
    // Remove Hebrew presentation forms and additional diacritics (but preserve Hebrew letters)
    .replace(/[\u05C8-\u05CF]/g, '')
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Remove direction marks that can cause issues
    .replace(/[\u202A-\u202E]/g, '')
    // Remove problematic punctuation that Koren font doesn't support well
    .replace(/[\u2010-\u2015]/g, '-') // Replace various dashes with simple dash
    .replace(/[\u2018-\u2019]/g, "'") // Replace smart quotes
    .replace(/[\u201C-\u201D]/g, '"') // Replace smart quotes
    // Remove combining characters that might appear as circles
    .replace(/[\u0300-\u036F]/g, '')
    // Remove modifier symbols that might appear as strange marks
    .replace(/[\u02B0-\u02FF]/g, '')
    // Keep Hebrew letters (U+05D0-U+05EA), Latin characters, numbers, and basic punctuation
    .replace(/[^\u0000-\u007F\u05D0-\u05EA\u200C\u200D\u0020-\u007E]/g, '');
}

/**
 * Formats text content to handle special markers:
 * - ** for bold text
 * - --- for line breaks
 * - ~~ for greyed out text
 * - ++ for larger text
 * - -- for smaller text
 * - [[ ]] for conditional content (processed by tefilla processor)
 * @param text - The raw text to format
 * @returns The formatted HTML string
 */
export function formatTextContent(text: string | null | undefined): string {
  if (!text) return '';
  
  // Clean Hebrew text first to remove problematic characters
  let formatted = cleanHebrewText(text);
  
  // Replace --- with line breaks first
  formatted = formatted.replace(/---/g, '<br /><br />');
  
  // Removed [[ ]] grey box processing to allow conditional content system to work
  
  // Process the text character by character to handle formatting markers
  let result = '';
  let lastIndex = 0;
  let isInBold = false;
  let isInGrey = false;
  let isInLarger = false;
  let isInSmaller = false;
  
  for (let i = 0; i < formatted.length - 1; i++) {
    // Check for ** (bold) markers
    if (formatted[i] === '*' && formatted[i + 1] === '*') {
      result += formatted.substring(lastIndex, i);
      
      if (!isInBold) {
        result += '<span style="font-size: 1.05em;">';
      } else {
        result += '</span>';
      }
      
      isInBold = !isInBold;
      i++; // Skip the second *
      lastIndex = i + 1;
    }
    // Check for ~~ (grey) markers
    else if (formatted[i] === '~' && formatted[i + 1] === '~') {
      result += formatted.substring(lastIndex, i);
      
      if (!isInGrey) {
        result += '<span style="color: #9CA3AF; opacity: 0.8;">';
      } else {
        result += '</span>';
      }
      
      isInGrey = !isInGrey;
      i++; // Skip the second ~
      lastIndex = i + 1;
    }
    // Check for ++ (larger text) markers
    else if (formatted[i] === '+' && formatted[i + 1] === '+') {
      result += formatted.substring(lastIndex, i);
      
      if (!isInLarger) {
        result += '<span style="font-size: 1.2em;">';
      } else {
        result += '</span>';
      }
      
      isInLarger = !isInLarger;
      i++; // Skip the second +
      lastIndex = i + 1;
    }
    // Check for -- (smaller text) markers - but avoid conflicts with line breaks
    else if (formatted[i] === '-' && formatted[i + 1] === '-' && 
             (i + 2 >= formatted.length || formatted[i + 2] !== '-')) {
      result += formatted.substring(lastIndex, i);
      
      if (!isInSmaller) {
        result += '<span style="font-size: 0.85em;">';
      } else {
        result += '</span>';
      }
      
      isInSmaller = !isInSmaller;
      i++; // Skip the second -
      lastIndex = i + 1;
    }
  }
  
  // Add any remaining text
  result += formatted.substring(lastIndex);
  
  // Clean up excessive whitespace and empty lines BEFORE converting to HTML
  result = result
    .replace(/\n\s*\n\s*\n/g, '\n\n')  // Reduce multiple line breaks
    .replace(/[ \t]+$/gm, '')          // Remove trailing whitespace
    .replace(/^\s+|\s+$/g, '');        // Remove leading/trailing whitespace

  // Convert newlines to <br> tags for proper HTML rendering
  result = result.replace(/\n/g, '<br />');
  
  // Clean up multiple consecutive <br> tags (more than 2)
  result = result.replace(/(<br\s*\/?>){3,}/gi, '<br /><br />');
  
  // Remove empty <br> tags at the start and end
  result = result.replace(/^(<br\s*\/?>)+/gi, '').replace(/(<br\s*\/?>)+$/gi, '');
  
  // Preserve multiple spaces by replacing them with non-breaking spaces
  result = result.replace(/  +/g, (match) => {
    return match.split('').map(() => '&nbsp;').join('');
  });
  
  return result;
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
  
  // Use the base formatter first
  let formatted = formatTextContent(text);
  
  // Replace apostrophes with spaces
  formatted = formatted.replace(/'/g, ' ');
  
  // Format footnote numbers (1-99) to be smaller
  formatted = formatted.replace(/\b(\d{1,2})\b/g, (match, num) => {
    const number = parseInt(num);
    if (number >= 1 && number <= 99) {
      return `<sup style="font-size: 0.75em">${num}</sup>`;
    }
    return match;
  });
  
  return formatted;
}