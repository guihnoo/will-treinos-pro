// Haversine formula — distance between two GPS coordinates in meters

export type Coords = { lat: number; lng: number };
export type CourtLocation = { lat: number; lng: number; radiusM: number; label: string };

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(a: Coords, b: Coords): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aa = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

export type GeoCheckResult =
  | { status: "at_court"; distanceM: number }
  | { status: "outside"; distanceM: number }
  | { status: "permission_denied" }
  | { status: "unavailable" }
  | { status: "no_court_configured" };

export async function checkIfAtCourt(court: CourtLocation | null): Promise<GeoCheckResult> {
  if (!court) return { status: "no_court_configured" };

  if (!navigator.geolocation) return { status: "unavailable" };

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = haversineDistance(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          { lat: court.lat, lng: court.lng }
        );
        resolve(dist <= court.radiusM
          ? { status: "at_court", distanceM: Math.round(dist) }
          : { status: "outside", distanceM: Math.round(dist) }
        );
      },
      (err) => {
        resolve(err.code === GeolocationPositionError.PERMISSION_DENIED
          ? { status: "permission_denied" }
          : { status: "unavailable" }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

export async function getCurrentCoords(): Promise<Coords | null> {
  if (!navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}
