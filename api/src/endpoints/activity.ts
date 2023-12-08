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
    if (env.OFFLINE) {
      return new Response(
        JSON.stringify({
          distance: {},
          duration: { units: 'seconds', value: 3339.799276947975 },
          energy: { units: 'kilocalories', value: 238.36482773231253 },
          id: 'dba4cbcdadc6a940f40df72a6220c934',
          name: 'Cycling - 5.94 miles',
          origin: {
            id: '6DCE6A06-E33A-4CEE-8F1D-CEFF222DD714',
            name: 'com.apple.HealthKit',
            payload: {
              device: {
                hardwareVersion: 'Watch6,11',
                manufacturer: 'Apple Inc.',
                model: 'Watch',
                name: 'Apple Watch',
                softwareVersion: '9.6.3',
              },
              sourceRevision: {
                operatingSystemVersion: '9.6.3',
                productType: 'Watch6,11',
                source: {
                  bundleIdentifier: 'com.apple.health.15BB3925-B09E-4EBB-9D2C-1FE9294EBF35',
                  name: 'Coulton\u2019s Apple\u00a0Watch',
                },
                version: '9.6.3',
              },
            },
            type: 'service',
          },
          payload: {
            HKAverageMETs: '4.88864 kcal/hr\u00b7kg',
            HKElevationAscended: '2232 cm',
            HKIndoorWorkout: 0,
            HKTimeZone: 'America/Edmonton',
            HKWeatherHumidity: '8600 %',
            HKWeatherTemperature: '38.804 degF',
          },
          time: '2023-09-30T16:57:54.101Z',
          type: 'physicalActivity',
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
    if (env?.OFFLINE) {
      return new Response(
        JSON.stringify({
          distance: { units: 'miles', value: 6.49839226947045 },
          duration: { units: 'seconds', value: 3695.7359260320663 },
          energy: { units: 'kilocalories', value: 684.2562515172903 },
          id: '6bdc2e992ce337010884f5fff8e3d040',
          name: 'Running - 6.50 miles',
          origin: {
            id: 'B9A5CF19-F666-4717-ADC8-8B70F75EC7C4',
            name: 'com.apple.HealthKit',
            payload: {
              device: {
                hardwareVersion: 'Watch6,11',
                manufacturer: 'Apple Inc.',
                model: 'Watch',
                name: 'Apple Watch',
                softwareVersion: '9.6.3',
              },
              sourceRevision: {
                operatingSystemVersion: '9.6.3',
                productType: 'Watch6,11',
                source: {
                  bundleIdentifier: 'com.apple.health.15BB3925-B09E-4EBB-9D2C-1FE9294EBF35',
                  name: 'Coulton\u2019s Apple\u00a0Watch',
                },
                version: '9.6.3',
              },
            },
            type: 'service',
          },
          payload: {
            HKAverageMETs: '10.1731 kcal/hr\u00b7kg',
            HKElevationAscended: '3504 cm',
            HKIndoorWorkout: 0,
            HKTimeZone: 'America/Edmonton',
            HKWeatherHumidity: '8700 %',
            HKWeatherTemperature: '39.182 degF',
          },
          time: '2023-09-30T15:51:51.464Z',
          type: 'physicalActivity',
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
