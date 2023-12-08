import { z } from 'zod';

export const HealthCheckSchema = z.object({
  status: z.string(),
});

export const getHealthCheck = async () => {
  const res = await fetch('/', {
    method: 'GET',
  });
  const parsedData = HealthCheckSchema.parse(res);
  return parsedData;
};
