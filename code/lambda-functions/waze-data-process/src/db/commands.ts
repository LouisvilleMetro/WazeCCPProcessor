import connectionPool = require('./connectionPool') 
import util = require('util')
import * as entities from '../entities'

// update the date_updated field on the given record
export async function updateDataFileUpdateDateByIdCommand(id: number) { 
    const sql = 'UPDATE waze.data_files SET date_updated = now() WHERE id = $1'; 

    var result = await connectionPool.getPool().query(sql, [id]);

    return;
};

// insert the new data_file record
export async function insertDataFileCommand(data_file: entities.DataFile): Promise<entities.DataFile> { 
    const sql = `INSERT INTO waze.data_files (start_time_millis, end_time_millis, start_time, end_time, date_created, date_updated, file_name, json_hash) 
                 VALUES ($1, $2, $3, $4, now(), now(), $5, $6) RETURNING *`; 

    var result = await connectionPool.getPool().query(sql, [
        data_file.start_time_millis,
        data_file.end_time_millis,
        data_file.start_time,
        data_file.end_time,
        data_file.file_name,
        data_file.json_hash
    ]);

    //now that we have the result, let's set the previously unset values
    data_file.id = result.rows[0].id;
    data_file.date_created = result.rows[0].date_created;
    data_file.date_updated = result.rows[0].date_updated;

    return data_file;
};