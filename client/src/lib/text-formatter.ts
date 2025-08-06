/**
 * Formats text content to handle bold markers (**) and line breaks (---)
 * @param text - The raw text to format
 * @returns The formatted HTML string
 */
export function formatTextContent(text: string | null | undefined): string {
  if (!text) return '';
  
  let formatted = text;
  
  // Replace --- with line breaks
  formatted = formatted.replace(/---/g, '<br />');
  
  // Replace **text** with bold text
  // This regex matches text between ** markers
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  return formatted;
}

/**
 * Formats text content with additional processing for apostrophes and footnotes
 * Used specifically for Halacha content
 * @param text - The raw text to format
 * @returns The formatted HTML string
 */
export function formatHalachaContent(text: string | null | undefined): string {
  if (!text) return '';
  
  // Apply basic formatting first
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