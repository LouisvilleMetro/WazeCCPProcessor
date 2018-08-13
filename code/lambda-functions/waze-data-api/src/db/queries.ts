import connectionPool = require('../../../shared-lib/src/connectionPool') 
import util = require('util')
import * as entities from '../../../shared-lib/src/entities'
import getJamsListQueryBuilder = require("./getJamsListQueryBuilder");
import fs = require('fs');
import { getJamSnapshotRequestModel } from '../api-models/getJamSnapshotRequestModel';
import * as getJamsSnapshotQueryBuilder from "./getJamListSnapshotQueryBuilder";
import { GetJamsListSnapshotResult } from "../api-models/getJamSnapshotResponse";

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

export async function getJamListSnapshotQuery(queryArgs: getJamSnapshotRequestModel) : Promise<GetJamsListSnapshotResult>
{
    let dataFileQuery = getJamsSnapshotQueryBuilder.buildDataFileSqlAndParameterList(queryArgs);
    let dfResponse = await connectionPool.getPool().query(dataFileQuery.sql, dataFileQuery.parameterList);
    
    if(dfResponse.rowCount === 0){
        //nothing found, return null?
        return null;
    }
    
    let getJamsListSnapshotResult = getJamsSnapshotQueryBuilder.mapSnapshotResultFromDataFileQueryResult(dfResponse);
    let row = dfResponse.rows[0];
    if(row.file_id)
    {
        let jamsQuery = getJamsSnapshotQueryBuilder.buildJamSqlAndParameterList(queryArgs, row.file_id);
        let jamsResponse = await connectionPool.getPool().query(jamsQuery.sql, jamsQuery.parameterList);
        getJamsListSnapshotResult.jams = getJamsSnapshotQueryBuilder.mapJamsFromJamQueryResult(jamsResponse);
    }
    
    return getJamsListSnapshotResult;    
}



