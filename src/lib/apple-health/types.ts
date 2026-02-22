import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoString = z.string().min(1);

export const dailyActivitySchema = z.object({
  date: dateString,
  steps: z.number().int().optional(),
  activeCalories: z.number().int().optional(),
  basalCalories: z.number().int().optional(),
  exerciseMinutes: z.number().int().optional(),
  standHours: z.number().int().optional(),
  walkDistanceKm: z.number().optional(),
  cycleDistanceKm: z.number().optional(),
});

export const workoutSchema = z.object({
  workoutType: z.string().min(1),
  startTime: isoString,
  endTime: isoString.optional(),
  durationSeconds: z.number().int().optional(),
  distanceKm: z.number().optional(),
  activeCalories: z.number().int().optional(),
  avgHeartRate: z.number().int().optional(),
  maxHeartRate: z.number().int().optional(),
});

export const heartRateDailySchema = z.object({
  date: dateString,
  restingHR: z.number().int().optional(),
  walkingHRAvg: z.number().int().optional(),
  hrv: z.number().optional(),
});

export const vitalSchema = z.object({
  type: z.enum(['vo2max', 'respiratory_rate', 'spo2']),
  date: dateString,
  value: z.number(),
});

export const sleepSessionSchema = z.object({
  date: dateString,
  bedtime: isoString.optional(),
  wakeTime: isoString.optional(),
  totalMinutes: z.number().int().optional(),
  remMinutes: z.number().int().optional(),
  coreMinutes: z.number().int().optional(),
  deepMinutes: z.number().int().optional(),
  awakeMinutes: z.number().int().optional(),
});

export const bodyMeasurementSchema = z.object({
  type: z.enum(['weight', 'body_fat']),
  date: dateString,
  value: z.number(),
});

export const syncPayloadSchema = z.object({
  syncTimestamp: isoString,
  dailyActivity: z.array(dailyActivitySchema).optional(),
  workouts: z.array(workoutSchema).optional(),
  heartRateDaily: z.array(heartRateDailySchema).optional(),
  vitals: z.array(vitalSchema).optional(),
  sleepSessions: z.array(sleepSessionSchema).optional(),
  bodyMeasurements: z.array(bodyMeasurementSchema).optional(),
});

export type DailyActivityPayload = z.infer<typeof dailyActivitySchema>;
export type WorkoutPayload = z.infer<typeof workoutSchema>;
export type HeartRateDailyPayload = z.infer<typeof heartRateDailySchema>;
export type VitalPayload = z.infer<typeof vitalSchema>;
export type SleepSessionPayload = z.infer<typeof sleepSessionSchema>;
export type BodyMeasurementPayload = z.infer<typeof bodyMeasurementSchema>;
export type AppleHealthSyncPayload = z.infer<typeof syncPayloadSchema>;

export interface SyncResult {
  dailyActivity?: number;
  workouts?: number;
  heartRateDaily?: number;
  vitals?: number;
  sleepSessions?: number;
  bodyMeasurements?: number;
}
