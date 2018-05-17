export class getJamListRequestModel extends StandardListRequest<object> {
    
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
    levels: string;

    // setup private vars that we'll set as we deserialize
    private startDateTime: Date;
    private endDateTime: Date;

    deserialize(input: Object): object {
        throw new Error("Method not implemented.");
    }

    isValid(): boolean {
        //check that all of the required fields exist
        throw new Error("Method not implemented.");
    }
}