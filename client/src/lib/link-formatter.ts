/**
 * Utility functions for formatting thank you messages with clickable links
 */
import { sanitizeHTML } from './text-formatter';

/**
 * Convert markdown-style links to HTML links
 * Example: "Thank you [Rabbi Smith](https://example.com) for the inspiration!"
 * Becomes: "Thank you <a href="https://example.com" target="_blank" rel="noopener noreferrer">Rabbi Smith</a> for the inspiration!"
 */
export function formatThankYouMessage(message: string): string {
  if (!message) return '';
  
  // Convert markdown-style links [text](url) to HTML links
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  const result = message.replace(markdownLinkRegex, (_, linkText, url) => {
    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="text-blush font-medium underline hover:text-blush/80 transition-colors">${linkText}</a>`;
  });
  
  return sanitizeHTML(result);
}

/**
 * Alternative function for simple URL detection and linkification
 * Automatically converts URLs to clickable links
 * Example: "Visit https://example.com for more info"
 * Becomes: "Visit <a href="https://example.com">https://example.com</a> for more info"
 */
export function autoLinkUrls(message: string): string {
  if (!message) return '';
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  return message.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blush font-medium underline hover:text-blush/80 transition-colors">${url}</a>`;
  });
}

/**
 * Combined formatter that handles both markdown links and auto-detects URLs
 */
export function formatThankYouMessageFull(message: string): string {
  if (!message) return '';
  
  // First convert markdown-style links
  let formatted = formatThankYouMessage(message);
  
  // Then auto-link any remaining URLs (that weren't part of markdown links)
  // Only apply auto-link to text outside of existing HTML tags
  const htmlTagRegex = /<[^>]*>/g;
  const parts = formatted.split(htmlTagRegex);
  const tags = formatted.match(htmlTagRegex) || [];
  
  let result = '';
  for (let i = 0; i < parts.length; i++) {
    result += autoLinkUrls(parts[i]);
    if (tags[i]) {
      result += tags[i];
    }
  }
  
  // Sanitize the final HTML output to prevent XSS
  return sanitizeHTML(result);
}