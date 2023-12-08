import { z } from 'zod';
const BasalSchema = z.object({
  type: z.string(),
  deliveryType: z.string(),
  rate: z.number(),
});

export const InsulinBasalSchema = z.object({
  uploadId: z.string(),
  deliveryType: z.string(),
  duration: z.number(),
  rate: z.number(),
  time: z.string(),
  suppressed: z.optional(BasalSchema),
});
export const InsulinBolusSchema = z.object({
  uploadId: z.string(),
  normal: z.number(),
  subType: z.string(),
  type: z.string(),
  time: z.string(),
});
export const getInsulinBolusToday = async () => {
  const res = await fetch('/api/insulin-bolus/today', {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = z.array(InsulinBolusSchema).parse(data);
  return parsedData;
};

export const getInsulinBasalToday = async () => {
  const res = await fetch('/api/insulin-basal/today', {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = z.array(InsulinBasalSchema).parse(data);
  return parsedData;
};

export const getInsulinBolusLatest = async () => {
  const res = await fetch(`${import.meta.env.API_ENDPOINT}/api/insulin-bolus/latest`, {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = InsulinBolusSchema.parse(data);
  return parsedData;
};
