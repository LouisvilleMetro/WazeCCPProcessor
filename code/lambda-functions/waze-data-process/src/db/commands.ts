import connectionPool = require('../../../shared-src/connectionPool') 
import util = require('util')
import * as entities from '../../../shared-src/entities'

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

// upsert a jam record
export async function upsertJamCommand(jam: entities.Jam): Promise<void> {
    //for simplicity, we'll always insert and update all fields, since our hash should ensure there aren't unexpected changes
    //this is really more for when we discover later that waze added a new field, we add it in all the code, then reprocess those files

    //#region UPSERT SQL
    const sql = `INSERT INTO waze.jams (
        id, 
        uuid, 
        pub_millis, 
        pub_utc_date, 
        start_node, 
        end_node, 
        road_type, 
        street, 
        city, 
        country, 
        delay, 
        speed, 
        speed_kmh, 
        length, 
        turn_type, 
        level, 
        blocking_alert_id, 
        line, 
        datafile_id,
        type,
        turn_line
    )
    VALUES (
        $1,     -- id
        $2,     -- uuid
        $3,     -- pub_millis
        $4,     -- pub_utc_date
        $5,     -- start_node
        $6,     -- end_node
        $7,     -- road_type
        $8,     -- street
        $9,     -- city
        $10,    -- country
        $11,    -- delay
        $12,    -- speed
        $13,    -- speed_kmh
        $14,    -- length
        $15,    -- turn_type
        $16,    -- level
        $17,    -- blocking_alert_id
        $18,    -- line
        $19,    -- datafile_id
        $20,    -- type
        $21     -- turn_line
    ) 
    ON CONFLICT (id) DO UPDATE SET 
        uuid=$2, 
        pub_millis=$3, 
        pub_utc_date=$4, 
        start_node=$5, 
        end_node=$6, 
        road_type=$7, 
        street=$8, 
        city=$9, 
        country=$10, 
        delay=$11, 
        speed=$12, 
        speed_kmh=$13, 
        length=$14, 
        turn_type=$15, 
        level=$16, 
        blocking_alert_id=$17, 
        line=$18, 
        datafile_id=$19,
        type=$20,
        turn_line=$21`;
//#endregion

    let result = await connectionPool.getPool().query(sql, [
        jam.id,                 //id
        jam.uuid,               //uuid
        jam.pub_millis,         //pub_millis
        jam.pub_utc_date,       //pub_utc_date
        jam.start_node,         //start_node
        jam.end_node,           //end_node
        jam.road_type,          //road_type
        jam.street,             //street
        jam.city,               //city
        jam.country,            //country
        jam.delay,              //delay
        jam.speed,              //speed
        jam.speed_kmh,          //speed_kmh
        jam.length,             //length
        jam.turn_type,          //turn_type
        jam.level,              //level
        jam.blocking_alert_id,  //blocking_alert_id
        jam.line,               //line
        jam.datafile_id,        //datafile_id
        jam.type,               //type
        jam.turn_line,          //turn_line
    ]);

    //nothing currently to update on the jam object based on SQL return
    return;

}

