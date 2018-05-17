abstract class StandardListRequest<T> implements ISerializable<T>, IValid {
    
    //every standard list request needs to implement these methods
    abstract deserialize(input: Object): T;
    abstract isValid(): boolean;

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
    fields: string;

    /**
     * Which format to return results in
     */
    format: string;
}