CREATE SCHEMA waze;

CREATE TABLE waze.jams 
(
  "id"                  BIGINT PRIMARY KEY NOT NULL,
  "uuid"                VARCHAR[500] NOT NULL,
  "pub_millis"          BIGINT NOT NULL,
  "start_node"          VARCHAR[500],
  "end_node"            VARCHAR[500],
  "road_type"           INTEGER,
  "street"              VARCHAR[500],
  "city"                VARCHAR[500],
  "country"             VARCHAR[500],
  "delay"               INTEGER,
  "speed"               float4,
  "length"              INTEGER,
  "turn_type"           VARCHAR[500],
  "level"               INTEGER,
  "blocking_alert_id"   BIGINT
);

CREATE TABLE waze.irregularities 
(
  "id"                      BIGINT PRIMARY KEY NOT NULL,
  "uuid"                    VARCHAR[500] NOT NULL,
  "detection_date_millis"   BIGINT NOT NULL,
  "detection_date"          TIMESTAMP,
  "update_date_millis"      BIGINT NOT NULL,
  "update_date"             TIMESTAMP,
  "street"                  VARCHAR[500],
  "city"                    VARCHAR[500],
  "country"                 VARCHAR[500],
  "is_highway"              BOOLEAN,
  "speed"                   float4,
  "regular_speed"           float4,
  "delay_seconds"           INTEGER,
  "seconds"                 INTEGER,
  "length"                  INTEGER,
  "trend"                   INTEGER,
  "type"                    VARCHAR[500],
  "severity"                float4,
  "jam_level"               INTEGER,
  "drivers_count"           INTEGER,
  "alerts_count"            INTEGER,
  "n_thumbs_up"             INTEGER,
  "n_comments"              INTEGER,
  "n_images"                INTEGER
);

CREATE TABLE waze.alerts 
(
  "id"                            BIGINT PRIMARY KEY NOT NULL,
  "uuid"                          VARCHAR[500] NOT NULL,
  "pub_millis"                    BIGINT NOT NULL,
  "road_type"                     INTEGER,
  "street"                        VARCHAR[500],
  "city"                          VARCHAR[500],
  "country"                       VARCHAR[500],
  "magvar"                        INTEGER,
  "reliability"                   INTEGER,
  "report_description"            VARCHAR[500],
  "report_rating"                 INTEGER,
  "type"                          VARCHAR[500],
  "subtype"                       VARCHAR[500],
  "report_by_municipality_user"   BOOLEAN,
  "thumbs_up"                     INTEGER,
  "jam_id"                        BIGINT REFERENCES waze.jams (id),
  "irregularity_id"               BIGINT REFERENCES waze.irregularities (id)
);

CREATE TABLE waze.coordinates 
(
  "id"                BIGINT PRIMARY KEY NOT NULL,
  "latitude"          float8 NOT NULL,
  "longitude"         float8 NOT NULL,
  "order"             INTEGER NOT NULL,
  "jam_id"            BIGINT REFERENCES waze.jams (id),
  "irregularity_id"   BIGINT REFERENCES waze.irregularities (id),
  "alert_id"          BIGINT REFERENCES waze.alerts (id)
);

CREATE TABLE waze.roads 
(
  "id"      INTEGER PRIMARY KEY NOT NULL,
  "value"   INTEGER NOT NULL,
  "name"    VARCHAR(100) NOT NULL
);

CREATE TABLE waze.alert_types 
(
  "id"        BIGINT PRIMARY KEY NOT NULL,
  "type"      VARCHAR[500] NOT NULL,
  "subtype"   VARCHAR[500]
);

