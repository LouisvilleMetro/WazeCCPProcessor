import AWS = require('aws-sdk');
import { Handler, Context, Callback } from 'aws-lambda';
import consolePatch from '../../shared-lib/src/consolePatch'
import { getJamSnapshotRequestModel } from './api-models/getJamSnapshotRequestModel';
import { customHttpError } from './utils/customError';
import { buildCorsResponse } from './utils/corsResponse';
import { getJamListSnapshotQuery } from "./db/getJamListSnapshotQuery";

// wrapper function for all the handlers that centralizes error handling and logging
function wrappedHandler(fn: Handler): Handler {
    return async function(event: any, context: Context, callback: Callback) {
        // patch the console
        consolePatch();

        try{
            //run the real handler
            return await fn(event, context, callback);
        }
        catch (err){
            //always log the error and the raw event
            console.log("%j", event); //log the error as json
            console.error(err);

            //if the error is of our custom type, we'll convert it to a legit "successful" response
            if(err instanceof customHttpError){
                //build a legit http response to send back
                let errResponse = buildCorsResponse(err.httpStatus, JSON.stringify(err));

                //call the callback "success" with our error response
                //trust me, works right with api gateway
                callback(null, errResponse);
            }
            else{
                //in this case, it was an otherwise unexpected exception
                //we'll simply respond with a 500
                let errResponse = buildCorsResponse(500, JSON.stringify({message: "An unexpected error has occurred."}));
                callback(null, errResponse);
            }
        }
    };
}


const getJamsList: Handler = async (event: any, context: Context, callback: Callback) => {
    try {
        //patch the console so we can get more searchable logging
        //would be nice to make this global, but couldn't quickly get that working
        consolePatch();

        throw new Error('Endpoint not yet implemented');        
    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
}

const getJamsSnapshot: Handler = wrappedHandler(async (event: any, context: Context, callback: Callback) => {

        //deserialize the request
        let request = new getJamSnapshotRequestModel(event);

        //see if it is valid
        //this will throw a custom http error if not valid
        request.validate();

        //we deserialized and validated, so now safe to got gather the data
        
        //HACK: for now just returning dummy data
        
        let dummyData: any = {
            "resultCount": 2,
            "timeframeReturned": {
                "startTime": 1532548140000,
                "endTime": 1532548200000
            },
            "nextTimeframe": {
                "startTime": 1532548260000,
                "endTime": 1532548320000
            },
            "previousTimeframe": {
                "startTime": 1532548020000,
                "endTime": 1532548080000
            },
            "jams": [
                {
                    "id": "f2247903b2fedecb1492a6b8a4831e9b64d6ff92",
                    "wazeId": 2027557879,
                    "jamStartTime": 1532547541160,
                    "startLatitude": 38.189907,
                    "startLongitude": -85.849556,
                    "startNode": null,
                    "endNode": "Rockford Ln",
                    "roadType": 6,
                    "street": "Cane Run Rd",
                    "city": "Louisville, KY",
                    "delay": 103,
                    "speed": 5.163888888888889,
                    "speedKMH": 18.59,
                    "length": 840,
                    "turnType": "NONE",
                    "level": 3,
                    "line": [{
                            "x": -85.849556,
                            "y": 38.189907
                        }, {
                            "x": -85.85018,
                            "y": 38.189205
                        }, {
                            "x": -85.851689,
                            "y": 38.187438
                        }, {
                            "x": -85.852256,
                            "y": 38.186821
                        }, {
                            "x": -85.853602,
                            "y": 38.185463
                        }, {
                            "x": -85.854642,
                            "y": 38.184456
                        }, {
                            "x": -85.855292,
                            "y": 38.183844
                        }
                    ]
                },
                {
                    "id": "a18c6ac1eb2064666ae1f430cbd1895c8c5ef7d8",
                    "wazeId": 2010112614,
                    "jamStartTime": 1532502223613,
                    "startLatitude": 38.237137,
                    "startLongitude": -85.629876,
                    "startNode": "St. Matthews",
                    "endNode": "St. Regis Park",
                    "roadType": 4,
                    "street": "Exit 12A: I-264 W / Watterson Expwy",
                    "city": null,
                    "delay": -1,
                    "speed": 0,
                    "speedKMH": 0,
                    "length": 435,
                    "turnType": "NONE",
                    "level": 5,
                    "line": [{
                            "x": -85.629876,
                            "y": 38.237137
                        }, {
                            "x": -85.629474,
                            "y": 38.237203
                        }, {
                            "x": -85.62795,
                            "y": 38.23761
                        }, {
                            "x": -85.627717,
                            "y": 38.237637
                        }, {
                            "x": -85.627313,
                            "y": 38.237614
                        }, {
                            "x": -85.627083,
                            "y": 38.237563
                        }, {
                            "x": -85.62688,
                            "y": 38.237493
                        }, {
                            "x": -85.626532,
                            "y": 38.237315
                        }, {
                            "x": -85.626349,
                            "y": 38.237171
                        }, {
                            "x": -85.626071,
                            "y": 38.236847
                        }, {
                            "x": -85.625807,
                            "y": 38.236356
                        }
                    ]
                }
            ]
        };

        let response = buildCorsResponse(200, JSON.stringify(dummyData));
        callback(null, response);

});


const getAlertsList: Handler = async (event: any, context: Context, callback: Callback) => {
    try {
        //patch the console so we can get more searchable logging
        //would be nice to make this global, but couldn't quickly get that working
        consolePatch();

        throw new Error('Endpoint not yet implemented');        
    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
}

const getIrregularitiesList: Handler = async (event: any, context: Context, callback: Callback) => {
    try {
        //patch the console so we can get more searchable logging
        //would be nice to make this global, but couldn't quickly get that working
        consolePatch();

        throw new Error('Endpoint not yet implemented');        
    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
}

const getJamDetail: Handler = async (event: any, context: Context, callback: Callback) => {
    try {
        //patch the console so we can get more searchable logging
        //would be nice to make this global, but couldn't quickly get that working
        consolePatch();

        throw new Error('Endpoint not yet implemented');        
    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
}

const getAlertDetail: Handler = async (event: any, context: Context, callback: Callback) => {
    try {
        //patch the console so we can get more searchable logging
        //would be nice to make this global, but couldn't quickly get that working
        consolePatch();

        throw new Error('Endpoint not yet implemented');        
    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
}

const getIrregularityDetail: Handler = async (event: any, context: Context, callback: Callback) => {
    try {
        //patch the console so we can get more searchable logging
        //would be nice to make this global, but couldn't quickly get that working
        consolePatch();

        throw new Error('Endpoint not yet implemented');        
    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
}

// export all the methods
export { getAlertsList, getAlertDetail, getIrregularitiesList, getIrregularityDetail, getJamsList, getJamsSnapshot, getJamDetail }