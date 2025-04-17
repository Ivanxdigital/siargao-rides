// Referral utility functions for Siargao Rides

export function generateReferralLink(userId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siargaorides.ph';
  return `${baseUrl}/register?ref=${userId}`;
}

export function parseReferralCode(code: string): string | null {
  if (!code || typeof code !== 'string' || code.length < 10) return null;
  return code;
} 