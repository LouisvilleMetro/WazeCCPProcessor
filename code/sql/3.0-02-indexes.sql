/*************************************************************************************** 
Note that this script is always run, so everything in it must be idempotent (rerunnable)
IE, use "if not exists" liberally

Any errors will fail the script
***************************************************************************************/

-- cannot create index concurrently in a batch statement, have to do one at a time
CREATE INDEX IF NOT EXISTS jams_pub_utc_date_idx ON waze.jams (pub_utc_date);
CREATE INDEX IF NOT EXISTS alerts_pub_utc_date_idx ON waze.alerts (pub_utc_date);
CREATE INDEX IF NOT EXISTS coordinates_jam_id_idx ON waze.coordinates (jam_id);
CREATE INDEX IF NOT EXISTS coordinates_latitude_idx ON waze.coordinates (latitude);
CREATE INDEX IF NOT EXISTS coordinates_longitude_idx ON waze.coordinates (longitude);
CREATE INDEX IF NOT EXISTS coordinates_order_idx ON waze.coordinates ("order");
CREATE INDEX IF NOT EXISTS coordinates_coordinate_type_id_idx ON waze.coordinates (coordinate_type_id);
CREATE INDEX IF NOT EXISTS coordinates_alert_id_idx ON waze.coordinates (alert_id);
CREATE INDEX IF NOT EXISTS alerts_type_id_idx ON waze.alerts ("type_id");
CREATE INDEX IF NOT EXISTS alerts_sub_type_idx ON waze.alerts (subtype);
CREATE INDEX IF NOT EXISTS alerts_type_idx ON waze.alerts ("type");
CREATE INDEX IF NOT EXISTS jams_uuid_idx ON waze.jams (uuid);
CREATE INDEX IF NOT EXISTS alerts_uuid_idx ON waze.alerts (uuid);
CREATE INDEX IF NOT EXISTS jams_ns_direction_idx ON waze.jams (ns_direction);
CREATE INDEX IF NOT EXISTS jams_ew_direction_idx ON waze.jams (ew_direction);
CREATE INDEX IF NOT EXISTS jams_dayofweek_idx ON waze.jams (dayofweek);
CREATE INDEX IF NOT EXISTS alerts_dayofweek_idx ON waze.alerts (dayofweek);

-- see indexes.sql which have statements for both drop and create of indexes 
-- meant as a utility; a duplicate of what is run automatically

