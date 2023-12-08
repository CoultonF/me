import { endOfToday, endOfMonth, startOfMonth, subDays, formatISO, parseISO, startOfToday } from 'date-fns';
import { OpenAPIRoute, OpenAPIRouteSchema, Path, Query } from '@cloudflare/itty-router-openapi';
import { parse, optional, object, number, string, array, isoDateTime, isoTimestamp } from 'valibot'; // 0.86 kB

const corsHeaders = {
  'Access-Control-Allow-Headers': '*', // What headers are allowed. * is wildcard. Instead of using '*', you can specify a list of specific headers that are allowed, such as: Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Authorization.
  'Access-Control-Allow-Methods': 'GET', // Allowed methods. Others could be GET, PUT, DELETE etc.
  'Access-Control-Allow-Origin': '*', // This is URLs that are allowed to access the server. * is the wildcard character meaning any URL can.
};
const MetricSchema = object({
  units: string(),
  value: number(),
});

const HKMetaDataSchema = object({
  HKAverageMETs: optional(string()),
  HKElevationAscended: optional(string()),
  HKIndoorWorkout: optional(number()),
  HKTimeZone: optional(string()),
  HKWeatherHumidity: optional(string()),
  HKWeatherTemperature: optional(string()),
});

const ActivitySchema = object({
  distance: optional(MetricSchema),
  duration: optional(MetricSchema),
  energy: optional(MetricSchema),
  name: string(),
  payload: optional(HKMetaDataSchema),
  type: string(),
  time: string(),
});

export class ActivityRunningMonth extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Activity'],
    summary: 'Get the monthly running activity.',
    parameters: {},
    responses: {
      '200': {
        description: 'Monthly running activity',
      },
    },
  };

  async handle(request: Request, env: any, context: any, data: Record<string, any>) {
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      });
    }
    const endingDate = formatISO(endOfMonth(new Date()));
    const startingDate = formatISO(startOfMonth(new Date()));
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
    const url = `https://api.tidepool.org/data/${userid}?startDate=${startingDate}&endDate=${endingDate}&type=physicalActivity`;
    const headers = {
      'X-Tidepool-Session-Token': token,
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
    const responseData = await response.json();
    const validData = parse(array(ActivitySchema), responseData);
    const results = validData.filter(activity =>
      activity?.name !== undefined ? activity.name.startsWith('Running') : false,
    );
    return new Response(JSON.stringify(results), {
      headers: {
        'Content-type': 'application/json',
        ...corsHeaders, //uses the spread operator to include the CORS headers.
      },
    });
  }
}
export class ActivityRunningDays extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Activity'],
    summary: 'Get running activity.',
    parameters: {
      days: Path(Number, {
        description: 'Number of days to get from today',
      }),
    },
    responses: {
      '200': {
        description: 'Running activity',
      },
    },
  };

  async handle(request: Request, env: any, context: any, data: Record<string, any>) {
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      });
    }
    const { days } = data.params;
    const startingDate = formatISO(subDays(new Date(), Number(days)));
    const endingDate = formatISO(new Date());
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
    const url = `https://api.tidepool.org/data/${userid}?startDate=${startingDate}&endDate=${endingDate}&type=physicalActivity`;
    const headers = {
      'X-Tidepool-Session-Token': token,
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
    const responseData = await response.json();
    const validData = parse(array(ActivitySchema), responseData);
    const results = validData.filter(activity =>
      activity?.name !== undefined ? activity.name.startsWith('Runnin') : false,
    );
    return new Response(JSON.stringify(results), {
      headers: {
        'Content-type': 'application/json',
        ...corsHeaders, //uses the spread operator to include the CORS headers.
      },
    });
  }
}
export class ActivityCyclingDays extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Activity'],
    summary: 'Get cycling activity.',
    parameters: {
      days: Path(Number, {
        description: 'Number of days to get from today',
      }),
    },
    responses: {
      '200': {
        description: 'Cycling activity',
      },
    },
  };

  async handle(request: Request, env: any, context: any, data: Record<string, any>) {
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      });
    }
    const { days } = data.params;
    const startingDate = formatISO(subDays(new Date(), Number(days)));
    const endingDate = formatISO(new Date());
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
    const url = `https://api.tidepool.org/data/${userid}?startDate=${startingDate}&endDate=${endingDate}&type=physicalActivity`;
    const headers = {
      'X-Tidepool-Session-Token': token,
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
    const responseData = await response.json();
    const validData = parse(array(ActivitySchema), responseData);
    const results = validData.filter(activity =>
      activity?.name !== undefined ? activity.name.startsWith('Cycling') : false,
    );
    return new Response(JSON.stringify(results), {
      headers: {
        'Content-type': 'application/json',
        ...corsHeaders, //uses the spread operator to include the CORS headers.
      },
    });
  }
}
export class ActivityCyclingMonth extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Activity'],
    summary: 'Get the monthly cycling activity.',
    parameters: {},
    responses: {
      '200': {
        description: 'Monthly cycling activity',
      },
    },
  };

  async handle(request: Request, env: any, context: any, data: Record<string, any>) {
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      });
    }
    const endingDate = formatISO(endOfMonth(new Date()));
    const startingDate = formatISO(startOfMonth(new Date()));
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
    const url = `https://api.tidepool.org/data/${userid}?startDate=${startingDate}&endDate=${endingDate}&type=physicalActivity`;
    const headers = {
      'X-Tidepool-Session-Token': token,
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
    const responseData = await response.json();
    const validData = parse(array(ActivitySchema), responseData);
    const results = validData.filter(activity =>
      activity?.name !== undefined ? activity.name.startsWith('Cycling') : false,
    );
    return new Response(JSON.stringify(results), {
      headers: {
        'Content-type': 'application/json',
        ...corsHeaders, //uses the spread operator to include the CORS headers.
      },
    });
  }
}

