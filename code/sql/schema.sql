CREATE SCHEMA waze;

-- create the lambda role
CREATE ROLE lambda_role LOGIN PASSWORD 'ENTER THE SAME PASSWORD YOU USED IN TERRAFORM HERE';

-- setup permissions for the lambda role
GRANT ALL ON SCHEMA waze TO lambda_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze GRANT ALL ON TABLES TO lambda_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze GRANT SELECT, USAGE ON SEQUENCES TO lambda_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze	GRANT EXECUTE ON FUNCTIONS TO lambda_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze	GRANT USAGE ON TYPES TO lambda_role;


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
  "cause_type"                      TEXT,
  "start_node"                      TEXT,
  "end_node"                        TEXT,
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
  "name"                            VARCHAR(100) NOT NULL
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

-- load roads
INSERT INTO waze.roads (value, name) VALUES (1, 'Streets');
INSERT INTO waze.roads (value, name) VALUES (2, 'Primary Street');
INSERT INTO waze.roads (value, name) VALUES (3, 'Freeways');
INSERT INTO waze.roads (value, name) VALUES (4, 'Ramps');
INSERT INTO waze.roads (value, name) VALUES (5, 'Trails');
INSERT INTO waze.roads (value, name) VALUES (6, 'Primary');
INSERT INTO waze.roads (value, name) VALUES (7, 'Secondary');
INSERT INTO waze.roads (value, name) VALUES (8, '4X4 Trails');
INSERT INTO waze.roads (value, name) VALUES (9, 'Walkway');
INSERT INTO waze.roads (value, name) VALUES (10, 'Pedestrian');
INSERT INTO waze.roads (value, name) VALUES (11, 'Exit');
INSERT INTO waze.roads (value, name) VALUES (12, '?');
INSERT INTO waze.roads (value, name) VALUES (13, '?');
INSERT INTO waze.roads (value, name) VALUES (14, '4X4 Trails');
INSERT INTO waze.roads (value, name) VALUES (15, 'Ferry crossing');
INSERT INTO waze.roads (value, name) VALUES (16, 'Stairway');
INSERT INTO waze.roads (value, name) VALUES (17, 'Private road');
INSERT INTO waze.roads (value, name) VALUES (18, 'Railroads');
INSERT INTO waze.roads (value, name) VALUES (19, 'Runway/Taxiway');
INSERT INTO waze.roads (value, name) VALUES (20, 'Parking lot road');
INSERT INTO waze.roads (value, name) VALUES (21, 'Service road');

-- load alert_types
INSERT INTO waze.alert_types (type, subtype) VALUES ('ACCIDENT', 'ACCIDENT_MINOR');
INSERT INTO waze.alert_types (type, subtype) VALUES ('ACCIDENT', 'ACCIDENT_MAJOR');
INSERT INTO waze.alert_types (type, subtype) VALUES ('ACCIDENT', 'NO_SUBTYPE');
INSERT INTO waze.alert_types (type, subtype) VALUES ('JAM', 'JAM_MODERATE_TRAFFIC');
INSERT INTO waze.alert_types (type, subtype) VALUES ('JAM', 'JAM_HEAVY_TRAFFIC');
INSERT INTO waze.alert_types (type, subtype) VALUES ('JAM', 'JAM_STAND_STILL_TRAFFIC');
INSERT INTO waze.alert_types (type, subtype) VALUES ('JAM', 'JAM_LIGHT_TRAFFIC');
INSERT INTO waze.alert_types (type, subtype) VALUES ('JAM', 'NO_SUBTYPE');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_SHOULDER');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_OBJECT');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_POT_HOLE');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_ROAD_KILL');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_SHOULDER_CAR_STOPPED');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_SHOULDER_ANIMALS');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_SHOULDER_MISSING_SIGN');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_FOG');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_HAIL');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_HEAVY_RAIN');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_HEAVY_SNOW');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_FLOOD');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_MONSOON');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_TORNADO');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_HEAT_WAVE');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_HURRICANE');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_WEATHER_FREEZING_RAIN');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_LANE_CLOSED');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_OIL');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_ICE');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_CONSTRUCTION');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_CAR_STOPPED');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'HAZARD_ON_ROAD_TRAFFIC_LIGHT_FAULT');
INSERT INTO waze.alert_types (type, subtype) VALUES ('WEATHERHAZARD/HAZARD', 'NO_SUBTYPE');
INSERT INTO waze.alert_types (type, subtype) VALUES ('MISC', 'NO_SUBTYPE');
INSERT INTO waze.alert_types (type, subtype) VALUES ('CONSTRUCTION', 'NO_SUBTYPE');
INSERT INTO waze.alert_types (type, subtype) VALUES ('ROAD_CLOSED', 'ROAD_CLOSED_HAZARD');
INSERT INTO waze.alert_types (type, subtype) VALUES ('ROAD_CLOSED', 'ROAD_CLOSED_CONSTRUCTION');
INSERT INTO waze.alert_types (type, subtype) VALUES ('ROAD_CLOSED', 'ROAD_CLOSED_EVENT');
