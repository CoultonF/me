import { zDateTime } from '@/components/zodDates.ts';
import { z } from 'zod';

const HKMetaDataSchema = z
  .object({
    'com.LoopKit.GlucoseKit.HKMetadataKey.GlucoseTrend': z.string(),
    'com.LoopKit.GlucoseKit.HKMetadataKey.GlucoseTrendRateUnit': z.string(),
    'com.LoopKit.GlucoseKit.HKMetadataKey.GlucoseTrendRateValue': z.number(),
  })
  .partial();

export const GlucoseSchema = z.object({
  time: zDateTime,
  units: z.string(),
  uploadId: z.string(),
  payload: HKMetaDataSchema.optional(),
  value: z.number(),
});

export const getGlucoseToday = async () => {
  const res = await fetch(`${import.meta.env.API_ENDPOINT}/api/blood-glucose/today`, {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = z.array(GlucoseSchema).parse(data);
  return parsedData;
};

export const getGlucoseLatest = async () => {
  const res = await fetch(`${import.meta.env.API_ENDPOINT}/api/blood-glucose/latest`, {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = GlucoseSchema.parse(data);
  return parsedData;
};
