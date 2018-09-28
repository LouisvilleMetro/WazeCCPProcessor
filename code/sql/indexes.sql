-- Use these scripts to get a list of current indexes, and create or drop them.

-- select all indexes
SELECT * FROM pg_indexes WHERE tablename like '%' and schemaname = 'waze' order by indexname ;

-- create indexes
CREATE INDEX CONCURRENTLY jams_pub_utc_date_idx ON waze.jams (pub_utc_date);
CREATE INDEX CONCURRENTLY alerts_pub_utc_date_idx ON waze.alerts (pub_utc_date);
CREATE INDEX CONCURRENTLY coordinates_jam_id_idx ON waze.coordinates (jam_id);
CREATE INDEX CONCURRENTLY coordinates_latitude_idx ON waze.coordinates (latitude);
CREATE INDEX CONCURRENTLY coordinates_longitude_idx ON waze.coordinates (longitude);
CREATE INDEX CONCURRENTLY coordinates_order_idx ON waze.coordinates (order);
CREATE INDEX CONCURRENTLY coordinates_coordinate_type_id_idx ON waze.coordinates (coordinate_type_id);
CREATE INDEX CONCURRENTLY coordinates_alert_id_idx ON waze.coordinates (alert_id);
CREATE INDEX CONCURRENTLY alerts_type_id_idx ON waze.alerts (type_id);
CREATE INDEX CONCURRENTLY alerts_sub_type_idx ON waze.alerts (sub_type);
CREATE INDEX CONCURRENTLY alerts_type_idx ON waze.alerts (type);
CREATE INDEX CONCURRENTLY jams_uuid_idx ON waze.jams (uuid);
CREATE INDEX CONCURRENTLY alerts_uuid_idx ON waze.alerts (uuid);
CREATE INDEX CONCURRENTLY jams_ns_direction_idx ON waze.jams (ns_direction);
CREATE INDEX CONCURRENTLY jams_ew_direction_idx ON waze.jams (ew_direction);

-- drop indexes
DROP index CONCURRENTLY waze.jams_pub_utc_date_idx;
DROP index CONCURRENTLY waze.alerts_pub_utc_date_idx;
DROP index CONCURRENTLY waze.coordinates_jam_id_idx;
DROP index CONCURRENTLY waze.coordinates_latitude_idx;
DROP index CONCURRENTLY waze.coordinates_longitude_idx;
DROP index CONCURRENTLY waze.coordinates_order_idx;
DROP index CONCURRENTLY waze.coordinates_coordinate_type_id_idx;
DROP index CONCURRENTLY waze.coordinates_alert_id_idx;
DROP index CONCURRENTLY waze.alerts_type_id_idx;
DROP index CONCURRENTLY waze.alerts_sub_type_idx;
DROP index CONCURRENTLY waze.alerts_type_idx;
DROP index CONCURRENTLY waze.jams_uuid_idx;
DROP index CONCURRENTLY waze.alerts_uuid_idx;
DROP index CONCURRENTLY waze.jams_ns_direction_idx;
DROP index CONCURRENTLY waze.jams_ew_direction_idx;
