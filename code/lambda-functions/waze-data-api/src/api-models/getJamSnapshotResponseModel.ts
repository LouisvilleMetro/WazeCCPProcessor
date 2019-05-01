import {JamModel} from "./jamModel";
import {Timeframe, JamWithLine} from "../../../shared-lib/src/entities";
import {getJamListSnapshotQueryResult} from "../db/getJamListSnapshotQueryBuilder";


export class getJamSnapshotResponseModel 
{
    jams? : JamModel[];
    timeframeReturned: Timeframe;
    nextTimeframe: Timeframe;
    previousTimeframe: Timeframe;
    resultCount: number;
    static fromJamListSnapshotQueryResult(queryResult : getJamListSnapshotQueryResult): getJamSnapshotResponseModel
    {
        let model : getJamSnapshotResponseModel = {
            timeframeReturned : queryResult.timeframeReturned,
            previousTimeframe : queryResult.previousTimeframe,
            nextTimeframe : queryResult.nextTimeframe,
            resultCount: queryResult.resultCount,
            
        };

        if(queryResult.jams)
        {
            model.jams = [];
            for(let jam of queryResult.jams)
            {
                model.jams.push(JamModel.fromJamWithLine(jam));
            }
        }
        
        return model;
    }
}