/*************************************************************************************** 
Note that this script is always run, so everything in it must be idempotent (rerunnable)
IE, use "if not exists" liberally

Any errors will fail the script
***************************************************************************************/

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS waze.application_version
(
  version_number                  VARCHAR(30) PRIMARY KEY NOT NULL,
  install_date                    TIMESTAMP NOT NULL
);

-- all these are nullable. 
ALTER TABLE waze.jams ADD COLUMN IF NOT EXISTS ns_direction varchar(3);
ALTER TABLE waze.jams ADD COLUMN IF NOT EXISTS ew_direction varchar(3);
ALTER TABLE waze.jams ADD COLUMN IF NOT EXISTS dayofweek int4 ;
ALTER TABLE waze.jams ADD COLUMN IF NOT EXISTS geom_line geometry(LINESTRING,4326);

ALTER TABLE waze.alerts ADD COLUMN IF NOT EXISTS type_id INTEGER;
ALTER TABLE waze.alerts ADD COLUMN IF NOT EXISTS dayofweek INTEGER;
ALTER TABLE waze.alerts ADD COLUMN IF NOT EXISTS geom_point geometry(POINT,4326);

CREATE OR REPLACE FUNCTION waze.line_to_geometry( line jsonb )
RETURNS GEOMETRY
AS $$
BEGIN
  -- Set the result to be the same SRID as what's used in column definitions
	RETURN(
		SELECT ST_setsrid(
      ST_MakeLine(
        ST_MakePoint(
          (line -> n ->> 'x')::NUMERIC, 
          (line -> n ->> 'y')::NUMERIC
        )
      ),4326) 
		FROM generate_series(0, jsonb_array_length(line) - 1) AS n
 	);
END
$$ LANGUAGE PLPGSQL IMMUTABLE;

-- Version 2.0.1 didn't know about this table, so adding it now
INSERT INTO waze.application_version(version_number, install_date) VALUES('2.01',NOW()) ON CONFLICT DO NOTHING; 

-- and our own version
INSERT INTO waze.application_version(version_number, install_date) VALUES('3.0',NOW()) ON CONFLICT DO NOTHING; 
