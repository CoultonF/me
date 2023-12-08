import { DateTime, Str } from '@cloudflare/itty-router-openapi';

export const Task = {
  name: new Str({ example: 'lorem' }),
  slug: String,
  description: new Str({ required: false }),
  completed: Boolean,
  due_date: new DateTime(),
};

export const BloodGlucoseType = {
  id: String,
  value: Number,
  units: String,
  type: String,
  time: String,
};