export class ActivityCycling extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Activity'],
    summary: 'Get the latest cycling activity.',
    parameters: {},
    responses: {
      '200': {
        description: 'Latest cycling activity',
      },
    },
  };

  async handle(request: Request, env: any, context: any, data: Record<string, any>) {
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      });
    }
    // ?endDate={activityDate}&latest=true&type={dataset_type['dataset_type']}
    let processedCycling = false;
    let endingDate = formatISO(endOfToday());
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
    while (!processedCycling) {
      const url = `https://api.tidepool.org/data/${userid}?endDate=${endingDate}&type=physicalActivity&latest=true`;
      const headers = {
        'X-Tidepool-Session-Token': token,
      };
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });
      const responseData = await response.json();
      const validData = parse(ActivitySchema, responseData[0]);
      if (validData.name.startsWith('Cycling')) {
        processedCycling = true;
        return new Response(JSON.stringify(validData), {
          headers: {
            'Content-type': 'application/json',
            ...corsHeaders, //uses the spread operator to include the CORS headers.
          },
        });
      } else {
        endingDate = formatISO(subDays(parseISO(endingDate), 1));
      }
    }
  }
}

export class ActivityRunning extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Activity'],
    summary: 'Get the latest running activity.',
    parameters: {},
    responses: {
      '200': {
        description: 'Latest running activity',
      },
    },
  };

  async handle(request: Request, env: any, context: any, data: Record<string, any>) {
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      });
    }
    let processedRunning = false;
    let endingDate = formatISO(endOfToday());
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
    while (!processedRunning) {
      const url = `https://api.tidepool.org/data/${userid}?endDate=${endingDate}&type=physicalActivity&latest=true`;
      const headers = {
        'X-Tidepool-Session-Token': token,
      };
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });
      const responseData = await response.json();
      console.log(responseData);
      const validData = parse(ActivitySchema, responseData[0]);
      if (validData.name.startsWith('Running')) {
        processedRunning = true;

        return new Response(JSON.stringify(validData), {
          headers: {
            'Content-type': 'application/json',
            ...corsHeaders, //uses the spread operator to include the CORS headers.
          },
        });
      } else {
        endingDate = formatISO(subDays(parseISO(endingDate), 1));
      }
    }
  }
}
