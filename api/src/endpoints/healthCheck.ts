import { formatISO, startOfToday } from 'date-fns';
import { OpenAPIRoute, OpenAPIRouteSchema, Query } from '@cloudflare/itty-router-openapi';
import { parse, optional, object, number, string, array, isoDateTime, isoTimestamp } from 'valibot'; // 0.86 kB

export class HealthCheck extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['HealthCheck'],
    summary: 'Check the api health status',
    parameters: {},
    responses: {
      '200': {
        description: 'Health Status',
      },
    },
  };

  async handle(request: Request, env: any, context: any, data: Record<string, any>) {
    // Retrieve the validated parameters
    return { status: '200 - OK' };
  }
}
