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
