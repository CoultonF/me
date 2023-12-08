import { formatISO, startOfToday } from 'date-fns';
import { OpenAPIRoute, OpenAPIRouteSchema, Query } from '@cloudflare/itty-router-openapi';
import { parse, optional, object, number, string, array, isoDateTime, isoTimestamp } from 'valibot'; // 0.86 kB
const corsHeaders = {
  'Access-Control-Allow-Headers': '*', // What headers are allowed. * is wildcard. Instead of using '*', you can specify a list of specific headers that are allowed, such as: Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Authorization.
  'Access-Control-Allow-Methods': 'GET', // Allowed methods. Others could be GET, PUT, DELETE etc.
  'Access-Control-Allow-Origin': '*', // This is URLs that are allowed to access the server. * is the wildcard character meaning any URL can.
};

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
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      });
    }
    if (env?.OFFLINE) {
      return new Response(
        JSON.stringify({
          id: '8a8a97cf4dba6509825614aa09ef8b87',
          nutrition: { carbohydrate: { net: 15, units: 'grams' } },
          origin: {
            id: '6D6C6D2E-27BB-4F01-8FF0-A9D4A539FF28',
            name: 'com.apple.HealthKit',
            payload: {
              sourceRevision: {
                operatingSystemVersion: '16.6.1',
                productType: 'iPhone13,1',
                source: { bundleIdentifier: 'com.L7J48HW4B6.loopkit.Loop', name: 'Loop' },
                version: '4',
              },
            },
            type: 'service',
          },
          payload: {
            HKMetadataKeySyncIdentifier: '21DD8FF8-6F87-4D57-967B-C899E5CB0101',
            HKMetadataKeySyncVersion: 1,
            'com.loopkit.AbsorptionTime': 10800,
            'com.loopkit.CarbKit.HKMetadataKey.UserCreatedDate': '2023-10-01T19:20:36.369Z',
          },
          time: '2023-10-01T19:20:36.369Z',
          type: 'food',
          uploadId: '6c9617f19a2b5a4406186219208a2951',
        }),
        {
          headers: {
            'Content-type': 'application/json',
            ...corsHeaders, //uses the spread operator to include the CORS headers.
          },
        },
      );
    }
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
    const validData = parse(CarbohydratesSchema, responseData[0]);

    return new Response(JSON.stringify(validData), {
      headers: {
        'Content-type': 'application/json',
        ...corsHeaders, //uses the spread operator to include the CORS headers.
      },
    });
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
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      });
    }
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

    return new Response(JSON.stringify(validData), {
      headers: {
        'Content-type': 'application/json',
        ...corsHeaders, //uses the spread operator to include the CORS headers.
      },
    });
  }
}
