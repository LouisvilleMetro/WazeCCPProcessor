import queries = require("./queries");

export function GetEscapedFieldNames(queryObject : queries.GetJamsListQueryArgs) : string[]
{
    let fieldNamesDict : { [id: string] : string} = {
        "city": "jams.city",
        "delay" : "jams.delay",
        "end_node" : "jams.end_node",
        "id" : "jams.id",
        "latitude" : "coordinates.latitude",
        "length" : "jams.length",
        "level" : "jams.level",
        "longitude" : "coordinates.longitude",
        "pub_utc_date" : "jams.pub_utc_date",
        "road_type" : "jams.road_type",
        "speed" : "jams.speed",
        "speed_kmh" : "jams.speed_kmh",
        "start_node" : "jams.start_node",
        "street" : "jams.street",
        "turn_type" : "jams.turn_type",
        "uuid" : "jams.uuid",
    }

    let escapedFields: string[] = [];
    for(let field of queryObject.fieldNames)
    {
        field = field.toLowerCase();
        //if it's in our list of allowed field names and we don't 
        //already have it in our list of escaped field names, then add it.
        if(fieldNamesDict.hasOwnProperty(field) && escapedFields.indexOf(field) == -1)
        {
            escapedFields.push(field);
        }
    }

    return escapedFields.length == 0 ? this.fieldNames : escapedFields;
}

export class SqlAndParameterList
{
    sql : string;
    parameterList: any[];
}

export function BuildSqlAndParameterList(args : queries.GetJamsListQueryArgs) : SqlAndParameterList
{
    let sql = "SELECT ";

    if(args.countOnly === true)
    {
        sql += "COUNT(1)";
    }
    else
    {
        sql += GetEscapedFieldNames(args).join(",");
    }
    
    sql += " FROM waze.jams jams" +
    " INNER JOIN waze.coordinates coordinates" +
    " ON jams.id = coordinates.jam_id" +
    " WHERE " +
    " jams.pub_utc_date BETWEEN $1 AND $2" +
    " AND coordinates.latitude BETWEEN $3 AND $4" +
    " AND coodtinates.longitude BETWEEN $5 AND $6";

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


