-- Add Alerts type_id
-- modify database
ALTER TABLE waze.alerts ADD COLUMN IF NOT EXISTS type_id INTEGER;

-- create index
CREATE INDEX CONCURRENTLY alerts_type_id_idx ON waze.alerts (type_id);

-- Create read-only user
CREATE USER waze_readonly WITH ENCRYPTED PASSWORD '<from Terraform config>';

GRANT CONNECT ON DATABASE waze_data TO waze_readonly;
GRANT USAGE ON SCHEMA waze TO waze_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA waze TO waze_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA waze to waze_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze GRANT SELECT ON TABLES TO waze_readonly;
