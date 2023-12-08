import { formatISO, startOfToday } from 'date-fns';
import { OpenAPIRoute, OpenAPIRouteSchema, Query } from '@cloudflare/itty-router-openapi';
import { parse, optional, object, number, string, array, isoDateTime, isoTimestamp } from 'valibot'; // 0.86 kB

const BasalSchema = object({
  type: string(),
  deliveryType: string(),
  rate: number(),
});

const InsulinBasalSchema = object({
  uploadId: string(),
  deliveryType: string(),
  duration: number(),
  rate: number(),
  time: string(),
  suppressed: optional(BasalSchema),
});

export class InsulinBasalToday extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ['Insulin Basal'],
    summary: 'Get basal insulin events today',
    parameters: {},
    responses: {
      '200': {
        description: 'Get the insulin basal events for today',
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
    const url = `https://api.tidepool.org/data/${userid}?startDate=${startingDate}&type=basal`;
    const headers = {
      'X-Tidepool-Session-Token': token,
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    const responseData = await response.json();
    const validData = parse(array(InsulinBasalSchema), responseData);

    // datasets = [{"dataset_type":"physicalActivity", "dataset_alias": "otherActivity"}, {"dataset_type":"cbg","dataset_alias":"glucose"},
    //             {"dataset_type":"food", "dataset_alias":"carbohydrates"}, {"dataset_type":"bolus", "dataset_alias":"bolus"}, {"dataset_type":"basal", "dataset_alias":"basal"}]

    return validData;
  }
}
