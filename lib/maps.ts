import { getEnv } from "./env";

const mapsKey = getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", getEnv("GOOGLE_MAPS_API_KEY"));

export async function geocodeAddress(address: string) {
  if (!mapsKey) {
    // TODO: Paste Google Maps API key in .env.local when ready.
    return null;
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${mapsKey}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results?.[0] ?? null;
}

export async function getDistanceMatrix(origins: string, destinations: string) {
  if (!mapsKey) {
    return null;
  }
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
    origins
  )}&destinations=${encodeURIComponent(destinations)}&key=${mapsKey}`;
  const response = await fetch(url);
  return response.json();
}
