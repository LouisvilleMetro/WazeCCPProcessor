import * as entities from '../../../shared-lib/src/entities';
import { QueryResult } from 'pg';

export function toJamWithLine(queryResponse: QueryResult, includeCoordinates: boolean) : entities.JamWithLine[] {
    let jams: entities.JamWithLine[] = [];
    for(let row of queryResponse.rows)
    {
        let jam: entities.JamWithLine = {
            id : row.id || null,
            uuid : row.uuid || null,
            pub_millis : row.pub_millis || null,
            pub_utc_date : row.pub_utc_date || null,
            start_node : row.start_node || null,
            end_node : row.end_node || null,
            road_type : row.road_type || null,
            street : row.street || null,
            city : row.city || null,
            country : row.country || null,
            delay : row.delay  || null,
            speed : row.speed || null,
            speed_kmh : row.speed_kmh || null,
            length : row.length || null,
            turn_type : row.turn_type  || null,
            level : row.level || null,
            blocking_alert_id : row.blocking_alert_id || null,
            line: null,
            type : row.type || null,
            turn_line : row.turn_line || null,
            datafile_id : row.datafile_id || null,
            startLatitude: 0,
            startLongitude: 0,
        };
        //looks like pg's node client does this for us?
        //jam.line = JSON.parse(row.line);
        if(row.line && row.line.length && row.line.length > 0)
        {
            jam.startLatitude = row.line[0].y;
            jam.startLongitude = row.line[0].x;
            if(includeCoordinates)
            {
                jam.line = row.line;
            }
        }
        jams.push(jam);
    }
    
    return jams;
}