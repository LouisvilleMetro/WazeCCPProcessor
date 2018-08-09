import AWS = require('aws-sdk');
import { Handler, Context, Callback } from 'aws-lambda';
import consolePatch from '../../shared-lib/src/consolePatch'
import { getJamSnapshotRequestModel } from './api-models/getJamSnapshotRequestModel';
import { customHttpError } from './utils/customError';
import { buildCorsResponse } from './utils/corsResponse';
import * as queries from "./db/queries";

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
        let data = await queries.getJamListSnapshotQuery(request);
        
        let response = buildCorsResponse(200, JSON.stringify(data));
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