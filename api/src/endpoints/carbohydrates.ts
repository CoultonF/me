import { formatISO, startOfToday } from 'date-fns';
import { OpenAPIRoute, OpenAPIRouteSchema, Query } from '@cloudflare/itty-router-openapi';
import { parse, optional, object, number, string, array, isoDateTime, isoTimestamp } from 'valibot'; // 0.86 kB

const CarbohydrateSchema = object({
  net: optional(number()),
  units: optional(string()),
});

const HKMetaDataSchema = object({
  'com.loopkit.AbsorptionTime': number(),
});

const CarbohydratesSchema = object({
  uploadId: string(),
  nutrition: optional(object({ carbohydrate: CarbohydrateSchema })),
  payload: optional(HKMetaDataSchema),
  type: string(),
  time: string(),
});

export class CarbohydratesLatest extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Carbohydrates'],
    summary: 'Get the carbohydrates eaten recently.',
    parameters: {},
    responses: {
      '200': {
        description: 'Recent carbohydrates data.',
      },
    },
  };

  async handle(request: Request, env: any, context: any, data: Record<string, any>) {
    // Retrieve the validated parameters
    const startingDate = formatISO(startOfToday());
    // start_date_str = starting_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    const authUrl = 'https://api.tidepool.org/auth/login';
    const authHeaders = {
      Authorization: env.BASE64_AUTH,
    };
    const auth = await fetch(authUrl, {
      method: 'POST',
      headers: authHeaders,
    });
    const token = auth.headers.get('x-tidepool-session-token') ?? '';
    const authData = await auth.json();
    const userid = authData['userid'] ?? '';
    const url = `https://api.tidepool.org/data/${userid}?latest=true&type=food`;
    const headers = {
      'X-Tidepool-Session-Token': token,
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    const responseData = await response.json();
    console.log(responseData[0].nutrition);
    const validData = parse(CarbohydratesSchema, responseData[0]);

    return validData;
  }
}

export class CarbohydratesToday extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Carbohydrates'],
    summary: 'Get the carbohydrates eaten for today.',
    parameters: {},
    responses: {
      '200': {
        description: 'Carbohydrates data for today.',
      },
    },
  };

  async handle(request: Request, env: any, context: any, data: Record<string, any>) {
    // Retrieve the validated parameters
    const startingDate = formatISO(startOfToday());
    // start_date_str = starting_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    const authUrl = 'https://api.tidepool.org/auth/login';
    const authHeaders = {
      Authorization: env.BASE64_AUTH,
    };
    const auth = await fetch(authUrl, {
      method: 'POST',
      headers: authHeaders,
    });
    const token = auth.headers.get('x-tidepool-session-token') ?? '';
    const authData = await auth.json();
    const userid = authData['userid'] ?? '';
    const url = `https://api.tidepool.org/data/${userid}?startDate=${startingDate}&type=food`;
    const headers = {
      'X-Tidepool-Session-Token': token,
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    const responseData = await response.json();
    const validData = parse(array(CarbohydratesSchema), responseData);

    return validData;
  }
}