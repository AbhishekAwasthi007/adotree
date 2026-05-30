// Haversine distance between two lat/lng points, returns km
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Geocode a city name or pincode → {lat, lon} using Nominatim (no API key needed)
export async function geocode(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

// Known coords for static farm locations (used when backend has no lat/lng)
export const FARM_COORDS: Record<string, { lat: number; lon: number }> = {
  'Ratnagiri, Maharashtra':   { lat: 16.9902, lon: 73.3120 },
  'Shimla, Himachal Pradesh': { lat: 31.1048, lon: 77.1734 },
  'Nagpur, Maharashtra':      { lat: 21.1458, lon: 79.0882 },
  'Junagadh, Gujarat':        { lat: 21.5222, lon: 70.4579 },
  'Srinagar, Kashmir':        { lat: 34.0837, lon: 74.7973 },
  'Coorg, Karnataka':         { lat: 12.3375, lon: 75.8069 },
};
