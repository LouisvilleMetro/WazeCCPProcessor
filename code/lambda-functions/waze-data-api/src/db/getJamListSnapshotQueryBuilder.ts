import connectionPool = require('../../../shared-lib/src/connectionPool') 
import * as entities from '../../../shared-lib/src/entities'
import moment = require("moment");
import { getJamSnapshotRequestModel } from "../api-models/getJamSnapshotRequestModel";
import { QueryResult } from 'pg';
import { JamMappingSettings } from "./jamQueryResultMapper";

export class getJamListSnapshotQueryResult
{
    jams : entities.JamWithLine[];
    timeframeReturned: entities.Timeframe;
    nextTimeframe: entities.Timeframe;
    previousTimeframe: entities.Timeframe;
}

export function mapSnapshotResultFromDataFileQueryResult(dfResponse : QueryResult) : getJamListSnapshotQueryResult
{
    let result = new getJamListSnapshotQueryResult();
    result.jams = [];

    for(let row of dfResponse.rows)
    {
        if(!result.timeframeReturned)        
        {
            result.timeframeReturned = {
                startTimeMillis : <number>row.start_time_millis,
                endTimeMillis : <number>row.end_time_millis
            };
        }
        if(!result.nextTimeframe)
        {
            result.nextTimeframe = {
                startTimeMillis : <number>row.next_start_time_millis,
                endTimeMillis : <number>row.next_end_time_millis
            };
        }
        if(!result.previousTimeframe)
        {
            result.previousTimeframe = {
                startTimeMillis : <number>row.prev_start_time_millis,
                endTimeMillis : <number>row.prev_end_time_millis
            };
        }
        
    }

    return result;
}

export function buildDataFileSqlAndParameterList(args: getJamSnapshotRequestModel) : { sql:string, parameterList: any[] }
{
    let sql = "SELECT * FROM ("+
            " SELECT"+
                " df.id file_id,"+
                " df.start_time_millis,"+
                " df.end_time_millis"+
            " FROM"+
                " waze.data_files df"+
            " WHERE"+
                " $1 BETWEEN df.start_time_millis AND df.end_time_millis"+
            " ORDER BY"+
                " df.start_time_millis DESC"+
            " LIMIT 1"+
        " ) AS thisData"+
        " FULL OUTER JOIN ("+
            " SELECT"+
                " dfPrev.id prev_file_id,"+
                " dfPrev.start_time_millis prev_start_time_millis,"+
                " dfPrev.end_time_millis prev_start_time_millis"+
            " FROM"+
                " waze.data_files dfPrev"+
            " WHERE"+
                " dfPrev.end_time_millis < $1"+
            " ORDER BY"+
                " dfPrev.start_time_millis DESC"+
            " LIMIT 1"+
        " ) AS prevData ON 1=1"+
        " FULL OUTER JOIN ("+
            " SELECT"+
                " dfNext.id next_file_id,"+
                " dfNext.start_time_millis next_start_time_millis,"+
                " dfNext.end_time_millis next_end_time_millis"+
            " FROM"+
                " waze.data_files dfNext"+
            " WHERE"+
                " dfNext.start_time_millis > $1"+
            " ORDER BY"+
                " dfNext.start_time_millis ASC"+
            " LIMIT 1"+
        " ) AS nextData ON 1=1;";
    let parameters :any[] = [
        moment(args.getSnapshotDateTime()).utc().valueOf(), //make sure we have a millisecond timstamp
    ];
    return {sql, parameterList: parameters};
}

export function buildJamSqlAndParameterList(args: getJamSnapshotRequestModel, dataFileId : number)
    : { sql : string; parameterList: any[]; mappingSettings: JamMappingSettings  }
{
    let sql = "SELECT ";
    let escapedFields: string[] = [];

    if(args.countOnly === true)
    {
        sql += "COUNT(1) ";
    }
    else
    {
        escapedFields = getEscapedFieldNames(args);
        sql += escapedFields.join(",");
    }
    
    sql += " FROM waze.jams j"+
    " INNER JOIN ("+
        " SELECT"+
            " C.jam_id"+
        " FROM"+
            " waze.coordinates AS C"+
        " WHERE"+
            " C.longitude BETWEEN $2 AND $3"+
            " AND C.latitude BETWEEN $4 AND $5"+
        ") AS coords ON coords.jam_id = j.id"+
    " WHERE"+
    " j.datafile_id = $1"; 
    
    let parameters : any[] = [
        dataFileId,
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

    if(args.streetName)
    {
        //this has to be a like. case-sensitivity depends on collation.
        parameters.push("%" + args.streetName + "%");
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
        sql += " OFFSET " + parseInt(args.offset.toString());
    }

    console.debug("getJamListSnapshot Sql: %s", sql);
    console.debug("getJamListSnapshot Parameters: %j", parameters);

    return {
        sql : sql,
        parameterList : parameters,
        mappingSettings: new JamMappingSettings(
            (!args.countOnly && args.includeCoordinates),
            (!args.countOnly && escapedFields.indexOf(lineField) !== -1 ),
            (!args.countOnly && escapedFields.indexOf(lineField) !== -1 )
        )
    };
}

let fieldNamesDict : { [id: string] : string} = {
    //lat/long are in a json blob. they're always returned from the jams table
    "city": "j.city",
    "delay" : "j.delay",
    "end_node" : "j.end_node",
    "id" : "j.id",
    "length" : "j.length",
    "level" : "j.level",
    "pub_utc_date" : "j.pub_utc_date",
    "road_type" : "j.road_type",
    "speed" : "j.speed",
    "speed_kmh" : "j.speed_kmh",
    "start_node" : "j.start_node",
    "street" : "j.street",
    "turn_type" : "j.turn_type",
    "uuid" : "j.uuid",
}

let latitudeField = "latitude";
let longitudeField = "longitude";
let lineField = "line";

export function getEscapedFieldNames(queryArgs: getJamSnapshotRequestModel) : string[]
{
    let escapedFields: string[] = [];
    
    for(let field of queryArgs.fields || [])
    {
        field = field.toLowerCase();
        //if it's in our list of allowed field names and we don't 
        //already have it in our list of escaped field names, then add it.
        if(fieldNamesDict.hasOwnProperty(field) && escapedFields.indexOf(field) == -1)
        {
            escapedFields.push(fieldNamesDict[field]);
        }
        else if(field === latitudeField || field === longitudeField && escapedFields.indexOf(lineField) === -1)
        {
            escapedFields.push(lineField);
        }
    }
    //make sure we include the line field if they want it.
    if(queryArgs.includeCoordinates && escapedFields.indexOf(lineField) === -1)
    {
        escapedFields.push(lineField);
    }

    return escapedFields.length == 0 ? getDefaultFieldList() : escapedFields;
}

export function getDefaultFieldList() : string[] 
{
    let fieldNames: string[] = [];

    //dear javascript, you suck and you should be ashamed.
    for(let key in fieldNamesDict)
    {
        fieldNames.push(fieldNamesDict[key])
    }
    return fieldNames;
}
