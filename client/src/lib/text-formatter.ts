/**
 * Cleans Hebrew text by removing problematic Unicode characters that cause display issues
 * while preserving Hebrew text, spaces, and legitimate formatting
 */
function cleanHebrewText(text: string): string {
  return text
    // Remove characters that appear as circles or squares in Hebrew fonts
    .replace(/[\uFFFD\uFFFC]/g, '')  // Remove replacement and object replacement characters
    .replace(/[\u25CC\u25CF\u25CB]/g, '')  // Remove dotted circles, black circles, white circles
    .replace(/[\u25A0-\u25A9\u25AA-\u25AC]/g, '')  // Remove squares and rectangles
    .replace(/[\u2022\u2023\u2043\u204C\u204D]/g, '')  // Remove bullet points and dots
    .replace(/[\u200B\u200C\u200D\u200E\u200F]/g, '')  // Remove zero-width and directional characters
    .replace(/[\u2060\u2061\u2062\u2063\u2064]/g, '')  // Remove word joiner and invisible operators
    .replace(/[\uFEFF\u180E]/g, '')  // Remove zero-width no-break space and Mongolian vowel separator
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')  // Remove directional formatting characters
    .replace(/[\uE000-\uF8FF]/g, '')  // Remove private use area characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')  // Remove control characters
    // Remove Unicode blocks that cause display issues in Hebrew text
    .replace(/[\u2100-\u214F]/g, '')  // Remove letterlike symbols
    .replace(/[\u2190-\u21FF]/g, '')  // Remove arrows
    .replace(/[\u2200-\u22FF]/g, '')  // Remove mathematical operators
    .replace(/[\u2300-\u23FF]/g, '')  // Remove miscellaneous technical
    .replace(/[\u2400-\u243F]/g, '')  // Remove control pictures
    .replace(/[\u2500-\u257F]/g, '')  // Remove box drawing
    .replace(/[\u2580-\u259F]/g, '')  // Remove block elements
    .replace(/[\u25A0-\u25FF]/g, '')  // Remove geometric shapes
    .replace(/[\u2600-\u26FF]/g, '')  // Remove miscellaneous symbols
    .replace(/[\u2700-\u27BF]/g, '')  // Remove dingbats
    .replace(/[\u2800-\u28FF]/g, '')  // Remove braille patterns
    .replace(/[\uFE00-\uFE0F]/g, '')  // Remove variation selectors
    .replace(/[\uFFF0-\uFFFF]/g, '')  // Remove specials
    // Clean multiple spaces but preserve single spaces
    .replace(/\s{3,}/g, ' ')  // Only replace 3+ spaces with single space
    .trim();
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