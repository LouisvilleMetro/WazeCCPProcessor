import { Point, JamWithLine } from "../../../shared-lib/src/entities";

export class JamModel {
    id: string;
    wazeId: string;
    jamStartTime: number;
    startLatitude: number;
    startLongitude: number;
    startNode: string;
    endNode: string;
    roadType: number;
    street: string;
    city: string;
    delay: number;
    speed: number;
    speedKMH: number;
    length: number;
    turnType: string;
    level: number;
    line: Point[];

    static fromArrayOfJamWithLine(array: JamWithLine[]): JamModel[]
    {
        let models = [];
        for(let entity of array)
        {
            models.push(JamModel.fromJamWithLine(entity));
        }
        return models;
    }

    static fromJamWithLine(entity: JamWithLine): JamModel
    {

        let model = new JamModel();
        if(entity.id)
        {
            model.id = entity.id;
        }
        if(entity.uuid)
        {
            model.wazeId = entity.uuid;
        }
        if(entity.pub_utc_date)
        {
            model.jamStartTime = entity.pub_millis;
        }
        if(entity.startLatitude)
        {
            model.startLatitude = entity.startLatitude;
        }
        if(entity.startLongitude)
        {
            model.startLongitude = entity.startLongitude;
        }
        if(entity.start_node)
        {
            model.startNode = entity.start_node;
        }
        if(entity.end_node)
        {
            model.endNode = entity.end_node;
        }
        if(entity.road_type)
        {
            model.roadType = entity.road_type;
        }
        if(entity.street)
        {
            model.street = entity.street;
        }
        if(entity.city)
        {
            model.city = entity.city;
        }
        if(entity.delay)
        {
            model.delay = parseInt(entity.delay);
        }
        if(entity.speed)
        {
            model.speed = parseFloat(entity.speed);
        }
        if(entity.speed_kmh)
        {
            model.speedKMH = parseFloat(entity.speed_kmh);
        }
        if(entity.length)
        {
            model.length = parseInt(entity.length);
        }
        if(entity.turn_type)
        {
            model.turnType = entity.turn_type;
        }
        if(entity.level)
        {
            model.level = entity.level;
        }
        if(entity.line)
        {
            model.line = entity.line;
        }

        return model;
    }
}




