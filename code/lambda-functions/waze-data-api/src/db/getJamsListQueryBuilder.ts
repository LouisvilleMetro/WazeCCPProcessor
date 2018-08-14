import queries = require("./queries");
import { getJamListRequestModel } from "../api-models/getJamListRequestModel";
import { QueryResult } from 'pg';
import * as entities from '../../../shared-lib/src/entities'
import { JamMappingSettings } from "./jamQueryResult";
import { JamFieldNames } from "./JamFieldNames";

export function buildSqlAndParameterList(args : getJamListRequestModel) 
    : { sql : string; parameterList: any[]; mappingSettings: JamMappingSettings  }
{
    let sql = "SELECT ";
    let jamFieldNames = new JamFieldNames(fieldNamesDict);
    let escapedFields = jamFieldNames.getEscapedFieldNames(args);

    if(args.countOnly === true)
    {
        sql += "COUNT(1) ";
    }
    else
    {   
        sql += escapedFields.dbFields.join(",");
    }
    
    sql += " FROM waze.jams jams" +
        " INNER JOIN "+
        " ( "+
            " SELECT C.jam_id "+
            " FROM waze.coordinates AS C "+
            " WHERE C.longitude "+
            " BETWEEN $3 AND $4 "+
            " AND C.latitude BETWEEN $5 AND $6) "+
        " AS coords ON coords.jam_id = jams.id "+
    " WHERE " +
    " jams.pub_utc_date BETWEEN $1 AND $2 ";
    

    let parameters : any[] = [
        args.getStartDateTime(), 
        args.getEndDateTime(),
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

    return {
        sql : sql,
        parameterList : parameters,
        mappingSettings: new JamMappingSettings(
            (!args.countOnly && args.includeCoordinates),
            (!args.countOnly && escapedFields.longitude),
            (!args.countOnly && escapedFields.latitude)
        )
    };

    
}

let fieldNamesDict : { [id: string] : string} = {
    "city": "jams.city",
    "delay" : "jams.delay",
    "end_node" : "jams.end_node",
    "id" : "jams.id",
    "length" : "jams.length",
    "level" : "jams.level",
    "jamStartTime" : "jams.pub_millis",
    "road_type" : "jams.road_type",
    "speed" : "jams.speed",
    "speed_kmh" : "jams.speed_kmh",
    "start_node" : "jams.start_node",
    "street" : "jams.street",
    "turn_type" : "jams.turn_type",
    "uuid" : "jams.uuid",
    
}

