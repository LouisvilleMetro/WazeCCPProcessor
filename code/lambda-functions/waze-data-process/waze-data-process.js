const hash = require('object-hash');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const lambda = new AWS.Lambda();

//setup object hashing options once
const hashOpts = {
    unorderedArrays: true
};

exports.processDataFile = async (event, context, callback) => {
    try{
        //attempt to grab a record from the queue
        let sqsParams = {
            QueueUrl: process.env.SQSURL, /* required */
			MaxNumberOfMessages: 1, // we'll only do one at a time
			VisibilityTimeout: 330 // wait just a little longer than our 5 minute lambda timeout
        };
		let sqsResponse = await sqs.receiveMessage(sqsParams).promise();
        
        // make sure we got a record
        if(sqsResponse.Messages && sqsResponse.Messages.length > 0){
            let s3Key = getS3KeyFromMessage(data.Messages[0]);
            console.info("Retrieved S3 Key: %s", s3Key);

            // now need to read that file in
            let s3Params = {
                Bucket: process.env.WAZEDATAINCOMINGBUCKET,
                Key: s3Key,
            };
            let s3Response = await s3.getObject(s3Params).promise();
            
            //make sure we got something
            if(s3Response.Body){
                let fileData = JSON.parse(data.Body);

                //TODO: JRS 2018-04-04 - will likely need to save some file-level metadata first, waiting on PR #25 discussion to solidify
                    
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
                let promises = new Array();

                //now we can check if we have each one and send them off for processing
                if(alerts && alerts.length > 0){
                    
                    //add the alerts back to the object
                    fileData.alerts = alerts;
                    
                    //send it off to be processed
                    promises.push(invokeListProcessor(fileData, process.env.ALERTPROCESSORARN));
                    
                    //remove alerts from the object again
                    delete fileData.alerts;
                }

                if(jams && jams.length > 0){
                    
                    //add the jams back to the object
                    fileData.jams = jams;
                    
                    //send it off to be processed
                    promises.push(invokeListProcessor(fileData, process.env.JAMPROCESSORARN));
                    
                    //remove jams from the object again
                    delete fileData.jams;
                }

                if(irregularities && irregularities.length > 0){
                    
                    //add the irregularities back to the object
                    fileData.irregularities = irregularities;
                    
                    //send it off to be processed
                    promises.push(invokeListProcessor(fileData, process.env.IRREGULARITYPROCESSORARN));
                    
                    //remove irregularities from the object again
                    delete fileData.irregularities;
                }

				//wait for all of the promises to finish
				if(promises.length > 0){
					let promResult = await Promise.all(promises);
				}

				//TODO: JRS 2018-04-05 - if all processing completed, move file from inbound bucket to processed

				//TODO: JRS 2018-04-05 - if all processing completed, delete SQS message
            }
        }

        //nothing to return
        return;
    }
    catch (err) {
        console.log(err);
        return err;
    }
};

exports.processDataAlerts = async (event, context, callback) => {
	//TODO: JRS 2018-04-05 - IMPLEMENT THIS - NEEDS DB SCHEMA (PR #25)
	throw new Error('NOT IMPLEMENTED');
};

exports.processDataJams = async (event, context, callback) => {
	//TODO: JRS 2018-04-05 - IMPLEMENT THIS - NEEDS DB SCHEMA (PR #25)
	throw new Error('NOT IMPLEMENTED');
};

exports.processDataIrregularities = async (event, context, callback) => {
	//TODO: JRS 2018-04-05 - IMPLEMENT THIS - NEEDS DB SCHEMA (PR #25)
	throw new Error('NOT IMPLEMENTED');
};

// Read the S3 key from the retrieved SQS message
function getS3KeyFromMessage(message) {
    // the info we need is down in the Body, because it came in via SNS
    // parse the body into JSON and grab the Message param
    let snsMessage = JSON.parse(message.Body).Message;
    // parse the sns message into json and get the first record
    let rec = JSON.parse(snsMessage).Records[0]
    // now from that we can get down to the s3 key
    return rec.s3.object.key;
}

// Compute the hash of the given object using our standard options
function computeHash(object){
    return hash(object, hashOpts);
}

// Generate a unique id based on the timestamp from the data root and the specific object (the whole alert, jam, irregularity, etc)
function generateUniqueIdentifierHash(object, rootStartTime){
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
function invokeListProcessor(data, lambdaARN){
    return lambda.invoke({
        FunctionName: lambdaARN,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(data)        
    }).promise();
}