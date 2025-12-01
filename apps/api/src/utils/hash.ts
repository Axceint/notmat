import crypto from 'crypto';

export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function generateCacheKey(userId: string, rawText: string, options: Record<string, unknown>): string {
  const content = JSON.stringify({ userId, rawText, options });
  return hashContent(content);
}
