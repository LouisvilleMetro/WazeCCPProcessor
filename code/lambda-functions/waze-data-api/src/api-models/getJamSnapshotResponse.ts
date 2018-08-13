import * as entities from '../../../shared-lib/src/entities'

export class getJamSnapshotResponse 
{
    jams : entities.JamWithLine[];
    timeframeReturned: entities.Timeframe;
    nextTimeframe: entities.Timeframe;
    previousTimeframe: entities.Timeframe;
}