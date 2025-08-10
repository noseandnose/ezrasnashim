/**
 * Formats text content to handle special markers:
 * - ** for bold text
 * - --- for line breaks
 * - ~~ for greyed out text
 * @param text - The raw text to format
 * @returns The formatted HTML string
 */
export function formatTextContent(text: string | null | undefined): string {
  if (!text) return '';
  
  let formatted = text;
  
  // Replace --- with line breaks first
  formatted = formatted.replace(/---/g, '<br /><br />');
  
  // Process the text character by character to handle ** and ~~ markers
  let result = '';
  let lastIndex = 0;
  let isInBold = false;
  let isInGrey = false;
  
  for (let i = 0; i < formatted.length - 1; i++) {
    // Check for ** (bold) markers
    if (formatted[i] === '*' && formatted[i + 1] === '*') {
      result += formatted.substring(lastIndex, i);
      
      if (!isInBold) {
        result += '<strong>';
      } else {
        result += '</strong>';
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
  }
  
  // Add any remaining text
  result += formatted.substring(lastIndex);
  
  // Convert newlines to <br> tags for proper HTML rendering
  result = result.replace(/\n/g, '<br />');
  
  // Preserve multiple spaces by replacing them with non-breaking spaces
  result = result.replace(/  +/g, (match) => {
    return match.split('').map(() => '&nbsp;').join('');
  });
  
  return result;
}

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