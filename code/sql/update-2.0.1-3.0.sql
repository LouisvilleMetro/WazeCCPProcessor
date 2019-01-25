
-- add Jams fields
ALTER TABLE waze.jams ADD COLUMN IF NOT EXISTS ns_direction varchar(3) ;
ALTER TABLE waze.jams ADD COLUMN IF NOT EXISTS ew_direction varchar(3) ;
ALTER TABLE waze.jams ADD COLUMN IF NOT EXISTS dayofweek int4 ;
--ALTER TABLE waze.jams ADD COLUMN IF NOT EXISTS geom_line geography(LINESTRING) ;
SELECT AddGeometryColumn ('waze','jams','geom_line',4326,'LINESTRING',2);

-- add Alerts fields
ALTER TABLE waze.alerts ADD COLUMN IF NOT EXISTS type_id INTEGER;
ALTER TABLE waze.alerts ADD COLUMN IF NOT EXISTS dayofweek INTEGER ;
--ALTER TABLE waze.alerts ADD COLUMN IF NOT EXISTS geom_point geography(POINT) ;
SELECT AddGeometryColumn ('waze','alerts','geom_point',4326,'POINT',2);


-- UPDATE JAMS TABLE

-- jams.ns_direction
-- create index
CREATE INDEX CONCURRENTLY jams_ns_direction_idx ON waze.jams (ns_direction);
-- fill empty cells with data (this may take too long to run here)
-- update waze.jams set ns_direction =  
-- case  when (line -> 0 ->> 'y')::NUMERIC - (line -> jsonb_array_length(line)-1 ->> 'y')::numeric  > 0 then 'S' else 'N' end
-- where uuid in (select uuid from waze.jams where ns_direction is null);

-- jams.ew_direction
-- create index
CREATE INDEX CONCURRENTLY jams_ew_direction_idx ON waze.jams (ew_direction);
-- fill empty cells with data (this may take too long to run here)
-- update waze.jams set ew_direction =  
-- case  when (line -> 0 ->> 'x')::NUMERIC - (line -> jsonb_array_length(line)-1 ->> 'x')::numeric  > 0 then 'W' else 'E' end 
-- where uuid in (select uuid from waze.jams where ew_direction is null);

-- jams.dayofweek
-- create index
CREATE INDEX CONCURRENTLY jams_dayofweek_idx ON waze.jams (dayofweek);
-- fill empty cells with data
UPDATE waze.jams
SET dayofweek = extract(dow from pub_utc_date)
FROM waze.jams
WHERE dayofweek is null; 

-- jams.geom_point - fill empty cells with data


-- UPDATE ALERTS TABLE 

-- alerts.type_id 
-- create index
CREATE INDEX CONCURRENTLY alerts_type_id_idx ON waze.alerts (type_id);
-- fill empty cells with data
UPDATE waze.alerts AS a 
SET type_id = t.id
FROM waze.alert_types AS t
WHERE a.type = t.type 
 and a.subtype = t.subtype 
 and a.type_id is null; 
 
-- alerts.dayofweek
-- create index
CREATE INDEX CONCURRENTLY alerts_dayofweek_idx ON waze.alerts (dayofweek);
-- fill empty cells with data
UPDATE waze.alerts
SET dayofweek = extract(dow from pub_utc_date)
FROM waze.alerts
WHERE dayofweek is null;  
 
-- alerts.geom_point - fill empty cells with data
UPDATE waze.alerts SET geom_point = ST_SetSRID(ST_MakeLine(longitude, latitude), 4326);


-- Create read-only user
-- note: need to add a password here when running
CREATE USER waze_readonly WITH ENCRYPTED PASSWORD '';
GRANT CONNECT ON DATABASE waze_data TO waze_readonly;
GRANT USAGE ON SCHEMA waze TO waze_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA waze TO waze_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA waze to waze_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze GRANT SELECT ON TABLES TO waze_readonly;


-- version table will be used for version tracking and upgrading
-- THIS TABLE MUST GET A RECORD ADDED WITH NEW INSTALLS TO INDICATE WHICH VERSION GOT INSTALLED
-- Update scripts MUST ALSO add a new row to the table to indicate the new version
CREATE TABLE waze.application_version
(
  "version_number"                  VARCHAR(30) PRIMARY KEY NOT NULL,
  "install_date"                    TIMESTAMP NOT NULL
)

-- insert the CURRENT VERSION NUMBER into the version table
INSERT INTO waze.application_version (version_number, install_date) VALUES ('2.1', current_timestamp);



