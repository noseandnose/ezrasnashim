import DOMPurify from 'isomorphic-dompurify';

/**
 * Strict sanitization for user-generated/formatted text content
 * Used by text-formatter.ts for markdown-style formatting
 * Only allows basic formatting tags - no images or complex elements
 */
export function sanitizeFormattedText(dirty: string): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'br', 'div', 'span', 'sup', 'h2', 'h3', 'a', 'ul', 'li'],
    ALLOWED_ATTR: ['style', 'class', 'href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:https?:\/\/|mailto:|tel:)/i, // Allow http/https, mailto, and tel URLs
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM: false,
    SANITIZE_DOM: true
  });
}

/**
 * Permissive sanitization for admin/trusted content
 * Allows more HTML elements like images, headings, code blocks
 * Use only for content from trusted sources (admin panel, database)
 */
export function sanitizeAdminContent(dirty: string): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code', 'sup'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'style',
      'src', 'alt', 'width', 'height'
    ],
    ALLOWED_URI_REGEXP: /^(?:https?:\/\/|data:image\/)/i, // Allow http/https and data URIs for images
  });
}

/**
 * Default sanitization - alias for sanitizeFormattedText for backwards compatibility
 */
export function sanitizeHTML(dirty: string): string {
  return sanitizeFormattedText(dirty);
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
