import { describe, it, expect } from 'vitest';
import { linkifyText } from '../text-formatter';

describe('linkifyText', () => {
  it('should convert http URLs to links', () => {
    const input = 'Check out http://example.com for more';
    const result = linkifyText(input);
    expect(result).toContain('href="http://example.com"');
    expect(result).toContain('<a');
  });

  it('should convert https URLs to links', () => {
    const input = 'Visit https://secure.example.com';
    const result = linkifyText(input);
    expect(result).toContain('href="https://secure.example.com"');
  });

  it('should add https to www links', () => {
    const input = 'Go to www.example.com';
    const result = linkifyText(input);
    expect(result).toContain('href="https://www.example.com"');
  });

  it('should NOT convert javascript: URLs', () => {
    const input = 'javascript:alert(1)';
    const result = linkifyText(input);
    expect(result).not.toContain('href=');
    expect(result).not.toContain('<a');
  });

  it('should NOT convert data: URLs', () => {
    const input = 'data:text/html,<script>alert(1)</script>';
    const result = linkifyText(input);
    expect(result).not.toContain('href=');
  });

  it('should handle empty input', () => {
    expect(linkifyText('')).toBe('');
  });

  it('should escape special characters in URLs', () => {
    const input = 'https://example.com/path?a=1&b=2';
    const result = linkifyText(input);
    expect(result).toContain('&amp;');
  });
});