// upsert an irregularity record
export async function upsertIrregularityCommand(irregularity: entities.Irregularity): Promise<void> {
    //for simplicity, we'll always insert and update all fields, since our hash should ensure there aren't unexpected changes
    //this is really more for when we discover later that waze added a new field, we add it in all the code, then reprocess those files

    //#region UPSERT SQL
    const sql = `INSERT INTO waze.irregularities (
        id, 
        uuid, 
        detection_date_millis,
        detection_date, 
        detection_utc_date, 
        update_date_millis, 
        update_date, 
        update_utc_date, 
        street, 
        city, 
        country, 
        is_highway, 
        speed, 
        regular_speed, 
        delay_seconds, 
        seconds, 
        length, 
        trend, 
        type, 
        severity, 
        jam_level, 
        drivers_count, 
        alerts_count, 
        n_thumbs_up, 
        n_comments, 
        n_images, 
        line, 
        datafile_id,
        cause_type,
        start_node,
        end_node
    )
    VALUES (
        $1,     -- id, 
        $2,     -- uuid, 
        $3,     -- detection_date_millis,
        $4,     -- detection_date, 
        $5,     -- detection_utc_date, 
        $6,     -- update_date_millis, 
        $7,     -- update_date, 
        $8,     -- update_utc_date, 
        $9,     -- street, 
        $10,    -- city, 
        $11,    -- country, 
        $12,    -- is_highway, 
        $13,    -- speed, 
        $14,    -- regular_speed, 
        $15,    -- delay_seconds, 
        $16,    -- seconds, 
        $17,    -- length, 
        $18,    -- trend, 
        $19,    -- type, 
        $20,    -- severity, 
        $21,    -- jam_level, 
        $22,    -- drivers_count, 
        $23,    -- alerts_count, 
        $24,    -- n_thumbs_up, 
        $25,    -- n_comments, 
        $26,    -- n_images, 
        $27,    -- line, 
        $28,    -- datafile_id
        $29,    -- cause_type 
        $30,    -- start_node
        $31    -- end_node
    ) 
    ON CONFLICT (id) DO UPDATE SET 
        uuid  = $2,
        detection_date_millis = $3,
        detection_date  = $4,
        detection_utc_date  = $5,
        update_date_millis  = $6,
        update_date  = $7,
        update_utc_date  = $8,
        street  = $9,
        city  = $10,
        country  = $11,
        is_highway  = $12,
        speed  = $13,
        regular_speed  = $14,
        delay_seconds  = $15,
        seconds  = $16,
        length  = $17,
        trend  = $18,
        type  = $19,
        severity  = $20,
        jam_level  = $21,
        drivers_count  = $22,
        alerts_count  = $23,
        n_thumbs_up  = $24,
        n_comments  = $25,
        n_images = $26,
        line = $27,
        datafile_id = $28,
        cause_type = $29,
        start_node = $30,
        end_node = $31`;
    //#endregion

    let result = await connectionPool.getPool().query(sql, [
        irregularity.id,                    //id     
        irregularity.uuid,                  //uuid 
        irregularity.detection_date_millis, //detection_date_millis
        irregularity.detection_date,        //detection_date 
        irregularity.detection_utc_date,    //detection_utc_date 
        irregularity.update_date_millis,    //update_date_millis 
        irregularity.update_date,           //update_date 
        irregularity.update_utc_date,       //update_utc_date 
        irregularity.street,                //street 
        irregularity.city,                  //city 
        irregularity.country,               //country 
        irregularity.is_highway,            //is_highway 
        irregularity.speed,                 //speed 
        irregularity.regular_speed,         //regular_speed 
        irregularity.delay_seconds,         //delay_seconds 
        irregularity.seconds,               //seconds 
        irregularity.length,                //length 
        irregularity.trend,                 //trend 
        irregularity.type,                  //type 
        irregularity.severity,              //severity 
        irregularity.jam_level,             //jam_level 
        irregularity.drivers_count,         //drivers_count 
        irregularity.alerts_count,          //alerts_count 
        irregularity.n_thumbs_up,           //n_thumbs_up 
        irregularity.n_comments,            //n_comments 
        irregularity.n_images,              //n_images
        irregularity.line,                  //line
        irregularity.datafile_id,           //datafile_id
        irregularity.cause_type,            //cause_type
        irregularity.start_node,            //start_node
        irregularity.end_node               //end_node
    ]);

    //nothing currently to jam on the alert object based on SQL return
    return;

}

// upsert a coordinate record
export async function upsertCoordinateCommand(coordinate: entities.Coordinate): Promise<void> {
    //for simplicity, we'll always insert and update all fields, since our hash should ensure there aren't unexpected changes
    //this is really more for when we discover later that waze added a new field, we add it in all the code, then reprocess those files

    //#region UPSERT SQL
    const sql = `INSERT INTO waze.coordinates (
        id, 
        latitude, 
        longitude, 
        "order", 
        jam_id, 
        irregularity_id, 
        alert_id, 
        coordinate_type_id
    )
    VALUES (
        $1,     -- id
        $2,     -- latitude
        $3,     -- longitude
        $4,     -- order
        $5,     -- jam_id
        $6,     -- irregularity_id
        $7,     -- alert_id
        $8      -- coordinate_type_id
    ) 
    ON CONFLICT (id) DO UPDATE SET 
        id=$1, 
        latitude=$2,
        longitude=$3, 
        "order"=$4, 
        jam_id=$5, 
        irregularity_id=$6, 
        alert_id=$7, 
        coordinate_type_id=$8`;
    //#endregion

    let result = await connectionPool.getPool().query(sql, [
        coordinate.id,                  //id
        coordinate.latitude,            //latitude
        coordinate.longitude,           //longitude
        coordinate.order,               //order
        coordinate.jam_id,              //jam_id
        coordinate.irregularity_id,     //irregularity_id
        coordinate.alert_id,            //alert_id
        coordinate.coordinate_type_id   //coordinate_type_id
    ]);

    //nothing currently to alter on the coordinate object based on SQL return
    return;
}