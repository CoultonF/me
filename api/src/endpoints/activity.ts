import { endOfToday, endOfMonth, startOfMonth, subDays, formatISO, parseISO, startOfToday } from 'date-fns';
import { OpenAPIRoute, OpenAPIRouteSchema, Path, Query } from '@cloudflare/itty-router-openapi';
import { parse, optional, object, number, string, array, isoDateTime, isoTimestamp } from 'valibot'; // 0.86 kB

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
    return validData.filter(activity => (activity?.name !== undefined ? activity.name.startsWith('Running') : false));
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
    return validData.filter(activity => (activity?.name !== undefined ? activity.name.startsWith('Runnin') : false));
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
    return validData.filter(activity => (activity?.name !== undefined ? activity.name.startsWith('Cycling') : false));
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
    return validData.filter(activity => (activity?.name !== undefined ? activity.name.startsWith('Cycling') : false));
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
        return validData;
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
    // ?endDate={activityDate}&latest=true&type={dataset_type['dataset_type']}
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

        return validData;
      } else {
        endingDate = formatISO(subDays(parseISO(endingDate), 1));
      }
    }
  }
}
