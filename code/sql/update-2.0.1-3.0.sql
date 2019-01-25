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
