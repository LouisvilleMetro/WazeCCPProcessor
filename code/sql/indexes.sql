-- Use these scripts to get a list of current indexes, and create or drop them.

-- select all indexes
SELECT * FROM pg_indexes WHERE tablename like '%' and schemaname = 'waze' order by indexname ;

-- create indexes (NOTE: THESE ARE CREATED IN THE BASE SCHEMA ALREADY AND MAINTAINED HERE FOR EASY DROP/RECREATE IF NECESSARY)
CREATE INDEX CONCURRENTLY jams_pub_utc_date_idx ON waze.jams (pub_utc_date);
CREATE INDEX CONCURRENTLY alerts_pub_utc_date_idx ON waze.alerts (pub_utc_date);
CREATE INDEX CONCURRENTLY coordinates_jam_id_idx ON waze.coordinates (jam_id);
CREATE INDEX CONCURRENTLY coordinates_latitude_idx ON waze.coordinates (latitude);
CREATE INDEX CONCURRENTLY coordinates_longitude_idx ON waze.coordinates (longitude);
CREATE INDEX CONCURRENTLY coordinates_coordinate_type_id_idx ON waze.coordinates (coordinate_type_id);
CREATE INDEX CONCURRENTLY coordinates_alert_id_idx ON waze.coordinates (alert_id);
CREATE INDEX CONCURRENTLY alerts_type_id_idx ON waze.alerts (type_id);

-- drop indexes
DROP index CONCURRENTLY waze.jams_pub_utc_date_idx;
DROP index CONCURRENTLY waze.alerts_pub_utc_date_idx;
DROP index CONCURRENTLY waze.coordinates_jam_id_idx;
DROP index CONCURRENTLY waze.coordinates_latitude_idx;
DROP index CONCURRENTLY waze.coordinates_longitude_idx;
DROP index CONCURRENTLY waze.coordinates_coordinate_type_id_idx;
DROP index CONCURRENTLY waze.coordinates_alert_id_idx;
DROP index CONCURRENTLY waze.alerts_type_id_idx;
