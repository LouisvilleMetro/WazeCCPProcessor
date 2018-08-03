/*
SELECT DISTINCT 
    waze.jams.*
FROM
    waze.jams,
    jsonb_to_recordset(line) AS (x real, y real)
WHERE
    y BETWEEN 35 AND 39
    AND x BETWEEN -100 AND -1
LIMIT 50
*/