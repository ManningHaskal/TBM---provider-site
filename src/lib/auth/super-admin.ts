export function getSuperAdminEmail(): string | null {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const superAdminEmail = getSuperAdminEmail();
  return Boolean(superAdminEmail && email.trim().toLowerCase() === superAdminEmail);
}
