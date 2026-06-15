export type StructuredAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
};

export const emptyStructuredAddress = (): StructuredAddress => ({
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
});

export function isAddressComplete(address: StructuredAddress): boolean {
  return Boolean(
    address.line1.trim() &&
      address.city.trim() &&
      address.state.trim().length === 2 &&
      address.zip.trim().length >= 5,
  );
}

export function formatStructuredAddress(address: StructuredAddress): string {
  const line1 = address.line1.trim();
  const line2 = address.line2.trim();
  const city = address.city.trim();
  const state = address.state.trim().toUpperCase();
  const zip = address.zip.trim();

  if (!line1 && !city && !state && !zip) {
    return "";
  }

  const cityLine =
    city && state && zip
      ? `${city}, ${state} ${zip}`
      : [city, state, zip].filter(Boolean).join(", ").replace(/,\s*,/g, ",");

  return [line1, line2, cityLine].filter(Boolean).join("\n");
}

export function formatStructuredAddressOneLine(address: StructuredAddress): string {
  return formatStructuredAddress(address).replace(/\n+/g, ", ");
}

function parseCityStateZipLine(line: string): Pick<StructuredAddress, "city" | "state" | "zip"> | null {
  const cityStateZip = line.match(/^(.+),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (cityStateZip) {
    return {
      city: cityStateZip[1].trim(),
      state: cityStateZip[2].toUpperCase(),
      zip: cityStateZip[3],
    };
  }

  const cityStateCommaZip = line.match(/^(.+),\s*([A-Za-z]{2}),\s*(\d{5}(?:-\d{4})?)$/);
  if (cityStateCommaZip) {
    return {
      city: cityStateCommaZip[1].trim(),
      state: cityStateCommaZip[2].toUpperCase(),
      zip: cityStateCommaZip[3],
    };
  }

  return null;
}

export function parseStoredAddress(value: string | null | undefined): StructuredAddress {
  const empty = emptyStructuredAddress();
  if (!value?.trim()) {
    return empty;
  }

  const normalized = value.trim();
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);

  if (lines.length >= 2) {
    const cityStateZip = parseCityStateZipLine(lines[lines.length - 1]);

    if (cityStateZip) {
      return {
        line1: lines[0],
        line2: lines.length > 2 ? lines.slice(1, -1).join(", ") : "",
        ...cityStateZip,
      };
    }
  }

  const commaParts = normalized.split(",").map((part) => part.trim()).filter(Boolean);

  if (commaParts.length >= 3) {
    const lastPart = commaParts[commaParts.length - 1];
    const stateZip = lastPart.match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);

    if (stateZip) {
      return {
        line1: commaParts[0],
        line2: commaParts.length > 3 ? commaParts.slice(1, -2).join(", ") : "",
        city: commaParts[commaParts.length - 2],
        state: stateZip[1].toUpperCase(),
        zip: stateZip[2],
      };
    }
  }

  return { ...empty, line1: normalized };
}

export function sanitizeStateInput(value: string): string {
  return value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
}

export function sanitizeZipInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function parseGooglePlace(
  place: google.maps.places.PlaceResult,
): StructuredAddress {
  const components = place.address_components ?? [];

  function getComponent(type: string, name: "long_name" | "short_name" = "long_name") {
    return components.find((component) => component.types.includes(type))?.[name] ?? "";
  }

  const streetNumber = getComponent("street_number");
  const route = getComponent("route");
  const line1 = [streetNumber, route].filter(Boolean).join(" ");

  return {
    line1,
    line2: getComponent("subpremise"),
    city:
      getComponent("locality") ||
      getComponent("postal_town") ||
      getComponent("sublocality") ||
      getComponent("administrative_area_level_3"),
    state: getComponent("administrative_area_level_1", "short_name").toUpperCase(),
    zip: getComponent("postal_code"),
  };
}
