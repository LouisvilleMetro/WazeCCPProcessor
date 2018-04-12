export class DataFile {
    id: number;
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
    id: number;
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
    irregularity_uuid: string;
    datafile_id: number;
}