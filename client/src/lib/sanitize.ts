import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify to strip dangerous tags and attributes
 * 
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return '';
  
  // Configure DOMPurify to allow safe formatting tags
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'style',
      'src', 'alt', 'width', 'height'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  };
  
  return DOMPurify.sanitize(dirty, config);
}

/**
 * Helper to create props for dangerouslySetInnerHTML with sanitized content
 * 
 * @param html - The HTML content to sanitize and use
 * @returns Object with __html property for React
 */
export function createSafeHTML(html: string) {
  return { __html: sanitizeHTML(html) };
}
