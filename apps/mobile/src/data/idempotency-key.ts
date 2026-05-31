export function createIdempotencyKey(): string {
  return `alert-create-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
