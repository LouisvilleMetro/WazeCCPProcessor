import connectionPool = require('../../../shared-src/connectionPool') 
import util = require('util')
import * as entities from '../../../shared-src/entities'
import getJamsListQueryBuilder = require("./getJamsListQueryBuilder");
import fs = require('fs');

export class GetJamsListQueryArgs {
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

export async function GetJamsList(args: GetJamsListQueryArgs): Promise<entities.Jam[]>
{
    var query = getJamsListQueryBuilder.BuildSqlAndParameterList(args);
    let result = await connectionPool.getPool().query(query.sql, query.parameterList);

    if(result.rowCount === 0){
        //nothing found, return null
        return null;
    }
    
    throw new Error("This method is not implemented.");
    
}


