import { OpenAPIRouter } from '@cloudflare/itty-router-openapi';
import { BloodGlucoseDays, BloodGlucoseLatest, BloodGlucoseToday } from './endpoints/bloodGlucose';
import { InsulinBolusLatest, InsulinBolusToday } from './endpoints/insulinBolus';
import {
  ActivityCycling,
  ActivityCyclingDays,
  ActivityCyclingMonth,
  ActivityRunning,
  ActivityRunningDays,
  ActivityRunningMonth,
} from 'endpoints/activity';
import { CarbohydratesLatest, CarbohydratesToday } from 'endpoints/carbohydrates';
import { HealthCheck } from 'endpoints/healthCheck';

export const router = OpenAPIRouter({
  docs_url: '/docs',
});

router.get('/', HealthCheck);
router.get('/api/blood-glucose/today', BloodGlucoseToday);
router.get('/api/blood-glucose/latest', BloodGlucoseLatest);
router.get('/api/blood-glucose/days/:days', BloodGlucoseDays);
router.get('/api/insulin-bolus/today', InsulinBolusToday);
router.get('/api/insulin-bolus/latest', InsulinBolusLatest);
router.get('/api/carbohydrates/today', CarbohydratesToday);
router.get('/api/carbohydrates/latest', CarbohydratesLatest);
router.get('/api/activity/cycling/latest', ActivityCycling);
router.get('/api/activity/cycling/month', ActivityCyclingMonth);
router.get('/api/activity/cycling/days/:days', ActivityCyclingDays);
router.get('/api/activity/running/latest', ActivityRunning);
router.get('/api/activity/running/month', ActivityRunningMonth);
router.get('/api/activity/running/days/:days', ActivityRunningDays);
router.all('*', () =>
  Response.json(
    {
      success: false,
      error: 'Route not found',
    },
    { status: 404 },
  ),
);

export default {
  fetch: router.handle,
};
