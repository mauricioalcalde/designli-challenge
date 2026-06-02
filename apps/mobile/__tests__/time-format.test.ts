import { formatRelativeTime } from '../src/presentation/utils/time-format';

describe('formatRelativeTime', () => {
  it('returns "Just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Just now');
  });

  it('returns minutes for timestamps within the hour', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('5m ago');
  });

  it('returns hours for timestamps within the day', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('3h ago');
  });

  it('returns days for timestamps within the week', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('2d ago');
  });

  it('returns locale date for older timestamps', () => {
    const date = new Date('2024-01-15T10:00:00.000Z').toISOString();
    const result = formatRelativeTime(date);
    // Should be a locale date string, not a relative phrase
    expect(result).not.toMatch(/ago$/);
    expect(result).not.toBe('Just now');
  });
});
