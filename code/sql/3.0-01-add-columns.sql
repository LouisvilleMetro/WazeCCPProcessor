/*************************************************************************************** 
Note that this script is always run, so everything in it must be idempotent (rerunnable)
IE, use "if not exists" liberally

Any errors will fail the script
***************************************************************************************/

CREATE EXTENSION IF NOT EXISTS postgis;

-- all these are nullable. 
ALTER TABLE waze.jams ADD COLUMN IF NOT EXISTS ns_direction varchar(3);
ALTER TABLE waze.jams ADD COLUMN IF NOT EXISTS ew_direction varchar(3);
ALTER TABLE waze.jams ADD COLUMN IF NOT EXISTS dayofweek int4 ;
ALTER TABLE waze.jams ADD COLUMN IF NOT EXISTS geom_line geometry(LINESTRING,4326);

ALTER TABLE waze.alerts ADD COLUMN IF NOT EXISTS type_id INTEGER;
ALTER TABLE waze.alerts ADD COLUMN IF NOT EXISTS dayofweek INTEGER;
ALTER TABLE waze.alerts ADD COLUMN IF NOT EXISTS geom_point geometry(POINT,4326);
