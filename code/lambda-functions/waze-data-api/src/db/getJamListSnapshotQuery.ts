import connectionPool = require('../../../shared-lib/src/connectionPool') 
import * as entities from '../../../shared-lib/src/entities'

export class GetJamsListSnapshotQueryArgs {
    startDateTime: Date;
    endDateTime: Date;
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
    levels: number[];
    roadTypes: number[];
    street: string;
    delayMin: number;
    delayMax: number;
    speedMin: number;
    speedMax: number;
    lengthMin: number;
    lengthMax: number;
    num: number;
    offset: number;
    countOnly: boolean;
    
    fieldNames: string[];
}

export class JamsSnapshotTimeframe {
    startTime: number;
    endTime: number;
}

export class GetJamsListSnapshotResult 
{
    jams : entities.Jam[];
    timeframeReturned: JamsSnapshotTimeframe;
    nextTimeframe: JamsSnapshotTimeframe;
    previousTimeframe: JamsSnapshotTimeframe;
}

export async function getJamsListSnapshot(queryArgs: GetJamsListSnapshotQueryArgs) : Promise<GetJamsListSnapshotResult>
{
    var query = buildSqlAndParameterList(queryArgs);
    let queryResponse = await connectionPool.getPool().query(query.sql, query.parameterList);

    if(queryResponse.rowCount === 0){
        //nothing found, return null
        return null;
    }
    
    let result = new GetJamsListSnapshotResult();
    for(let row of queryResponse)
    {
        if(!result.timeframeReturned)        
        {
            result.timeframeReturned = {
                startTime : <number>row.start_time_millis,
                endTime : <number>row.end_time_millis
            };
        }
        if(!result.nextTimeframe)
        {
            result.nextTimeframe = {
                startTime : <number>row.next_start_time_millis,
                endTime : <number>row.next_end_time_millis
            };
        }
        if(!result.previousTimeframe)
        {
            result.previousTimeframe = {
                startTime : <number>row.prev_start_time_millis,
                endTime : <number>row.prev_end_time_millis
            };
        }
        var jam = new entities.Jam();
        jam.id = row.id || null;
        jam.uuid = row.uuid || null;
        jam.pub_utc_date = row.pub_utc_date || null;
        jam.line
    }

    throw new Error("This method is not implemented.");
}

function buildSqlAndParameterList(args: GetJamsListSnapshotQueryArgs): { sql:string, parameterList: any[] } 
{
    let sql = "SELECT ";

    if(args.countOnly === true)
    {
        sql += "COUNT(1)";
    }
    else
    {
        sql += getEscapedFieldNames(args).join(",");
    }
    
    sql += " FROM waze.jams j" +
        " INNER JOIN (" +
            " SELECT " +
                " df.id file_id," +
                " df.start_time_millis," +
                " df.end_time_millis," +
                " LAG(df.id,1) OVER( order by start_time_millis) as prev_file_id," +
                " LAG(df.start_time_millis,1) OVER( order by start_time_millis) as prev_start_time_millis," +
                " LAG(df.end_time_millis,1) OVER( order by start_time_millis) as prev_end_time_millis," +
                " LEAD(df.id,1) OVER( order by start_time_millis) as next_file_id," +
                " LEAD(df.start_time_millis,1) OVER( order by start_time_millis) as next_start_time_millis," +
                " LEAD(df.end_time_millis,1) OVER( order by start_time_millis) as next_end_time_millis" +
            " FROM"+
                " waze.data_files df"+
            ") files"+
        " ON files.file_id = j.datafile_id,"+
      // TODO: Figure out how to alias these as something a bit more descriptive
      " jsonb_to_recordset(j.line) AS (x real, y real)"+
    
    " WHERE"+
        " $1 BETWEEN files.start_time_millis AND files.end_time_millis"+
        " AND y BETWEEN $2 AND $3"+
        " AND x BETWEEN $4 AND $5";
    

    let parameters : any[] = [
        args.startDateTime, 
        args.endDateTime,
        args.minLat,
        args.maxLat,
        args.minLon,
        args.maxLon];

    if(args.levels && args.levels.length > 0)
    {
        //get an array containing a range of values from 0 to query.levels.length
        //and do the parameter-ize thing to make them $n, $n+1 and so on.
        var p = Array.from(Array(args.levels.length).keys())
            .map(i => "$" + (i + parameters.length).toString());
        //now join them so we wind up with a csv list
        //I feel like there should be a better way to do this 
        sql += " AND jams.level IN (" + p.join(",") + ")";
        //javascript is such a consistent language!
        parameters = parameters.concat(args.levels);
    }
    
    if(args.roadTypes && args.roadTypes.length > 0)
    {
        var p = Array.from(Array(args.levels.length).keys())
            .map(i => "$" + (i + parameters.length).toString());
        sql += " AND jams.road_type IN (" + p.join(",") + ")";
        parameters = parameters.concat(args.roadTypes);
    }

    if(args.street)
    {
        //this has to be a like. case-sensitivity depends on collation.
        parameters.push("%" + args.street + "%");
        sql += " AND jams.street LIKE $" + parameters.length;
    }

    //delay
    if(args.delayMin)
    {
        parameters.push(args.delayMin);
        sql += " AND jams.delay >= $" + parameters.length;
    }

    if(args.delayMax)
    {
        parameters.push(args.delayMax);
        sql += " AND jams.delay <= $" + parameters.length;
    }

    //speed
    if(args.speedMin)
    {
        parameters.push(args.speedMin);
        sql += " AND jams.speed >= $" + parameters.length;
    }

    if(args.speedMax)
    {
        parameters.push(args.speedMax);
        sql += " AND jams.speed <= $" + parameters.length;
    }

    //length
    if(args.lengthMin)
    {
        parameters.push(args.lengthMin);
        sql += " AND jams.length >= $" + parameters.length;
    }

    if(args.lengthMax)
    {
        parameters.push(args.lengthMax);
        sql += " AND jams.length <= $" + parameters.length;
    }
    
    if(args.num)
    {
        //injection risk - try to make sure what we have here is numeric
        sql += " LIMIT " + parseInt(args.num.toString());
    }

    if(args.offset)
    {
        //injection risk - try to make sure what we have here is numeric
        sql += " OFFSET " + parseInt(args.num.toString());
    }

    return {
        sql : sql,
        parameterList : parameters
    };
}

