-- Use these scripts to get a list of current indexes, and create or drop them.

-- select all indexes
SELECT * FROM pg_indexes WHERE tablename like '%' and schemaname = 'waze' order by indexname ;

-- create indexes (NOTE: THESE ARE CREATED IN THE BASE SCHEMA ALREADY AND MAINTAINED HERE FOR EASY DROP/RECREATE IF NECESSARY)
-- cannot create index concurrently in a batch statement, have to do one at a time
CREATE INDEX CONCURRENTLY IF NOT EXISTS jams_pub_utc_date_idx ON waze.jams (pub_utc_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS alerts_pub_utc_date_idx ON waze.alerts (pub_utc_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS coordinates_jam_id_idx ON waze.coordinates (jam_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS coordinates_latitude_idx ON waze.coordinates (latitude);
CREATE INDEX CONCURRENTLY IF NOT EXISTS coordinates_longitude_idx ON waze.coordinates (longitude);
CREATE INDEX CONCURRENTLY IF NOT EXISTS coordinates_order_idx ON waze.coordinates ("order");
CREATE INDEX CONCURRENTLY IF NOT EXISTS coordinates_coordinate_type_id_idx ON waze.coordinates (coordinate_type_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS coordinates_alert_id_idx ON waze.coordinates (alert_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS alerts_type_id_idx ON waze.alerts ("type_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS alerts_sub_type_idx ON waze.alerts (subtype);
CREATE INDEX CONCURRENTLY IF NOT EXISTS alerts_type_idx ON waze.alerts ("type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS jams_uuid_idx ON waze.jams (uuid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS alerts_uuid_idx ON waze.alerts (uuid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS jams_ns_direction_idx ON waze.jams (ns_direction);
CREATE INDEX CONCURRENTLY IF NOT EXISTS jams_ew_direction_idx ON waze.jams (ew_direction);
CREATE INDEX CONCURRENTLY IF NOT EXISTS jams_dayofweek_idx ON waze.jams (dayofweek);
CREATE INDEX CONCURRENTLY IF NOT EXISTS alerts_dayofweek_idx ON waze.alerts (dayofweek);

-- drop indexes
DROP INDEX IF EXISTS  waze.jams_pub_utc_date_idx;
DROP INDEX IF EXISTS  waze.alerts_pub_utc_date_idx;
DROP INDEX IF EXISTS  waze.coordinates_jam_id_idx;
DROP INDEX IF EXISTS  waze.coordinates_latitude_idx;
DROP INDEX IF EXISTS  waze.coordinates_longitude_idx;
DROP INDEX IF EXISTS  waze.coordinates_order_idx;
DROP INDEX IF EXISTS  waze.coordinates_coordinate_type_id_idx;
DROP INDEX IF EXISTS  waze.coordinates_alert_id_idx;
DROP INDEX IF EXISTS  waze.alerts_type_id_idx;
DROP INDEX IF EXISTS  waze.alerts_sub_type_idx;
DROP INDEX IF EXISTS  waze.alerts_type_idx;
DROP INDEX IF EXISTS  waze.jams_uuid_idx;
DROP INDEX IF EXISTS  waze.alerts_uuid_idx;
DROP INDEX IF EXISTS  waze.jams_ns_direction_idx;
DROP INDEX IF EXISTS waze.jams_ew_direction_idx;
DROP INDEX IF EXISTS waze.jams_dayofweek_idx;
DROP INDEX IF EXISTS waze.alerts_dayofweek_idx;
