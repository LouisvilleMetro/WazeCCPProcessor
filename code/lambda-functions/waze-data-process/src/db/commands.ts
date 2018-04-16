import connectionPool = require('./connectionPool') 
import util = require('util')
import * as entities from '../entities'

// update the date_updated field on the given record
export async function updateDataFileUpdateDateByIdCommand(id: number) { 
    const sql = 'UPDATE waze.data_files SET date_updated = now() WHERE id = $1'; 

    let result = await connectionPool.getPool().query(sql, [id]);

    return;
};

// insert the new data_file record
export async function insertDataFileCommand(data_file: entities.DataFile): Promise<entities.DataFile> { 
    const sql = `INSERT INTO waze.data_files (start_time_millis, end_time_millis, start_time, end_time, date_created, date_updated, file_name, json_hash) 
                 VALUES ($1, $2, $3, $4, now(), now(), $5, $6) RETURNING *`; 

    let result = await connectionPool.getPool().query(sql, [
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

// upsert an alert record
export async function upsertAlertCommand(alert: entities.Alert): Promise<void> {
    //for simplicity, we'll always insert and update all fields, since our hash should ensure there aren't unexpected changes
    //this is really more for when we discover later that waze added a new field, we add it in all the code, then reprocess those files

    //#region UPSERT SQL
    const sql = `INSERT INTO waze.alerts (
            id, 
            uuid, 
            pub_millis, 
            pub_utc_date, 
            road_type, 
            location, 
            street, 
            city, 
            country, 
            magvar, 
            reliability, 
            report_description, 
            report_rating, 
            confidence, 
            type, 
            subtype, 
            report_by_municipality_user, 
            thumbs_up, 
            jam_uuid, 
            datafile_id
        )
        VALUES (
            $1,     -- id
            $2,     -- uuid
            $3,     -- pub_millis
            $4,     -- pub_utc_date
            $5,     -- road_type
            $6,     -- location 
            $7,     -- street
            $8,     -- city
            $9,     -- country
            $10,    -- magvar 
            $11,    -- reliability
            $12,    -- report_description
            $13,    -- report_rating
            $14,    -- confidence
            $15,    -- type
            $16,    -- subtype
            $17,    -- report_by_municipality_user
            $18,    -- thumbs_up
            $19,    -- jam_uuid 
            $20     -- datafile_id
        ) 
        ON CONFLICT (id) DO UPDATE SET 
            uuid=$2, 
            pub_millis=$3, 
            pub_utc_date=$4, 
            road_type=$5, 
            location=$6, 
            street=$7, 
            city=$8, 
            country=$9, 
            magvar=$10, 
            reliability=$11, 
            report_description=$12, 
            report_rating=$13, 
            confidence=$14, 
            type=$15, 
            subtype=$16, 
            report_by_municipality_user=$17, 
            thumbs_up=$18, 
            jam_uuid=$19, 
            datafile_id=$20`;
    //#endregion

    let result = await connectionPool.getPool().query(sql, [
        alert.id,                   //id
        alert.uuid,                 //uuid
        alert.pub_millis,           //pub_millis
        alert.pub_utc_date,         //pub_utc_date
        alert.road_type,            //road_type
        alert.location ,            //location 
        alert.street,               //street
        alert.city,                 //city
        alert.country,              //country
        alert.magvar ,              //magvar 
        alert.reliability,          //reliability
        alert.report_description,   //report_description
        alert.report_rating,        //report_rating
        alert.confidence,           //confidence
        alert.type,                 //type
        alert.subtype,              //subtype
        alert.report_by_municipality_user,  //report_by_municipality_user
        alert.thumbs_up,            //thumbs_up
        alert.jam_uuid ,            //jam_uuid 
        alert.datafile_id,          //datafile_id
    ]);

    //nothing currently to alter on the alert object based on SQL return
    return;
}