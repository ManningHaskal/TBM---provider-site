export function formatPatientName(patient: {
  first_name: string;
  last_name: string;
}): string {
  return `${patient.first_name} ${patient.last_name}`.trim();
}

export function formatAllergiesDisplay(allergies: string | null | undefined): string {
  return allergies?.trim() || "None";
}
