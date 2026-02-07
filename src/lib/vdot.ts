import type { VDOTPrediction } from './types/races';

/** Parse "H:MM:SS" or "MM:SS" to total seconds */
export function parseTime(str: string): number {
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  return 0;
}

/** Format seconds as "H:MM:SS" or "M:SS" */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format seconds-per-km as "MM:SS" pace */
export function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm <= 0) return '--';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

const DISTANCES: Record<string, number> = {
  '5K': 5,
  '10K': 10,
  'Half Marathon': 21.0975,
  'Marathon': 42.195,
};

/** Convert distance label to km */
export function distanceKm(label: string): number {
  return DISTANCES[label] ?? 0;
}

/**
 * Calculate VDOT using Jack Daniels' formula.
 * Based on the relationship between VO2 at a given velocity and
 * the percent of VO2max that can be sustained for a given duration.
 *
 * @param distanceMeters - race distance in meters
 * @param timeSeconds - race time in seconds
 * @returns VDOT value
 */
export function calculateVDOT(distanceMeters: number, timeSeconds: number): number {
  const timeMinutes = timeSeconds / 60;
  const velocity = distanceMeters / timeMinutes; // meters per minute

  // VO2 cost of running at this velocity
  const vo2 = -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;

  // Percent of VO2max sustained for this duration
  const pctMax =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes);

  return vo2 / pctMax;
}

/**
 * Predict race time for a given VDOT and distance.
 * Uses binary search to find the time that produces the given VDOT.
 *
 * @param vdot - VDOT value
 * @param distanceMeters - target distance in meters
 * @returns predicted time in seconds
 */
export function predictTime(vdot: number, distanceMeters: number): number {
  // Binary search for the time that yields this VDOT
  let lo = distanceMeters / 10; // faster than 10 m/s is impossible
  let hi = distanceMeters; // slower than 1 m/s
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const v = calculateVDOT(distanceMeters, mid);
    if (v > vdot) {
      lo = mid; // running too fast → need more time
    } else {
      hi = mid; // running too slow → need less time
    }
  }
  return Math.round((lo + hi) / 2);
}

const STANDARD_TARGETS = ['5K', '10K', 'Half Marathon', 'Marathon'];

/**
 * Predict times for standard distances from a race result.
 */
export function predictFromRace(
  chipTime: string,
  distance: string,
  targets: string[] = STANDARD_TARGETS,
): VDOTPrediction[] {
  const km = distanceKm(distance);
  if (!km) return [];

  const timeSeconds = parseTime(chipTime);
  if (timeSeconds <= 0) return [];

  const vdot = calculateVDOT(km * 1000, timeSeconds);

  return targets
    .filter((t) => t !== distance) // skip the source distance
    .map((t) => {
      const tkm = distanceKm(t);
      if (!tkm) return null;
      const predicted = predictTime(vdot, tkm * 1000);
      const paceSecPerKm = predicted / tkm;
      return {
        distance: t,
        predictedTime: formatTime(predicted),
        predictedPace: formatPace(paceSecPerKm),
      };
    })
    .filter((p): p is VDOTPrediction => p !== null);
}
