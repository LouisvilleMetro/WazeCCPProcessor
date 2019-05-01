import connectionPool = require('../../../shared-lib/src/connectionPool')
import util = require('util')
import * as entities from '../../../shared-lib/src/entities'
import getJamsListQueryBuilder = require("./getJamsListQueryBuilder");
import fs = require('fs');
import { getJamSnapshotRequestModel } from '../api-models/getJamSnapshotRequestModel';
import { getJamListRequestModel } from "../api-models/getJamListRequestModel";
import {JamMappingSettings, JamQueryResult} from "./jamQueryResult";
import * as getJamsSnapshotQueryBuilder from "./getJamListSnapshotQueryBuilder";
import { QueryResult } from 'pg';

export async function getJamsList(requestModel: getJamListRequestModel): Promise<JamQueryResult>
{
    let query = getJamsListQueryBuilder.buildSqlAndParameterList(requestModel);
    let result = await connectionPool.getPool().query(query.sql, query.parameterList);
    return JamQueryResult.fromQueryResponse(result, query.mappingSettings, requestModel);
}

export async function getJamListSnapshotQuery(requestModel: getJamSnapshotRequestModel) : Promise<getJamsSnapshotQueryBuilder.getJamListSnapshotQueryResult>
{
    let dataFileQuery = getJamsSnapshotQueryBuilder.buildDataFileSqlAndParameterList(requestModel);
    let dataFileResponse = await connectionPool.getPool().query(dataFileQuery.sql, dataFileQuery.parameterList);

    if(dataFileResponse.rowCount === 0){
        //nothing found, return ...what?
        return new getJamsSnapshotQueryBuilder.getJamListSnapshotQueryResult();
    }

    let getJamsListSnapshotResult = getJamsSnapshotQueryBuilder.mapSnapshotResultFromDataFileQueryResult(dataFileResponse);

    let row = dataFileResponse.rows[0];
    if(row.file_id)
    {
        let jamsQuery = getJamsSnapshotQueryBuilder.buildJamSqlAndParameterList(requestModel, row.file_id);
        let jamsResponse = await connectionPool.getPool().query(jamsQuery.sql, jamsQuery.parameterList);
        let jamResult = JamQueryResult.fromQueryResponse(jamsResponse, jamsQuery.mappingSettings, requestModel);
        if(!requestModel.countOnly)
        {
            getJamsListSnapshotResult.jams = jamResult.jams;
        }
        getJamsListSnapshotResult.resultCount = jamResult.resultCount;
    }

    return getJamsListSnapshotResult;
}



