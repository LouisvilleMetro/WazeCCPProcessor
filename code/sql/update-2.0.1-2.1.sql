-- Add Alerts type_id

-- modify database
ALTER TABLE waze.alerts ADD COLUMN IF NOT EXISTS type_id INTEGER;

-- create index
CREATE INDEX CONCURRENTLY alerts_type_id_idx ON waze.alerts (type_id);

-- add data to new type_id field in alerts
UPDATE waze.alerts AS a 
SET type_id = t.id
FROM waze.alert_types AS t
WHERE a.type = t.type 
 and a.subtype = t.subtype 
 and a.type_id is null; 

-- need to add type_id data upon ingestion...

-- Create read-only user

-- ADD A PASSWORD!
CREATE USER waze_readonly WITH ENCRYPTED PASSWORD '';

GRANT CONNECT ON DATABASE waze_data TO waze_readonly;
GRANT USAGE ON SCHEMA waze TO waze_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA waze TO waze_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA waze to waze_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze GRANT SELECT ON TABLES TO waze_readonly;
