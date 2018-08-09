import * as entities from '../../../shared-lib/src/entities'

export class JamSnapshot extends entities.JamBase<entities.Point> {
    
}

export class GetJamsListSnapshotResult 
{
    jams : JamSnapshot[];
    timeframeReturned: entities.Timeframe;
    nextTimeframe: entities.Timeframe;
    previousTimeframe: entities.Timeframe;
}