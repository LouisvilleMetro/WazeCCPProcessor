import connectionPool = require('../../../shared-lib/src/connectionPool') 
import util = require('util')
import * as entities from '../../../shared-lib/src/entities'
import getJamsListQueryBuilder = require("./getJamsListQueryBuilder");
import fs = require('fs');
import { getJamSnapshotRequestModel } from '../api-models/getJamSnapshotRequestModel';
import { getJamListRequestModel } from "../api-models/getJamListRequestModel";
import * as jamQueryResultMapper from "./jamQueryResultMapper";
import * as getJamsSnapshotQueryBuilder from "./getJamListSnapshotQueryBuilder";

export async function getJamsList(args: getJamListRequestModel): Promise<entities.JamWithLine[]>
{
    let query = getJamsListQueryBuilder.buildSqlAndParameterList(args);
    let result = await connectionPool.getPool().query(query.sql, query.parameterList);

    if(result.rowCount === 0){
        //nothing found
        return [];
    }
    return jamQueryResultMapper.toJamWithLine(result, query.mappingSettings);
}

export async function getJamListSnapshotQuery(queryArgs: getJamSnapshotRequestModel) : Promise<getJamsSnapshotQueryBuilder.getJamListSnapshotQueryResult>
{
    let dataFileQuery = getJamsSnapshotQueryBuilder.buildDataFileSqlAndParameterList(queryArgs);
    let dfResponse = await connectionPool.getPool().query(dataFileQuery.sql, dataFileQuery.parameterList);
    
    if(dfResponse.rowCount === 0){
        //nothing found, return ...what?
        return new getJamsSnapshotQueryBuilder.getJamListSnapshotQueryResult();
    }
    
    let getJamsListSnapshotResult = getJamsSnapshotQueryBuilder.mapSnapshotResultFromDataFileQueryResult(dfResponse);
    let row = dfResponse.rows[0];
    if(row.file_id)
    {
        let jamsQuery = getJamsSnapshotQueryBuilder.buildJamSqlAndParameterList(queryArgs, row.file_id);
        let jamsResponse = await connectionPool.getPool().query(jamsQuery.sql, jamsQuery.parameterList);
        getJamsListSnapshotResult.jams = jamQueryResultMapper.toJamWithLine(jamsResponse, jamsQuery.mappingSettings);
    }
    
    return getJamsListSnapshotResult;    
}



