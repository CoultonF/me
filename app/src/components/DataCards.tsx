import { Tab } from "@headlessui/react";
import { z } from "zod";
import physicalActivity from "../data/physicalActivity.json"
import glucose from "../data/glucose.json";
import food from "../data/food.json";
import bolus from "../data/bolus.json";
import { zDate, zDateTime } from "./zodDates.ts";
import colors from "tailwindcss/colors";
import {
  IconBaguette,
  IconVaccine,
  IconDroplet,
  IconRun,
} from "@tabler/icons-react";

const dateOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
} as const;

const timeOptions = {
  dayPeriod: undefined,
  hour: "numeric",
  minute: "numeric",
  second: undefined,
} as const;

const DistanceSchema = z.object({
  units: z.string(),
  value: z.number(),
});

const RunningSchema = z
  .object({
    distance: DistanceSchema,
    time: zDateTime,
  })
  .transform((v) => {
    const { distance, time, ...rest } = v;
    return {
      kilometers:
        distance.units === "miles"
          ? (distance.value * 1.609344).toFixed(2)
          : distance.value.toFixed(2),
      date: new Date(v.time).toLocaleDateString("en-US", dateOptions),
      time: new Date(v.time).toLocaleTimeString("en-US", timeOptions),
      ...rest,
    };
  });

const GlucoseSchema = z
  .object({
    time: zDateTime,
    units: z.string(),
    value: z.number(),
    payload: z
      .object({
        "com.LoopKit.GlucoseKit.HKMetadataKey.GlucoseTrend": z
          .string()
          .nullable()
          .optional(),
      })
      .nullable()
      .optional(),
  })
  .transform((v) => {
    const { time, value, payload, ...rest } = v;
    return {
      value: v.value.toFixed(1),
      date: new Date(v.time).toLocaleDateString("en-US", dateOptions),
      time: new Date(v.time).toLocaleTimeString("en-US", timeOptions),
      trend: payload?.["com.LoopKit.GlucoseKit.HKMetadataKey.GlucoseTrend"],
      ...rest,
    };
  });

const BolusSchema = z
  .object({
    normal: z.number(),
    time: zDateTime,
  })
  .transform((v) => {
    const { time, ...rest } = v;
    return {
      date: new Date(v.time).toLocaleDateString("en-US", dateOptions),
      time: new Date(v.time).toLocaleTimeString("en-US", timeOptions),
      ...rest,
    };
  });

const NutritionSchema = z.object({
  carbohydrate: z.object({
    net: z.number(),
    units: z.string(),
  }),
});

const FoodSchema = z
  .object({
    nutrition: NutritionSchema,
    time: zDateTime,
  })
  .transform((v) => {
    const { nutrition, ...rest } = v;
    return {
      carbohydrate: nutrition.carbohydrate.net,
      units: nutrition.carbohydrate.units,
      date: new Date(v.time).toLocaleDateString("en-US", dateOptions),
      time: new Date(v.time).toLocaleTimeString("en-US", timeOptions),
    };
  });

export const DataCards = () => {
  const runningStats = z.array(RunningSchema).parse(physicalActivity);
  const glucoseStats = z.array(GlucoseSchema).parse(glucose);
  const bolusStats = z.array(BolusSchema).parse(bolus);
  const foodStats = z.array(FoodSchema).parse(food);
  const stats = [
    {
      name: "Activity",
      stat: `${runningStats[0].kilometers} km`,
      date: runningStats[0].date,
      time: runningStats[0].time,
      icon: <IconRun size={50} color={colors.indigo[500]} />,
    },
    {
      name: "Blood Glucose",
      stat: `${glucoseStats[0].value} ${glucoseStats[0].units} ${glucoseStats[0]?.trend}`,
      date: glucoseStats[0].date,
      time: glucoseStats[0].time,
      trend: glucoseStats[0]?.trend,
      icon: <IconDroplet size={50} color={colors.red[500]} />,
    },
    {
      name: "Insulin Dosage",
      stat: `${bolusStats[0].normal} units`,
      date: bolusStats[0].date,
      time: bolusStats[0].time,
      icon: <IconVaccine size={50} color={colors.teal[500]} />,
    },
    {
      name: "Carbohydrates Eaten",
      stat: `${foodStats[0].carbohydrate} ${foodStats[0].units}`,
      date: foodStats[0].date,
      time: foodStats[0].time,
      icon: <IconBaguette size={50} color={colors.amber[500]} />,
    },
  ];
  return (
    <div className="container mx-auto px-4 max-w-[1000px]">
      <h3 className="text-2xl font-semibold leading-6 text-gray-900">
        Lastest Stats
      </h3>
      <dl className="my-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {stats.map((item) => (
          <div
            key={item.name}
            className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 flex justify-around"
          >
            <div className="">
              <dt className="truncate text-sm font-medium text-gray-500">
                {item.name}
              </dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {item.stat}
              </dd>
              <dd className="mt-1 text-sm  tracking-tight text-gray-400">
                {item.date} @ {item.time}
              </dd>
              <dd className="mt-1 text-sm  tracking-tight text-gray-400"></dd>
            </div>
            <div className="flex-none self-center m-4">{item?.icon}</div>
          </div>
        ))}
      </dl>
    </div>
  );
};
