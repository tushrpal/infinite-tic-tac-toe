import { validateDisplayName } from './validation';

describe('validateDisplayName', () => {
  it('should accept valid display names', () => {
    const result = validateDisplayName('Cool Player');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Cool Player');
  });

  it('should trim whitespace', () => {
    const result = validateDisplayName('  Player Name  ');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Player Name');
  });

  it('should accept Unicode characters', () => {
    const result = validateDisplayName('José García 🎮');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('José García 🎮');
  });

  it('should reject empty string', () => {
    const result = validateDisplayName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Display name cannot be empty');
  });

  it('should reject whitespace-only string', () => {
    const result = validateDisplayName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Display name cannot be empty');
  });

  it('should reject names over 30 characters', () => {
    const result = validateDisplayName('a'.repeat(31));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Display name must be 30 characters or less');
  });

  it('should reject control characters', () => {
    const result = validateDisplayName('Player\x00Name');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Display name contains invalid characters');
  });
});
