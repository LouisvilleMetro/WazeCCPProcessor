import { IJamRequestModel } from "../api-models/IJamRequestModel";

export class JamFieldNames {
    constructor( 
        public fieldNamesDict: { [id: string] : string},
        private latitudeField : string = "startlatitude",
        private longitudeField : string = "startlongitude",
        private lineField : string = "line"
     )
    {

    }
    

    public getEscapedFieldNames(requestModel : IJamRequestModel) : { dbFields: string[], latitude: boolean, longitude: boolean }
    {
        let escapedFields: string[] = [];
        let latitude: boolean;
        let longitude: boolean;

        for(let field of requestModel.fields || [])
        {
            field = field.toLowerCase();
            //if it's in our list of allowed field names and we don't 
            //already have it in our list of escaped field names, then add it.
            if(this.fieldNamesDict.hasOwnProperty(field) && escapedFields.indexOf(field) === -1)
            {
                escapedFields.push(this.fieldNamesDict[field]);
            }
            else if(field === this.latitudeField)
            {
                latitude = true;
                if(escapedFields.indexOf(this.lineField) === -1)
                {
                    escapedFields.push(this.lineField);
                }
            }
            else if(field === this.longitudeField)
            {
                longitude = true;
                if(escapedFields.indexOf(this.lineField) === -1)
                {
                    escapedFields.push(this.lineField);
                }
            }

        }

        //make sure we include the line field if they want it.
        if(requestModel.includeCoordinates && escapedFields.indexOf(this.lineField) === -1)
        {
            escapedFields.push(this.lineField);
        }
        return escapedFields.length == 0 ? this.getDefaultFieldList() : { dbFields: escapedFields, latitude: latitude, longitude: longitude };
    }

    getDefaultFieldList() : { dbFields: string[], latitude: boolean, longitude: boolean }
    {
        let fieldNames: string[] = [];
        //dear javascript, you suck and you should be ashamed.
        for(let key in this.fieldNamesDict)
        {
            fieldNames.push(this.fieldNamesDict[key])
        }
        fieldNames.push(this.lineField);
        return { dbFields: fieldNames, latitude: true, longitude: true };
    }
}



