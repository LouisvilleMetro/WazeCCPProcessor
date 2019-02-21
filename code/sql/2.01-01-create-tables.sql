/*************************************************************************************** 
Note that this script is always run, so everything in it must be idempotent (rerunnable)
IE, use "if not exists" liberally

Any errors will fail the script
***************************************************************************************/

CREATE TABLE IF NOT EXISTS waze.data_files
(
"id"                                SERIAL PRIMARY KEY NOT NULL,
"start_time_millis"                 BIGINT NOT NULL,
"end_time_millis"                   BIGINT NOT NULL,
"start_time"                        TIMESTAMP,
"end_time"                          TIMESTAMP,
"date_created"                      TIMESTAMP,
"date_updated"                      TIMESTAMP,
"file_name"                         TEXT NOT NULL,
"json_hash"                         VARCHAR(40) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_UNIQUE_json_hash"
ON waze.data_files USING btree
(json_hash COLLATE pg_catalog."default")
TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS waze.jams 
(
  "id"                              VARCHAR(40) PRIMARY KEY NOT NULL,
  "uuid"                            TEXT NOT NULL,
  "pub_millis"                      BIGINT NOT NULL,
  "pub_utc_date"                    TIMESTAMP,
  "start_node"                      TEXT,
  "end_node"                        TEXT,
  "road_type"                       INTEGER,
  "street"                          TEXT,
  "city"                            TEXT,
  "country"                         TEXT,
  "delay"                           INTEGER,
  "speed"                           float4,
  "speed_kmh"                       float4,
  "length"                          INTEGER,
  "turn_type"                       TEXT,
  "level"                           INTEGER,
  "blocking_alert_id"               TEXT,
  "line"                            JSONB,
  "type"                            TEXT,
  "turn_line"                       JSONB,
  "datafile_id"                     BIGINT NOT NULL REFERENCES waze.data_files (id)
);

CREATE TABLE IF NOT EXISTS waze.alerts
(
  "id"                              VARCHAR(40) PRIMARY KEY NOT NULL,
  "uuid"                            TEXT NOT NULL, 
  "pub_millis"                      BIGINT NOT NULL,
  "pub_utc_date"                    TIMESTAMP,
  "road_type"                       INTEGER,
  "location"                        JSONB,
  "street"                          TEXT,
  "city"                            TEXT,
  "country"                         TEXT,
  "magvar"                          INTEGER,
  "reliability"                     INTEGER,
  "report_description"              TEXT,
  "report_rating"                   INTEGER,
  "confidence"                      INTEGER,
  "type"                            TEXT,
  "subtype"                         TEXT,
  "report_by_municipality_user"     BOOLEAN,
  "thumbs_up"                       INTEGER,
  "jam_uuid"                        TEXT,
  "datafile_id"                     BIGINT NOT NULL REFERENCES waze.data_files (id)
);

CREATE TABLE IF NOT EXISTS waze.irregularities
(
  "id"                              VARCHAR(40) PRIMARY KEY NOT NULL,
  "uuid"                            TEXT NOT NULL,
  "detection_date_millis"           BIGINT NOT NULL,
  "detection_date"                  TEXT,
  "detection_utc_date"              TIMESTAMP,
  "update_date_millis"              BIGINT NOT NULL,
  "update_date"                     TEXT,
  "update_utc_date"                 TIMESTAMP,
  "street"                          TEXT,
  "city"                            TEXT,
  "country"                         TEXT,
  "is_highway"                      BOOLEAN,
  "speed"                           float4,
  "regular_speed"                   float4,
  "delay_seconds"                   INTEGER,
  "seconds"                         INTEGER,
  "length"                          INTEGER,
  "trend"                           INTEGER,
  "type"                            TEXT,
  "severity"                        float4,
  "jam_level"                       INTEGER,
  "drivers_count"                   INTEGER,
  "alerts_count"                    INTEGER,
  "n_thumbs_up"                     INTEGER,
  "n_comments"                      INTEGER,
  "n_images"                        INTEGER,
  "line"                            JSONB,
  "cause_type"                      TEXT,
  "start_node"                      TEXT,
  "end_node"                        TEXT,
  "datafile_id"                     BIGINT NOT NULL REFERENCES waze.data_files (id)
);

CREATE TABLE IF NOT EXISTS waze.coordinate_type
(
  "id"                              INTEGER PRIMARY KEY NOT NULL,
  "type_name"                       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS waze.coordinates 
(
  "id"                              VARCHAR(40) PRIMARY KEY NOT NULL,
  "latitude"                        float8 NOT NULL,
  "longitude"                       float8 NOT NULL,
  "order"                           INTEGER NOT NULL,
  "jam_id"                          VARCHAR(40) REFERENCES waze.jams (id),
  "irregularity_id"                 VARCHAR(40) REFERENCES waze.irregularities (id),
  "alert_id"                        VARCHAR(40) REFERENCES waze.alerts (id),
  "coordinate_type_id"              INTEGER REFERENCES waze.coordinate_type (id)
);

CREATE TABLE IF NOT EXISTS waze.roads 
(
  "id"                              SERIAL PRIMARY KEY NOT NULL,
  "value"                           INTEGER NOT NULL,
  "name"                            VARCHAR(100) NOT NULL
);

DO $$
BEGIN
    IF NOT EXISTS ( 
        SELECT *                      -- SELECT list can stay empty for this
        FROM   pg_catalog.pg_constraint
        WHERE  conname = 'roads_unique_combo') THEN
            ALTER TABLE waze.roads
                ADD CONSTRAINT roads_unique_combo UNIQUE(value, name);
    END IF; 
END
$$
;

CREATE TABLE IF NOT EXISTS waze.alert_types 
(
  "id"                              SERIAL PRIMARY KEY NOT NULL,
  "type"                            TEXT NOT NULL,
  "subtype"                         TEXT
);

DO $$
BEGIN
    IF NOT EXISTS ( 
        SELECT *                      -- SELECT list can stay empty for this
        FROM   pg_catalog.pg_constraint
        WHERE  conname = 'alert_types_unique_combo') THEN
            ALTER TABLE waze.alert_types
                ADD CONSTRAINT alert_types_unique_combo UNIQUE("type", "subtype");
    END IF; 
END
$$
;

-- In version 2.0, performance indexes were NOT created other than IDX_UNIQUE_json_hash
