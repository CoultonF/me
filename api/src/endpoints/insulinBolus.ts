import { formatISO, startOfToday } from 'date-fns';
import { OpenAPIRoute, OpenAPIRouteSchema, Query } from '@cloudflare/itty-router-openapi';
import { parse, object, number, string, array, isoDateTime, isoTimestamp } from 'valibot'; // 0.86 kB
const corsHeaders = {
  'Access-Control-Allow-Headers': '*', // What headers are allowed. * is wildcard. Instead of using '*', you can specify a list of specific headers that are allowed, such as: Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Authorization.
  'Access-Control-Allow-Methods': 'GET', // Allowed methods. Others could be GET, PUT, DELETE etc.
  'Access-Control-Allow-Origin': '*', // This is URLs that are allowed to access the server. * is the wildcard character meaning any URL can.
};

const InsulinBolusSchema = object({
  uploadId: string(),
  normal: number(),
  subType: string(),
  type: string(),
  time: string(),
});

export class InsulinBolusLatest extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Insulin Bolus'],
    summary: 'Get bolus insulin events today',
    parameters: {},
    responses: {
      '200': {
        description: 'Get the insulin events for today',
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
          id: '7da9aa9bc49efa934978455f59b6042f',
          normal: 0.3,
          origin: {
            id: 'C269C45A-6058-4F52-8D93-DE36C00A3C9E',
            name: 'com.apple.HealthKit',
            payload: {
              device: {
                firmwareVersion: '4.10.0 1.4.0',
                hardwareVersion: '4',
                localIdentifier: '17352B9E',
                manufacturer: 'Insulet',
                model: 'Dash',
                name: 'Omnipod-Dash',
                softwareVersion: '1.0',
              },
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
            HKInsulinDeliveryReason: 2,
            HKMetadataKeySyncIdentifier: '626f6c757320302e3320323032332d31302d30315431393a32303a34315a',
            HKMetadataKeySyncVersion: 1,
            HasLoopKitOrigin: 1,
            'com.loopkit.InsulinKit.MetadataKeyAutomaticallyIssued': 1,
            'com.loopkit.InsulinKit.MetadataKeyInsulinType': 'Novolog',
            'com.loopkit.InsulinKit.MetadataKeyManuallyEntered': 0,
          },
          subType: 'normal',
          time: '2023-10-01T19:20:41.178Z',
          type: 'bolus',
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
    const url = `https://api.tidepool.org/data/${userid}?latest=true&type=bolus`;
    const headers = {
      'X-Tidepool-Session-Token': token,
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    const responseData = await response.json();
    const validData = parse(InsulinBolusSchema, responseData[0]);

    return new Response(JSON.stringify(validData), {
      headers: {
        'Content-type': 'application/json',
        ...corsHeaders, //uses the spread operator to include the CORS headers.
      },
    });
  }
}
export class InsulinBolusToday extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Insulin Bolus'],
    summary: 'Get bolus insulin events today',
    parameters: {},
    responses: {
      '200': {
        description: 'Get the insulin events for today',
      },
    },
  };

  async handle(request: Request, env: any, context: any, data: Record<string, any>) {
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      });
    }
    const startingDate = formatISO(startOfToday());
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
    const url = `https://api.tidepool.org/data/${userid}?startDate=${startingDate}&type=bolus`;
    const headers = {
      'X-Tidepool-Session-Token': token,
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    const responseData = await response.json();
    const validData = parse(array(InsulinBolusSchema), responseData);
    return new Response(JSON.stringify(validData), {
      headers: {
        'Content-type': 'application/json',
        ...corsHeaders, //uses the spread operator to include the CORS headers.
      },
    });
  }
}
