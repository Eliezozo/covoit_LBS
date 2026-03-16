const ALLOWED_DOMAIN = "lomebs.com";

export function isAllowedEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }
  return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}
