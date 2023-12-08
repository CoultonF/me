import { z } from 'zod';

const MetricSchema = z.object({
  units: z.string().optional(),
  value: z.number().optional(),
});

const HKMetaDataSchema = z.object({
  HKAverageMETs: z.string(),
  HKElevationAscended: z.string(),
  HKIndoorWorkout: z.number(),
  HKTimeZone: z.string(),
  HKWeatherHumidity: z.string().optional(),
  HKWeatherTemperature: z.string().optional(),
});

const ActivitySchema = z.object({
  distance: MetricSchema.optional(),
  duration: MetricSchema.optional(),
  time: z.string(),
  energy: MetricSchema,
  name: z.string(),
  payload: z.optional(HKMetaDataSchema),
  type: z.string(),
});

export const getActivityRunningDays = async (days: number) => {
  const res = await fetch(`${import.meta.env.API_ENDPOINT}/api/activity/running/days/${days}`, {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = z.array(ActivitySchema).parse(data);
  return parsedData;
};

export const getActivityRunningMonth = async () => {
  const res = await fetch(`${import.meta.env.API_ENDPOINT}/api/activity/running/month`, {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = z.array(ActivitySchema).parse(data);
  return parsedData;
};

export const getActivityRunningLatest = async () => {
  const res = await fetch(`${import.meta.env.API_ENDPOINT}/api/activity/running/latest`, {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = ActivitySchema.parse(data);
  return parsedData;
};

export const getActivityCyclingDays = async (days: number) => {
  const res = await fetch(`${import.meta.env.API_ENDPOINT}/api/activity/cycling/days/${days}`, {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = z.array(ActivitySchema).parse(data);
  return parsedData;
};

export const getActivityCyclingMonth = async () => {
  const res = await fetch(`${import.meta.env.API_ENDPOINT}/api/activity/cycling/month`, {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = z.array(ActivitySchema).parse(data);
  return parsedData;
};

export const getActivityCyclingLatest = async () => {
  const res = await fetch(`${import.meta.env.API_ENDPOINT}/api/activity/cycling/latest`, {
    method: 'GET',
  });
  const data = await res.json();
  const parsedData = ActivitySchema.parse(data);
  return parsedData;
};