let fieldNamesDict : { [id: string] : string} = {
    "city": "j.city",
    "delay" : "j.delay",
    "end_node" : "j.end_node",
    "id" : "j.id",
    "latitude" : "j.latitude",
    "length" : "j.length",
    "level" : "j.level",
    "longitude" : "j.longitude",
    "pub_utc_date" : "j.pub_utc_date",
    "road_type" : "j.road_type",
    "speed" : "j.speed",
    "speed_kmh" : "j.speed_kmh",
    "start_node" : "j.start_node",
    "street" : "j.street",
    "turn_type" : "j.turn_type",
    "uuid" : "j.uuid",
}

function getEscapedFieldNames(queryArgs: GetJamsListSnapshotQueryArgs) : string[]
{
    let escapedFields: string[] = [];
    
    for(let field of queryArgs.fieldNames)
    {
        field = field.toLowerCase();
        //if it's in our list of allowed field names and we don't 
        //already have it in our list of escaped field names, then add it.
        if(fieldNamesDict.hasOwnProperty(field) && escapedFields.indexOf(field) == -1)
        {
            escapedFields.push(field);
        }
    }

    return escapedFields.length == 0 ? getDefaultFieldList() : escapedFields;
}

function getDefaultFieldList() : string[] 
{
    let fieldNames: string[] = [];

    //dear javascript, you suck and you should be ashamed.
    for(let key in fieldNamesDict)
    {
        fieldNames.push(fieldNamesDict[key])
    }
    return fieldNames;
}
/*


SELECT DISTINCT
    j.id,
    j.uuid wazeid,
    j.pub_utc_date,
    x as latitude,
    y as longitude,
    j.start_node,
    j.end_node,
    j.street,
    j.speed,
    j.speed_kmh,
    j.city,
    j.delay,
    j.length,
    j.turn_type,
    j.level,
    j.road_type,
    files.start_time_millis,
    files.end_time_millis,
    files.next_start_time_millis,
    files.next_end_time_millis,
    files.prev_start_time_millis,
    files.prev_end_time_millis
FROM
     waze.jams j
     INNER JOIN (
      SELECT
          df.id file_id,
          df.start_time_millis,
          df.end_time_millis,
          LAG(df.id,1) OVER( order by start_time_millis) as prev_file_id,
          LAG(df.start_time_millis,1) OVER( order by start_time_millis) as prev_start_time_millis,
          LAG(df.end_time_millis,1) OVER( order by start_time_millis) as prev_end_time_millis,
          LEAD(df.id,1) OVER( order by start_time_millis) as next_file_id,
          LEAD(df.start_time_millis,1) OVER( order by start_time_millis) as next_start_time_millis,
          LEAD(df.end_time_millis,1) OVER( order by start_time_millis) as next_end_time_millis

      FROM
           waze.data_files df
    ) files
    ON files.file_id = j.datafile_id,
     -- TODO: Figure out how to alias these as something a bit more descriptive
    jsonb_to_recordset(j.line) AS (x real, y real)
WHERE
    $1 BETWEEN files.start_time_millis AND files.end_time_millis
    AND y BETWEEN $2 AND $3
    AND x BETWEEN $4 AND $5;

*/