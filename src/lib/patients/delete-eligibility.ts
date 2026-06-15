export const PATIENT_DELETE_COOLDOWN_DAYS = 30;

const COOLDOWN_MS = PATIENT_DELETE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export type PatientDeleteEligibility = {
  canDelete: boolean;
  orderCount: number;
  lastOrderAt: string | null;
  eligibleAt: string | null;
  daysRemaining: number | null;
};

export function getPatientDeleteEligibility(
  orderCount: number,
  lastOrderAt: string | null,
  now = Date.now(),
): PatientDeleteEligibility {
  if (orderCount === 0 || !lastOrderAt) {
    return {
      canDelete: true,
      orderCount,
      lastOrderAt,
      eligibleAt: null,
      daysRemaining: null,
    };
  }

  const lastOrderMs = new Date(lastOrderAt).getTime();
  const eligibleAtMs = lastOrderMs + COOLDOWN_MS;

  if (now >= eligibleAtMs) {
    return {
      canDelete: true,
      orderCount,
      lastOrderAt,
      eligibleAt: new Date(eligibleAtMs).toISOString(),
      daysRemaining: null,
    };
  }

  const daysRemaining = Math.ceil((eligibleAtMs - now) / (24 * 60 * 60 * 1000));

  return {
    canDelete: false,
    orderCount,
    lastOrderAt,
    eligibleAt: new Date(eligibleAtMs).toISOString(),
    daysRemaining,
  };
}

export function formatPatientDeleteEligibleDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getPatientDeleteBlockedMessage(
  eligibility: PatientDeleteEligibility,
): string {
  if (eligibility.canDelete) {
    return "";
  }

  const eligibleDate = eligibility.eligibleAt
    ? formatPatientDeleteEligibleDate(eligibility.eligibleAt)
    : "later";

  if (eligibility.daysRemaining === 1) {
    return `This patient can be deleted starting tomorrow (${eligibleDate}), 30 days after their last order.`;
  }

  return `This patient can be deleted on ${eligibleDate} (${eligibility.daysRemaining} days remaining), 30 days after their last order.`;
}
