// Type for x/y coords contained in alert.location, jam.line, etc
export interface coordinate {
    x: number;
    y: number;
}

// Type for jam objects from data file
export interface jam {
    uuid: string;
    pubMillis: number;
    startNode: string;
    endNode: string;
    roadType: number;
    street: string;
    city: string;
    country: string;
    delay: string;
    speed: string;
    speedKMH: string;
    length: string;
    turnType: string;
    level: number;
    blockingAlertUuid: string;
    line: Array<coordinate>;
    type: string;
    turnLine: Array<coordinate>;
}

// Type for alert objects from data file
export interface alert {
    uuid: string;
    pubMillis: number;
    roadType: number;
    location: coordinate;
    street: string;
    city: string;
    country: string;
    magvar: number;
    reliability: number;
    reportDescription: string;
    reportRating: number;
    confidence: number;
    type: string;
    subtype: string;
    reportByMunicipalityUser: boolean;
    nThumbsUp: number;
    jamUuid: string;
}

// type for irregularity objects from data file
//TODO: JRS 20180419 - review this once we actually see a file with one in it, just in case docs weren't accurate
export interface irregularity {
    id: string;
    detectionDate: string; //not sure about this one
    detectionDateMillis: number;
    updateDate: string; //not sure about this one
    updateDateMillis: number;
    line: Array<coordinate>;
    type: string;
    speed: number;
    regularSpeed: number;
    delaySeconds: number;
    seconds: number;
    length: number;
    trend: number;
    street: string;
    city: string;
    country: string;
    severity: number;
    jamLevel: number;
    driversCount: number;
    alertsCount: number;
}

// Type for the root data file
export interface dataFile {
    alerts: Array<alert>;
    jams: Array<jam>;
    irregularities: Array<irregularity>;
    startTimeMillis: number;
    endTimeMillis: number;
    startTime: string;
    endTime: string;
}

// Type for data file with our extra id, setup as an extension so that the base
// data file is easier to maintain and keep in sync with the waze spec
export interface dataFileWithInternalId extends dataFile {
    data_file_id?: number;
}