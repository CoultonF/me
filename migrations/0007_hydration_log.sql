CREATE TABLE hydration_log (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, timestamp text NOT NULL, amount_ml integer NOT NULL, note text);
CREATE UNIQUE INDEX hydration_log_timestamp_idx ON hydration_log (timestamp);
