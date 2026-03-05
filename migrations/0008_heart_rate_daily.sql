CREATE TABLE heart_rate_daily (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, date text NOT NULL, resting_hr integer, walking_hr_avg integer, hrv real, updated_at text);
CREATE UNIQUE INDEX heart_rate_daily_date_unique ON heart_rate_daily (date);
