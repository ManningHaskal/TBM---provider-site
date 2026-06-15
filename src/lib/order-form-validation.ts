import { extractDateDigits } from "@/lib/format/date";
import { isAddressComplete, type StructuredAddress } from "@/lib/shipping/address-model";

export function isDateOfBirthComplete(value: string): boolean {
  return extractDateDigits(value).length === 8;
}

export function isNewPatientComplete(fields: {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  sex: string;
}): boolean {
  return Boolean(
    fields.firstName.trim() &&
      fields.lastName.trim() &&
      fields.email.trim() &&
      isDateOfBirthComplete(fields.dateOfBirth) &&
      fields.sex.trim(),
  );
}

export function isShippingAddressReady(address: StructuredAddress): boolean {
  return isAddressComplete(address);
}
