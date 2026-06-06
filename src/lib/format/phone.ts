export function extractLocalPhoneDigits(value: string): string {
  let normalized = value.trim();

  if (normalized.startsWith("+1")) {
    normalized = normalized.slice(2);
  } else if (normalized.startsWith("1") && normalized.replace(/\D/g, "").length === 11) {
    normalized = normalized.slice(1);
  }

  return normalized.replace(/\D/g, "").slice(0, 10);
}

export function formatLocalPhoneDigits(localDigits: string): string {
  if (!localDigits) {
    return "";
  }

  if (localDigits.length <= 3) {
    return `(${localDigits}`;
  }

  if (localDigits.length <= 6) {
    return `(${localDigits.slice(0, 3)}) - ${localDigits.slice(3)}`;
  }

  return `(${localDigits.slice(0, 3)}) - ${localDigits.slice(3, 6)} - ${localDigits.slice(6)}`;
}

export function formatPhoneForStorage(localDigits: string): string {
  if (!localDigits) {
    return "";
  }

  return `+1 ${formatLocalPhoneDigits(localDigits)}`;
}

export function parsePhoneToLocalDigits(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return extractLocalPhoneDigits(value);
}

export function isCompletePhoneNumber(localDigits: string): boolean {
  return localDigits.length === 10;
}
