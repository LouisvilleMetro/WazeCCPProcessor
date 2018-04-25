import connectionPool = require('./connectionPool') 
import util = require('util')
import * as entities from '../entities'

// get a date_file record, if one exists, with the passed hash
export async function getDataFilesByHashQuery(jsonHash: string): Promise<entities.DataFile> { 
    const sql = 'SELECT * FROM waze.data_files WHERE json_hash = $1'; 

    let result = await connectionPool.getPool().query(sql, [jsonHash]);

    if(result.rowCount > 1){
        //this shouldn't happen!
        throw new Error(util.format("Found multiple records with json hash '%s'", jsonHash));
    }
    else if(result.rowCount === 0){
        //nothing found, return null
        return null;
    }
    
    //we got a record, so return it
    let df = new entities.DataFile();
    df.date_created = result.rows[0].date_created;
    df.date_updated = result.rows[0].date_updated;
    df.end_time = result.rows[0].end_time;
    df.end_time_millis = result.rows[0].end_time_millis;
    df.file_name = result.rows[0].file_name;
    df.id = result.rows[0].id;
    df.json_hash = result.rows[0].json_hash;
    df.start_time = result.rows[0].start_time;
    df.start_time_millis = result.rows[0].start_time_millis;

    return df;
};