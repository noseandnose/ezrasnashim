import { describe, it, expect } from 'vitest';
import { sanitizeFormattedText, sanitizeAdminContent, sanitizeHTML } from '../sanitize';

describe('sanitizeFormattedText', () => {
  it('should allow basic formatting tags', () => {
    const input = '<strong>bold</strong> and <em>italic</em>';
    const result = sanitizeFormattedText(input);
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  it('should strip script tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    const result = sanitizeFormattedText(input);
    expect(result).not.toContain('script');
    expect(result).toContain('Hello');
  });

  it('should strip javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeFormattedText(input);
    expect(result).not.toContain('javascript:');
  });

  it('should allow https links', () => {
    const input = '<a href="https://example.com">link</a>';
    const result = sanitizeFormattedText(input);
    expect(result).toContain('href="https://example.com"');
  });

  it('should strip img tags', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = sanitizeFormattedText(input);
    expect(result).not.toContain('img');
    expect(result).not.toContain('onerror');
  });

  it('should handle empty input', () => {
    expect(sanitizeFormattedText('')).toBe('');
    expect(sanitizeFormattedText(null as any)).toBe('');
  });
});

describe('sanitizeAdminContent', () => {
  it('should allow img tags for admin content', () => {
    const input = '<img src="https://example.com/image.png" alt="test">';
    const result = sanitizeAdminContent(input);
    expect(result).toContain('img');
    expect(result).toContain('src=');
  });

  it('should still strip script tags', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeAdminContent(input);
    expect(result).not.toContain('script');
  });

  it('should allow heading tags', () => {
    const input = '<h1>Title</h1><h2>Subtitle</h2>';
    const result = sanitizeAdminContent(input);
    expect(result).toContain('<h1>Title</h1>');
    expect(result).toContain('<h2>Subtitle</h2>');
  });
});

describe('sanitizeHTML (backwards compatibility)', () => {
  it('should be an alias for sanitizeFormattedText', () => {
    const input = '<strong>test</strong><script>bad</script>';
    expect(sanitizeHTML(input)).toBe(sanitizeFormattedText(input));
  });
});
