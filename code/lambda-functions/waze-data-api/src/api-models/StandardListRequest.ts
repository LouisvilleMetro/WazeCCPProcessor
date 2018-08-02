import { APIGatewayProxyEvent } from "aws-lambda";
import { deserializeInteger, deserializeBoolean } from "../utils/serializationHelpers";

export abstract class StandardListRequest<T> implements ISerializable<T>, IValidatable {

    //every standard list request needs to implement these methods
    abstract deserialize(input: APIGatewayProxyEvent): void;
    abstract validate(): void;

    //constructor to simplify deserializing inbound events
    constructor(apiEvent: APIGatewayProxyEvent){
        // attempt to deserialize
        this.deserialize(apiEvent);
    }

    protected deserializationErrors = new Array<string>();
    protected validationErrors = new Array<string>();

    //every list request will have these fields
    /**
     * Number of results to return (1000 Max)
     */ 
    num: number;

    /**
     * Record number to start at when returning results
     */
    offset: number;

    /**
     * Only return the count, not the actual results
     */
    countOnly: boolean;

    /**
     * Which fields to return
     */
    fields: string[];

    /**
     * Which format to return results in
     */
    format: string;
    
    protected deserializeBase(input: APIGatewayProxyEvent): void{

        //make sure we got some params
        if(input.queryStringParameters == null){
            return;
        }

        deserializeInteger(input.queryStringParameters, 'num', 'num', this, this.deserializationErrors);
        deserializeInteger(input.queryStringParameters, 'offset', 'offset', this, this.deserializationErrors);
        deserializeBoolean(input.queryStringParameters, 'countOnly', 'countOnly', this, this.deserializationErrors);

        //set some defaults
        if(!this.num){
            this.num = 1000;
        }

        if(!this.offset){
            this.offset = 0;
        }

        this.countOnly = this.countOnly ? this.countOnly : false;

        //for fields, we'll just split it on commas and move on
        if(input.queryStringParameters['fields']) {
            this.fields = input.queryStringParameters['fields'].split(',');
        }

        if(input.queryStringParameters['format']){
            this.format = input.queryStringParameters['format'];
        }
    }

    protected validateBase(): void{
        //format is required
        if(!this.format){
            this.validationErrors.push("The field 'format' is required");
        }

        //HACK: temp error for json being the only format
        if(this.format != 'json'){
            this.validationErrors.push("The field 'format' currently only supports 'json', but more will be coming soon!");
        }

        //make sure num and offset are in acceptable ranges
        if(this.num < 1 || this.num > 1000){
            this.validationErrors.push("The field 'num' must be between 1 and 1000");
        }

        if(this.offset<0){
            this.validationErrors.push("The field 'offset' must be greater than or equal to 0");
        }
    }

}