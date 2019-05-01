import {JamModel} from "./jamModel";
import {JamWithLine} from "../../../shared-lib/src/entities";
import { JamQueryResult } from "../db/jamQueryResult";


export class getJamListResponseModel {
    resultCount: number;
    jams : JamModel[];
    startDate: number;
    endDate: number;
    
    static fromJamQueryResult(entity : JamQueryResult) : getJamListResponseModel
    {
        let model = new getJamListResponseModel();
        model.resultCount = entity.resultCount;
        model.startDate = entity.startDate;
        model.endDate = entity.endDate;
        if(entity.jams)
        {
            model.jams = JamModel.fromArrayOfJamWithLine(entity.jams);
        }
        return model;
    }
}