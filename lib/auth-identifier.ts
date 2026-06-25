const TECHNICAL_EMAIL_DOMAIN = "jpzone.local";

export function identifierToAuthEmail(identifier: string) {
  const cleanIdentifier = identifier.trim().toLowerCase();
  return `${cleanIdentifier}@${TECHNICAL_EMAIL_DOMAIN}`;
}
