import connectionPool = require('../../../shared-lib/src/connectionPool') 
import util = require('util')
import * as entities from '../../../shared-lib/src/entities'
import getJamsListQueryBuilder = require("./getJamsListQueryBuilder");
import fs = require('fs');
import { getJamSnapshotRequestModel } from '../api-models/getJamSnapshotRequestModel';
import { getJamListRequestModel } from "../api-models/getJamListRequestModel";
import * as jamQueryResultMapper from "./jamQueryResultMapper";
import * as getJamsSnapshotQueryBuilder from "./getJamListSnapshotQueryBuilder";
import { getJamSnapshotResponse } from "../api-models/getJamSnapshotResponse";



export async function getJamsList(args: getJamListRequestModel): Promise<entities.JamWithLine[]>
{
    let query = getJamsListQueryBuilder.BuildSqlAndParameterList(args);
    let result = await connectionPool.getPool().query(query.sql, query.parameterList);

    if(result.rowCount === 0){
        //nothing found, return null
        return null;
    }
    return jamQueryResultMapper.toJamWithLine(result, args.includeCoordinates);
}

export async function getJamListSnapshotQuery(queryArgs: getJamSnapshotRequestModel) : Promise<getJamSnapshotResponse>
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
        getJamsListSnapshotResult.jams = jamQueryResultMapper.toJamWithLine(jamsResponse, queryArgs.includeCoordinates);
    }
    
    return getJamsListSnapshotResult;    
}



