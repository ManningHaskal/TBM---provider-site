export function extractDateDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatDateOfBirth(digits: string): string {
  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function parseDateOfBirth(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return extractDateDigits(value);
}
