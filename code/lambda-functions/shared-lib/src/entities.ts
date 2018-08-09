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

export abstract class JamBase<TLine> {
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
    line: TLine;
    type: string;
    turn_line: string;
    datafile_id: number;
}

export class Jam extends JamBase<string> {
    
}

export class Point  {
    x: number;
    y: number;
}

export class Timeframe {
    startTimeMillis: number;
    endTimeMillis: number;
}

export class Irregularity {
    id: string;
    uuid: string;
    detection_date_millis: number;
    detection_date: string;
    detection_utc_date: Date;
    update_date_millis: number;
    update_date: string;
    update_utc_date: Date;
    street: string;
    city: string;
    country: string;
    is_highway: boolean;
    speed: number;
    regular_speed: number;
    delay_seconds: number;
    seconds: number;
    length: number;
    trend: number;
    type: string;
    severity: number;
    jam_level: number;
    drivers_count: number;
    alerts_count: number;
    n_thumbs_up: number;
    n_comments: number;
    n_images: number;
    line: string;
    datafile_id: number;
    cause_type: string;
    start_node: string;
    end_node: string;
}

export class Coordinate {
    id: string;
    latitude: number;
    longitude: number;
    order: number;
    jam_id?: string;
    irregularity_id?: string;
    alert_id?: string;
    coordinate_type_id: number;
}

export const enum CoordinateType {
    Line = 1,
    TurnLine = 2,
    Location = 3,
}