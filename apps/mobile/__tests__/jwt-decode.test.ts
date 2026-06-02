import { decodeJwtEmail } from '../src/presentation/screens/ProfileSettingsScreen';

describe('decodeJwtEmail', () => {
  it('returns the email from a valid JWT payload', () => {
    const payload = btoa(JSON.stringify({ sub: '123', email: 'test@example.com' }));
    const token = `header.${payload}.signature`;
    expect(decodeJwtEmail(token)).toBe('test@example.com');
  });

  it('returns null when the payload has no email', () => {
    const payload = btoa(JSON.stringify({ sub: '123' }));
    const token = `header.${payload}.signature`;
    expect(decodeJwtEmail(token)).toBeNull();
  });

  it('returns null for a malformed token', () => {
    expect(decodeJwtEmail('not-a-jwt')).toBeNull();
    expect(decodeJwtEmail('')).toBeNull();
  });

  it('handles base64url encoding with padding', () => {
    const payload = btoa(JSON.stringify({ email: 'user@domain.org' }));
    const token = `header.${payload}.signature`;
    expect(decodeJwtEmail(token)).toBe('user@domain.org');
  });
});
