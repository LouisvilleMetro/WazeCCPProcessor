-- Use these scripts to get a list of current indexes, and create or drop them.

-- select all indexes
SELECT * FROM pg_indexes WHERE tablename like '%' and schemaname = 'waze' order by indexname ;

-- create indexes
CREATE INDEX CONCURRENTLY alerts_pub_utc_date_idx ON waze.alerts (pub_utc_date);

-- drop indexes
DROP index CONCURRENTLY waze.alerts_pub_utc_date_idx;
