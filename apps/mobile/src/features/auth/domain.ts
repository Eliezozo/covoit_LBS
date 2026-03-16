const ALLOWED_DOMAIN = "lomebs.com";
const DOMAIN_REGEXP = new RegExp(`^[^@]+@${ALLOWED_DOMAIN.replace(".", "\\.")}$`, "i");

export function isAllowedEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }
  return DOMAIN_REGEXP.test(email.toLowerCase());
}
