/**
 * Formats text content to handle bold markers (**) and line breaks (---)
 * @param text - The raw text to format
 * @returns The formatted HTML string
 */
export function formatTextContent(text: string | null | undefined): string {
  if (!text) return '';
  
  let formatted = text;
  
  // Replace --- with line breaks first
  formatted = formatted.replace(/---/g, '<br /><br />');
  
  // Replace **text** with bold text
  // Process each ** pair, handling the content between them
  let result = '';
  let lastIndex = 0;
  let isInBold = false;
  
  for (let i = 0; i < formatted.length - 1; i++) {
    if (formatted[i] === '*' && formatted[i + 1] === '*') {
      // Found a ** marker
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
  }
  
  // Add any remaining text
  result += formatted.substring(lastIndex);
  
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