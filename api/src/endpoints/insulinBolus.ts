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
