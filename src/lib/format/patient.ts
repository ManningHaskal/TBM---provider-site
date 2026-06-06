export function formatPatientName(patient: {
  first_name: string;
  last_name: string;
}): string {
  return `${patient.first_name} ${patient.last_name}`.trim();
}

export function parseHeightToFeetInches(height: string | null | undefined): {
  feet: string;
  inches: string;
} {
  if (!height) return { feet: "", inches: "" };

  const feetInches = height.match(/(\d+)\s*(?:ft|'|feet)\s*(\d+)/i);
  if (feetInches) {
    return { feet: feetInches[1], inches: feetInches[2] };
  }

  const onlyFeet = height.match(/(\d+)\s*(?:ft|'|feet)/i);
  if (onlyFeet) {
    return { feet: onlyFeet[1], inches: "0" };
  }

  return { feet: "", inches: "" };
}

export function formatHeightFromFeetInches(feet: string, inches: string): string | null {
  const feetValue = feet.trim();
  const inchesValue = inches.trim();

  if (!feetValue && !inchesValue) return null;
  if (!feetValue) return `${inchesValue} in`;

  const inchesPart = inchesValue ? ` ${inchesValue} in` : "";
  return `${feetValue} ft${inchesPart}`;
}

export function formatWeightWithLbs(weight: string): string | null {
  const numeric = weight.replace(/[^\d.]/g, "").trim();
  if (!numeric) return null;
  return `${numeric} lbs`;
}

export function stripWeightLbs(weight: string | null | undefined): string {
  if (!weight) return "";
  return weight.replace(/\s*lbs\s*$/i, "").trim();
}

export function sanitizeWeightInput(value: string): string {
  let result = "";
  let hasDot = false;

  for (const char of value) {
    if (char >= "0" && char <= "9") {
      result += char;
    } else if (char === "." && !hasDot) {
      result += char;
      hasDot = true;
    }
  }

  return result;
}
