CREATE TABLE rehab_log (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, date text NOT NULL, exercise_id text NOT NULL);
CREATE UNIQUE INDEX rehab_log_date_exercise_idx ON rehab_log (date, exercise_id);
