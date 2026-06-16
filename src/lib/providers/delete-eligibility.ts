import {
  formatPatientDeleteEligibleDate,
  getPatientDeleteEligibility,
  type PatientDeleteEligibility,
} from "@/lib/patients/delete-eligibility";

export type AccountDeleteEligibility = PatientDeleteEligibility;

export function getAccountDeleteEligibility(
  orderCount: number,
  lastOrderAt: string | null,
  now = Date.now(),
): AccountDeleteEligibility {
  return getPatientDeleteEligibility(orderCount, lastOrderAt, now);
}

export const formatAccountDeleteEligibleDate = formatPatientDeleteEligibleDate;

export function getAccountDeleteBlockedMessage(
  eligibility: AccountDeleteEligibility,
): string {
  if (eligibility.canDelete) {
    return "";
  }

  const eligibleDate = eligibility.eligibleAt
    ? formatAccountDeleteEligibleDate(eligibility.eligibleAt)
    : "later";

  if (eligibility.daysRemaining === 1) {
    return `This account can be deleted starting tomorrow (${eligibleDate}), 30 days after its last order.`;
  }

  return `This account can be deleted on ${eligibleDate} (${eligibility.daysRemaining} days remaining), 30 days after its last order.`;
}
