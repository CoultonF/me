import { BloodGlucoseType } from '../types';
import { formatISO, startOfToday, subDays } from 'date-fns';
import { OpenAPIRoute, OpenAPIRouteSchema, Query, Path } from '@cloudflare/itty-router-openapi';
import { optional, parse, object, number, string, array, isoDateTime, isoTimestamp } from 'valibot'; // 0.86 kB
const corsHeaders = {
  'Access-Control-Allow-Headers': '*', // What headers are allowed. * is wildcard. Instead of using '*', you can specify a list of specific headers that are allowed, such as: Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Authorization.
  'Access-Control-Allow-Methods': 'GET', // Allowed methods. Others could be GET, PUT, DELETE etc.
  'Access-Control-Allow-Origin': '*', // This is URLs that are allowed to access the server. * is the wildcard character meaning any URL can.
};
const HKMetaDataSchema = object({
  'com.LoopKit.GlucoseKit.HKMetadataKey.GlucoseTrend': optional(string()),
  'com.LoopKit.GlucoseKit.HKMetadataKey.GlucoseTrendRateUnit': optional(string()),
  'com.LoopKit.GlucoseKit.HKMetadataKey.GlucoseTrendRateValue': optional(number()),
});

const BloodGlucoseSchema = object({
  time: string(),
  units: string(),
  uploadId: string(),
  payload: optional(HKMetaDataSchema),
  value: number(),
});

export class BloodGlucoseLatest extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Blood Glucose'],
    summary: 'Get latest blood glucose data',
    parameters: {},
    responses: {
      '200': {
        description: 'Get the most recent blood glucose value',
        schema: BloodGlucoseType,
      },
    },
  };

  async handle(request: Request, env: any, context: any, data: Record<string, any>) {
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      });
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
    const url = `https://api.tidepool.org/data/${userid}?latest=true&type=cbg`;
    const headers = {
      'X-Tidepool-Session-Token': token,
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    const responseData = await response.json();
    const validData = parse(BloodGlucoseSchema, responseData[0]);

    return new Response(JSON.stringify(validData), {
      headers: {
        'Content-type': 'application/json',
        ...corsHeaders, //uses the spread operator to include the CORS headers.
      },
    });
  }
}
export class BloodGlucoseDays extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Blood Glucose'],
    summary: 'Get blood glucose data',
    parameters: {
      days: Path(Number, {
        description: 'Number of days to get from today',
      }),
    },
    responses: {
      '200': {
        description: 'Returns a secret value',
        schema: [BloodGlucoseType],
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
    const { days } = data.params;
    const startingDate = formatISO(subDays(new Date(), Number(days)));
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
    const url = `https://api.tidepool.org/data/${userid}?startDate=${startingDate}&type=cbg`;
    const headers = {
      'X-Tidepool-Session-Token': token,
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    const responseData = await response.json();
    const validData = parse(array(BloodGlucoseSchema), responseData);

    return new Response(JSON.stringify(validData), {
      headers: {
        'Content-type': 'application/json',
        ...corsHeaders, //uses the spread operator to include the CORS headers.
      },
    });
  }
}
export class BloodGlucoseToday extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Blood Glucose'],
    summary: 'Get blood glucose data',
    parameters: {},
    responses: {
      '200': {
        description: 'Returns a secret value',
        schema: [BloodGlucoseType],
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
    const url = `https://api.tidepool.org/data/${userid}?startDate=${startingDate}&type=cbg`;
    const headers = {
      'X-Tidepool-Session-Token': token,
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    const responseData = await response.json();
    const validData = parse(array(BloodGlucoseSchema), responseData);

    return new Response(JSON.stringify(validData), {
      headers: {
        'Content-type': 'application/json',
        ...corsHeaders, //uses the spread operator to include the CORS headers.
      },
    });
  }
}
