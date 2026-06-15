import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let loaderPromise: Promise<typeof google | null> | null = null;
let optionsConfigured = false;

const PLACEHOLDER_API_KEYS = new Set(["your-api-key", "placeholder", "changeme"]);

function getPlacesApiKey(): string | undefined {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey || PLACEHOLDER_API_KEYS.has(apiKey.toLowerCase())) {
    return undefined;
  }
  return apiKey;
}

export function isGooglePlacesEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_PLACES === "true" &&
    Boolean(getPlacesApiKey())
  );
}

export function loadGooglePlaces(): Promise<typeof google | null> {
  if (!isGooglePlacesEnabled()) {
    return Promise.resolve(null);
  }

  const apiKey = getPlacesApiKey();
  if (!apiKey) {
    return Promise.resolve(null);
  }

  if (!loaderPromise) {
    loaderPromise = (async () => {
      if (!optionsConfigured) {
        setOptions({ key: apiKey });
        optionsConfigured = true;
      }

      await importLibrary("places");
      return window.google;
    })();
  }

  return loaderPromise;
}
