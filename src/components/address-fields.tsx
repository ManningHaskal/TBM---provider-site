"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  formatStructuredAddress,
  formatStructuredAddressOneLine,
  parseGooglePlace,
  parseStoredAddress,
  sanitizeStateInput,
  sanitizeZipInput,
  type StructuredAddress,
} from "@/lib/shipping/address-model";
import { isGooglePlacesEnabled, loadGooglePlaces } from "@/lib/shipping/google-places";
import { FieldLabel } from "@/components/ui/field-label";

const fieldClassName =
  "rounded-xl border border-tbm-border bg-white px-3 py-2.5 text-tbm-navy outline-none ring-tbm-blue/20 focus:border-tbm-blue focus:ring-4";

type AddressFieldsProps = {
  value: StructuredAddress;
  onChange: (address: StructuredAddress) => void;
  savedAddresses?: string[];
  hiddenFieldName?: string;
  required?: boolean;
  idPrefix?: string;
};

export function AddressFields({
  value,
  onChange,
  savedAddresses = [],
  hiddenFieldName,
  required = false,
  idPrefix,
}: AddressFieldsProps) {
  const reactId = useId();
  const prefix = idPrefix ?? reactId.replace(/:/g, "");
  const line1Ref = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!isGooglePlacesEnabled()) {
      return;
    }

    let listener: google.maps.MapsEventListener | undefined;
    let autocomplete: google.maps.places.Autocomplete | undefined;
    let cancelled = false;

    loadGooglePlaces().then((googleMaps) => {
      if (cancelled || !googleMaps || !line1Ref.current) {
        return;
      }

      autocomplete = new googleMaps.maps.places.Autocomplete(line1Ref.current, {
        componentRestrictions: { country: "us" },
        fields: ["address_components"],
        types: ["address"],
      });

      listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete?.getPlace();
        if (!place) {
          return;
        }

        onChangeRef.current(parseGooglePlace(place));
      });
    });

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, []);

  function updateField<K extends keyof StructuredAddress>(field: K, nextValue: string) {
    onChange({ ...value, [field]: nextValue });
  }

  const composedAddress = formatStructuredAddress(value);

  return (
    <div className="flex flex-col gap-3">
      {required ? (
        <p className="text-xs text-tbm-text-muted">
          Fields marked with <span className="text-tbm-red">*</span> are required.
        </p>
      ) : null}
      {savedAddresses.length > 0 ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-tbm-navy">Saved addresses</span>
          <select
            value=""
            onChange={(event) => {
              if (event.target.value) {
                onChange(parseStoredAddress(event.target.value));
              }
            }}
            className={fieldClassName}
          >
            <option value="">Choose a saved address</option>
            {savedAddresses.map((savedAddress) => (
              <option key={savedAddress} value={savedAddress}>
                {formatStructuredAddressOneLine(parseStoredAddress(savedAddress))}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {isGooglePlacesEnabled() ? (
        <p className="text-xs text-tbm-text-muted">
          Start typing in Address line 1 to see suggested addresses.
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <FieldLabel required={required}>Address line 1</FieldLabel>
        <input
          ref={line1Ref}
          id={`${prefix}-line1`}
          type="text"
          autoComplete="address-line1"
          value={value.line1}
          onChange={(event) => updateField("line1", event.target.value)}
          className={fieldClassName}
          placeholder="123 Main Street"
          required={required}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <FieldLabel>Address line 2 (optional)</FieldLabel>
        <input
          id={`${prefix}-line2`}
          type="text"
          autoComplete="address-line2"
          value={value.line2}
          onChange={(event) => updateField("line2", event.target.value)}
          className={fieldClassName}
          placeholder="Suite, unit, floor"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_96px_128px]">
        <label className="flex flex-col gap-1 text-sm">
          <FieldLabel required={required}>City</FieldLabel>
          <input
            id={`${prefix}-city`}
            type="text"
            autoComplete="address-level2"
            value={value.city}
            onChange={(event) => updateField("city", event.target.value)}
            className={fieldClassName}
            placeholder="Austin"
            required={required}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <FieldLabel required={required}>State</FieldLabel>
          <input
            id={`${prefix}-state`}
            type="text"
            autoComplete="address-level1"
            value={value.state}
            onChange={(event) => updateField("state", sanitizeStateInput(event.target.value))}
            className={fieldClassName}
            placeholder="TX"
            maxLength={2}
            required={required}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <FieldLabel required={required}>ZIP code</FieldLabel>
          <input
            id={`${prefix}-zip`}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            value={value.zip}
            onChange={(event) => updateField("zip", sanitizeZipInput(event.target.value))}
            className={fieldClassName}
            placeholder="78701"
            required={required}
          />
        </label>
      </div>

      {composedAddress ? (
        <Button
          type="button"
          variant="ghost"
          className="self-start px-0"
          onClick={() =>
            onChange({
              line1: "",
              line2: "",
              city: "",
              state: "",
              zip: "",
            })
          }
        >
          Clear address
        </Button>
      ) : null}

      {hiddenFieldName ? (
        <input type="hidden" name={hiddenFieldName} value={composedAddress} />
      ) : null}
    </div>
  );
}
