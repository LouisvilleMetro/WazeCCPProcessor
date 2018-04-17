export class DataFile {
    //id is optional because it will be set on creation
    id?: number;
    start_time_millis: number;
    end_time_millis: number;
    start_time: Date;
    end_time: Date;
    date_created: Date;
    date_updated: Date;
    file_name: string;
    json_hash: string;
}

export class Alert {
    id: string;
    uuid: string;
    pub_millis: number;
    pub_utc_date: Date;
    road_type: number;
    location: string;
    street: string;
    city: string;
    country: string;
    magvar: number;
    reliability: number;
    report_description: string;
    report_rating: number;
    confidence: number;
    type: string;
    subtype: string;
    report_by_municipality_user: boolean;
    thumbs_up: number;
    jam_uuid: string;
    datafile_id: number;
}

export class Jam {
    id: string;
    uuid: string;
    pub_millis: number;
    pub_utc_date: Date;
    start_node: string;
    end_node: string;
    road_type: number;
    street: string;
    city: string;
    country: string;
    delay: string;
    speed: string;
    speed_kmh: string;
    length: string;
    turn_type: string;
    level: number;
    blocking_alert_id: string;
    line: string;
    type: string;
    datafile_id: number;
}

export class Coordinate {
    //id is optional because it will be set on creation
    id?: number;
    latitude: number;
    longitude: number;
    order: number;
    jam_id?: number;
    irregularity_id?: number;
    alert_id?: number;
}