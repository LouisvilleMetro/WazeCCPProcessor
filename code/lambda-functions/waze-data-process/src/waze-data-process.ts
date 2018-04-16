import hash = require('object-hash');
import AWS = require('aws-sdk');
import moment = require('moment');
import { Handler, Context, Callback } from 'aws-lambda';
import * as entities from './entities';
import * as db from './db';
import util = require('util');
import { PromiseResult } from 'aws-sdk/lib/request';

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const lambda = new AWS.Lambda();

//setup object hashing options once
const hashOpts = {
    unorderedArrays: true
};

const processDataFile: Handler = async (event: any, context: Context, callback: Callback) => {
    try{
        //attempt to grab a record from the queue
        let sqsParams: AWS.SQS.ReceiveMessageRequest = {
            QueueUrl: process.env.SQSURL, /* required */
			MaxNumberOfMessages: 1, // we'll only do one at a time
			VisibilityTimeout: 330 // wait just a little longer than our 5 minute lambda timeout
        };
		let sqsResponse = await sqs.receiveMessage(sqsParams).promise();
        
        // make sure we got a record
        if(sqsResponse.Messages && sqsResponse.Messages.length > 0){
            let s3Key = getS3KeyFromMessage(sqsResponse.Messages[0]);
            console.info("Retrieved S3 Key: %s", s3Key);

            // now need to read that file in
            let s3Params: AWS.S3.GetObjectRequest = {
                Bucket: process.env.WAZEDATAINCOMINGBUCKET,
                Key: s3Key,
            };
            let s3Response = await s3.getObject(s3Params).promise();
            
            //make sure we got something
            if(s3Response.Body){
                let fileData = JSON.parse(s3Response.Body.toString());

                //first need to see if we've seen this file before or not, based on hash
                //be sure to only compute the hash once, to save on processing
                let jsonHash = computeHash(fileData);
                let data_file = await db.getDataFilesByHashQuery(jsonHash);

                //if we got something, we need to check more stuff before updating anything
                if(data_file){
                    //see if the file name has changed, and if so throw an error
                    if(data_file.file_name !== s3Key){
                        throw new Error(util.format("Found existing record for hash '%s' with file name '%s' (id: %d)", jsonHash, data_file.file_name, data_file.id));
                    }

                    console.info(util.format('Updating data_file id: %d', data_file.id));

                    //no change to the name, so the only thing we need to do is update the date_updated field
                    await db.updateDataFileUpdateDateByIdCommand(data_file.id);
                }
                else{
                    //we didn't get a record, so we need to save one
                    //build up the object we'll (potentially) be inserting into the DB 
                    data_file = new entities.DataFile();
                    data_file.start_time_millis = fileData.startTimeMillis;
                    data_file.end_time_millis = fileData.endTimeMillis;
                    data_file.start_time = moment.utc(fileData.startTimeMillis).toDate();
                    data_file.end_time = moment.utc(fileData.endTimeMillis).toDate();
                    data_file.file_name = s3Key;
                    data_file.json_hash = jsonHash;

                    console.info(util.format('Creating data_file: %s', s3Key));

                    data_file = await db.insertDataFileCommand(data_file);
                    
                }

                //split out each of the groups and send them off to their own parallel lambdas
                //it would be nice to also keep the root-level data intact, so we'll perform some trickery...
                
                //first get all 3 sets
                let alerts = fileData.alerts;
                let jams = fileData.jams;
                let irregularities = fileData.irregularities;
                
                //now delete all 3 from the root
                delete fileData.alerts;
                delete fileData.jams;
                delete fileData.irregularities;
                
                //we'll need to keep track of the promises to process
                let promises = new Array<Promise<PromiseResult<AWS.Lambda.InvocationResponse, AWS.AWSError>>>();

                //now we can check if we have each one and send them off for processing
                if(alerts && alerts.length > 0){
                    
                    //add the alerts back to the object
                    fileData.alerts = alerts;
                    
                    console.info(util.format('Invoking alert processor with %d alerts', alerts.length));

                    //send it off to be processed
                    promises.push(invokeListProcessor(fileData, process.env.ALERTPROCESSORARN));
                    
                    //remove alerts from the object again
                    delete fileData.alerts;
                }

                if(jams && jams.length > 0){
                    
                    //add the jams back to the object
                    fileData.jams = jams;

                    console.info(util.format('Invoking jam processor with %d jams', jams.length));
                    
                    //send it off to be processed
                    promises.push(invokeListProcessor(fileData, process.env.JAMPROCESSORARN));
                    
                    //remove jams from the object again
                    delete fileData.jams;
                }

                if(irregularities && irregularities.length > 0){
                    
                    //add the irregularities back to the object
                    fileData.irregularities = irregularities;

                    console.info(util.format('Invoking irregularity processor with %d irregularities', irregularities.length));
                    
                    //send it off to be processed
                    promises.push(invokeListProcessor(fileData, process.env.IRREGULARITYPROCESSORARN));
                    
                    //remove irregularities from the object again
                    delete fileData.irregularities;
                }

				//wait for all of the promises to finish
				if(promises.length > 0){
                    let promResult = await Promise.all(promises);
                    let wereAllSuccessful = promResult.every(res => {
                        //make sure we got a 200 and either have no FunctionError or an empty one
                        return res.StatusCode == 200 && (!res.FunctionError || res.FunctionError.length == 0);
                    })

                    //if they were NOT all successful, log an error with the whole response
                    //most likely the individual processor that failed will have more info logged, 
                    //but this will at least get us *something* just in case
                    if(!wereAllSuccessful) {
                        console.error(promResult);
                        callback(new Error('Error processing alerts/jams/irregularities, review logs for more info'));
                        return;
                    }

                    //we got here, so everything appears to have processed successfully

                    //if all processing completed, move file from inbound bucket to processed
                    let copyObjParams: AWS.S3.CopyObjectRequest = {
                        Bucket: process.env.WAZEDATAPROCESSEDBUCKET,
                        Key: s3Key,
                        CopySource: util.format('/%s/%s', process.env.WAZEDATAINCOMINGBUCKET, s3Key)
                    }
                    let s3CopyResponse = await s3.copyObject(copyObjParams).promise();
                    
                    //make sure the copy didn't fail without throwing an error
                    if(!s3CopyResponse.CopyObjectResult){
                        console.error(s3CopyResponse);
                        callback(new Error('Error copying object to processed bucket: ' + s3Key));
                        return;
                    }

                    //now we can delete the file from the incoming bucket
                    let deleteObjParams: AWS.S3.DeleteObjectRequest = {
                        Bucket: process.env.WAZEDATAINCOMINGBUCKET,
                        Key: s3Key
                    }
                    await s3.deleteObject(deleteObjParams).promise();

				    //if all processing completed, delete SQS message
                    let deleteSqsParams: AWS.SQS.DeleteMessageRequest = {
                        QueueUrl: process.env.SQSURL,
                        ReceiptHandle: sqsResponse.Messages[0].ReceiptHandle
                    }
                    await sqs.deleteMessage(deleteSqsParams).promise();
				}
            }
        }

        //nothing to return
        return;
    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
};

const processDataAlerts: Handler = async (event: any, context: Context, callback: Callback) => {
    //TODO: JRS 2018-04-05 - IMPLEMENT THIS - NEEDS DB SCHEMA (PR #25)
    try{
        throw new Error('NOT IMPLEMENTED');
    }
	catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
};

const processDataJams: Handler = async (event: any, context: Context, callback: Callback) => {
	//TODO: JRS 2018-04-05 - IMPLEMENT THIS - NEEDS DB SCHEMA (PR #25)
	try{
        throw new Error('NOT IMPLEMENTED');
    }
	catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
};

const processDataIrregularities: Handler = async (event: any, context: Context, callback: Callback) => {
	//TODO: JRS 2018-04-05 - IMPLEMENT THIS - NEEDS DB SCHEMA (PR #25)
	try{
        throw new Error('NOT IMPLEMENTED');
    }
	catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
};

// Read the S3 key from the retrieved SQS message
function getS3KeyFromMessage(message:AWS.SQS.Message): string {
    // the info we need is down in the Body, because it came in via SNS
    // parse the body into JSON and grab the Message param
    let snsMessage = JSON.parse(message.Body).Message;
    // parse the sns message into json and get the first record
    let rec = JSON.parse(snsMessage).Records[0]
    // now from that we can get down to the s3 key
    return rec.s3.object.key;
}

// Compute the hash of the given object using our standard options
function computeHash(object:Object): string {
    return hash(object, hashOpts);
}

// Generate a unique id based on the timestamp from the data root and the specific object (the whole alert, jam, irregularity, etc)
function generateUniqueIdentifierHash(object:Object, rootStartTime:number): string {
    //hash the object first
    let objHash = computeHash(object);
    //combine that hash with the timestamp
    let combinedObject = {
        rootTime: rootStartTime,
        originalObjectHash: objHash
    };
    //hash the combined data and return it
    return computeHash(combinedObject);
}

// trigger an invocation of one of the list processor lambdas
function invokeListProcessor(data:Object, lambdaARN:string){
    return lambda.invoke({
        FunctionName: lambdaARN,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(data)        
    }).promise();
}

export {processDataFile, processDataAlerts, processDataJams, processDataIrregularities}