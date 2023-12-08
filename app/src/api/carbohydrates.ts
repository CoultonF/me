import { z } from 'zod';

const CarbohydrateSchema = z.object({
  net: z.number(),
  units: z.string(),
});

const HKMetaDataSchema = z.object({
  'com.loopkit.AbsorptionTime': z.number(),
});

export const CarbohydratesSchema = z.object({
  uploadId: z.string(),
  nutrition: z.object({ carbohydrate: CarbohydrateSchema }),
  payload: z.optional(HKMetaDataSchema),
  duration: z.number().optional(),
  type: z.string(),
  time: z.string(),
});
export const getCarbohydratesToday = async () => {
  const res = await fetch('/api/carbohydrates/today', {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = z.array(CarbohydratesSchema).parse(data);
  return parsedData;
};

export const getCarbohydratesLatest = async () => {
  const res = await fetch(`${import.meta.env.API_ENDPOINT}/api/carbohydrates/latest`, {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = CarbohydratesSchema.parse(data);
  return parsedData;
};
