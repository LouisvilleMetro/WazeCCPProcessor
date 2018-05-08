​-- Use these scripts to remove all foreign keys if you want to speed up the processing of old JSON files. 
-- When done you can add the FKs back

-- Remove all FKs...

ALTER TABLE waze.coordinates DROP CONSTRAINT coordinates_alert_id_fkey;
ALTER TABLE waze.coordinates DROP CONSTRAINT coordinates_coordinate_type_id_fkey;
ALTER TABLE waze.coordinates DROP CONSTRAINT coordinates_irregularity_id_fkey;
ALTER TABLE waze.coordinates DROP CONSTRAINT coordinates_jam_id_fkey;
ALTER TABLE waze.irregularities DROP CONSTRAINT irregularities_datafile_id_fkey;
ALTER TABLE waze.jams DROP CONSTRAINT jams_datafile_id_fkey;
ALTER TABLE waze.alerts DROP CONSTRAINT alerts_datafile_id_fkey;

-- Add back FKs...

ALTER TABLE waze.irregularities 
ADD CONSTRAINT irregularities_datafile_id_fkey
FOREIGN KEY (datafile_id) 
REFERENCES waze.data_files(id);

ALTER TABLE waze.jams 
ADD CONSTRAINT jams_datafile_id_fkey
FOREIGN KEY (datafile_id) 
references waze.data_files (id);

ALTER TABLE waze.alerts 
ADD CONSTRAINT alerts_datafile_id_fkey
FOREIGN KEY (datafile_id) 
REFERENCES waze.data_files (id);

ALTER TABLE waze.coordinates 
ADD CONSTRAINT coordinates_alert_id_fkey
FOREIGN KEY (alert_id) 
REFERENCES waze.alerts (id);

ALTER TABLE waze.coordinates 
ADD CONSTRAINT coordinates_coordinate_type_id_fkey
FOREIGN KEY (coordinate_type_id) 
REFERENCES waze.coordinate_type (id);

ALTER TABLE waze.coordinates 
ADD CONSTRAINT coordinates_irregularity_id_fkey
FOREIGN KEY (irregularity_id) 
REFERENCES waze.irregularities (id);

ALTER TABLE waze.coordinates 
ADD CONSTRAINT coordinates_jam_id_fkey
FOREIGN KEY (jam_id) 
REFERENCES waze.jams (id);