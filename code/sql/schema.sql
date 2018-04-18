CREATE SCHEMA IF NOT EXISTS waze;

-- setup permissions for the lambda role, if it has been created
DO
$$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'lambda_role') THEN
    GRANT ALL ON SCHEMA waze TO lambda_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA waze GRANT ALL ON TABLES TO lambda_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA waze GRANT SELECT, USAGE ON SEQUENCES TO lambda_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA waze	GRANT EXECUTE ON FUNCTIONS TO lambda_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA waze	GRANT USAGE ON TYPES TO lambda_role;
  END IF;
END;
$$;

CREATE TABLE waze.data_files
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

CREATE UNIQUE INDEX "IDX_UNIQUE_json_hash"
ON waze.data_files USING btree
(json_hash COLLATE pg_catalog."default")
TABLESPACE pg_default;

CREATE TABLE waze.jams 
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

CREATE TABLE waze.alerts
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

CREATE TABLE waze.irregularities
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
  "datafile_id"                     BIGINT NOT NULL REFERENCES waze.data_files (id)
);

CREATE TABLE waze.coordinate_type
(
  "id"                              INTEGER PRIMARY KEY NOT NULL,
  "type_name"                       TEXT NOT NULL
);

CREATE TABLE waze.coordinates 
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

CREATE TABLE waze.roads 
(
  "id"                              SERIAL PRIMARY KEY NOT NULL,
  "value"                           INTEGER NOT NULL,
  "name"                            VARCHAR[100] NOT NULL
);

CREATE TABLE waze.alert_types 
(
  "id"                              SERIAL PRIMARY KEY NOT NULL,
  "type"                            TEXT NOT NULL,
  "subtype"                         TEXT
);

-- load coordinate type lookup table
INSERT INTO waze.coordinate_type (id, type_name) VALUES (1, 'Line');
INSERT INTO waze.coordinate_type (id, type_name) VALUES (2, 'Turn Line');
INSERT INTO waze.coordinate_type (id, type_name) VALUES (3, 'Location');
