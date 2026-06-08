import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let loaderPromise: Promise<typeof google | null> | null = null;
let optionsConfigured = false;

export function isGooglePlacesEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY);
}

export function loadGooglePlaces(): Promise<typeof google | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

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
