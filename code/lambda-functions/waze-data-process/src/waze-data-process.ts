import hash = require('object-hash');
import AWS = require('aws-sdk');
import moment = require('moment');
import { Handler, Context, Callback, ScheduledEvent } from 'aws-lambda';
import * as entities from './entities';
import * as wazeTypes from './waze-types';
import * as db from './db';
import util = require('util');
import { PromiseResult } from 'aws-sdk/lib/request';
import throttle = require('promise-parallel-throttle')
import consolePatch from './consolePatch'

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const lambda = new AWS.Lambda();
const sns = new AWS.SNS();

const throttleOpts: throttle.Options = {
    failFast: true,
    maxInProgress: parseInt(process.env.POOLSIZE)
}

//setup object hashing options once
const hashOpts = {
    unorderedArrays: true
};

const processDataFile: Handler = async (event: any, context: Context, callback: Callback) => {
    try {
        //patch the console so we can get more searchable logging
        //would be nice to make this global, but couldn't quickly get that working
        consolePatch();

        //we'll loop and process as long as there are records and the queue 
        //and there is twice as much time left as the max loop time
        let isQueueDrained = false;
        let maxLoopTimeInMillis = 0;

        //keep this lambda alive and processing items from the queue as long as the time remaining
        //minus a 10 second buffer is greater than double the max iteration run time
        while (context.getRemainingTimeInMillis() - 10000 > maxLoopTimeInMillis * 2) {
            console.info('Continuing - Function time remaining: %d, Max iteration time: %d', context.getRemainingTimeInMillis(), maxLoopTimeInMillis);
            //"start" a timer for this iteration
            let loopStart = process.hrtime();

            //attempt to grab a record from the queue
            let sqsParams: AWS.SQS.ReceiveMessageRequest = {
                QueueUrl: process.env.SQSURL, /* required */
                MaxNumberOfMessages: 1, // we'll only do one at a time
                VisibilityTimeout: 330 // wait just a little longer than our 5 minute lambda timeout
            };
            let sqsResponse = await sqs.receiveMessage(sqsParams).promise();

            // make sure we got a record
            if (!sqsResponse.Messages || sqsResponse.Messages.length == 0) {
                //got no response, so set the flag and exit the loop
                isQueueDrained = true;
                break;
            }
            else {
                let s3Key = getS3KeyFromMessage(sqsResponse.Messages[0]);
                console.info("Retrieved S3 Key: %s", s3Key);

                // now need to read that file in
                let s3Params: AWS.S3.GetObjectRequest = {
                    Bucket: process.env.WAZEDATAINCOMINGBUCKET,
                    Key: s3Key,
                };
                let s3Response = await s3.getObject(s3Params).promise();

                //make sure we got something
                if (s3Response.Body) {
                    let fileData: wazeTypes.dataFileWithInternalId = JSON.parse(s3Response.Body.toString());

                    //first need to see if we've seen this file before or not, based on hash
                    //be sure to only compute the hash once, to save on processing
                    let jsonHash = computeHash(fileData);
                    let data_file = await db.getDataFilesByHashQuery(jsonHash);

                    //if we got something, we need to check more stuff before updating anything
                    if (data_file) {
                        //see if the file name has changed, and if so throw an error
                        if (data_file.file_name !== s3Key) {
                            throw new Error(util.format("Found existing record for hash '%s' with file name '%s' (id: %d)", jsonHash, data_file.file_name, data_file.id));
                        }

                        console.info(util.format('Updating data_file id: %d', data_file.id));

                        //no change to the name, so the only thing we need to do is update the date_updated field
                        await db.updateDataFileUpdateDateByIdCommand(data_file.id);
                    }
                    else {
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

                    //now that we for sure have a data_file record in the DB, we'll need to pass the id on to everything else
                    fileData.data_file_id = data_file.id;

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
                    if (alerts && alerts.length > 0) {

                        //add the alerts back to the object
                        fileData.alerts = alerts;

                        console.info(util.format('Invoking alert processor with %d alerts', alerts.length));

                        //send it off to be processed
                        promises.push(invokeListProcessor(fileData, process.env.ALERTPROCESSORARN));

                        //remove alerts from the object again
                        delete fileData.alerts;
                    }

                    if (jams && jams.length > 0) {

                        //add the jams back to the object
                        fileData.jams = jams;

                        console.info(util.format('Invoking jam processor with %d jams', jams.length));

                        //send it off to be processed
                        promises.push(invokeListProcessor(fileData, process.env.JAMPROCESSORARN));

                        //remove jams from the object again
                        delete fileData.jams;
                    }

                    if (irregularities && irregularities.length > 0) {

                        //add the irregularities back to the object
                        fileData.irregularities = irregularities;

                        console.info(util.format('Invoking irregularity processor with %d irregularities', irregularities.length));

                        //send it off to be processed
                        promises.push(invokeListProcessor(fileData, process.env.IRREGULARITYPROCESSORARN));

                        //remove irregularities from the object again
                        delete fileData.irregularities;
                    }

                    //wait for all of the promises to finish
                    if (promises.length > 0) {
                        let promResult = await Promise.all(promises);
                        let wereAllSuccessful = promResult.every(res => {
                            //make sure we got a 200 and either have no FunctionError or an empty one
                            return res.StatusCode == 200 && (!res.FunctionError || res.FunctionError.length == 0);
                        })

                        //if they were NOT all successful, log an error with the whole response
                        //most likely the individual processor that failed will have more info logged, 
                        //but this will at least get us *something* just in case
                        if (!wereAllSuccessful) {
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
                        if (!s3CopyResponse.CopyObjectResult) {
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

                        //send a message to the SNS topic if enabled
                        if (process.env.SNSTOPIC && process.env.SNSTOPIC.length > 0) {
                            await publishSnsMessage('Successfully processed ' + s3Key, process.env.SNSTOPIC);
                        }

                    }
                }
            }

            //"stop" the timer
            let loopEnd = process.hrtime(loopStart);
            //convert loopend to milliseconds
            let loopTimeInMillis = (loopEnd["0"] * 1000) + (loopEnd["1"] / 1e6);
            //if this run was longer than the max, set a new max
            if (loopTimeInMillis > maxLoopTimeInMillis) {
                maxLoopTimeInMillis = loopTimeInMillis
            }
        }

        //if the queue is not drained, send a message to the SNS topic that retriggers this lambda
        if (!isQueueDrained) {
            //there's more in the queue, but we're low on time, so let's retrigger using sns
            await publishSnsMessage('Triggering self to continue work', process.env.RETRIGGERSNSTOPIC);
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

const processDataAlerts: Handler = async (event: wazeTypes.dataFileWithInternalId, context: Context, callback: Callback) => {
    try {
        //patch the console so we can get more searchable logging
        //would be nice to make this global, but couldn't quickly get that working
        consolePatch();

        //the event we get will actually already be JSON parsed into an object, no need to parse manually

        //get the startTimeMillis from the root of the file so we can use it later in our hashing 
        let rootStart = event.startTimeMillis;

        //also grab the data_file_id
        let data_file_id = event.data_file_id;

        //create a list of tasks to process alerts _asynchronously_
        let taskList = event.alerts.map((alert: wazeTypes.alert) => async () => {
            //hash the whole alert along with the rootStart to get a unique id
            let alertHash = generateAJIUniqueIdentifierHash(alert, rootStart);

            //build an alert object
            let alertEntity: entities.Alert = {
                id: alertHash,
                uuid: alert.uuid,
                pub_millis: alert.pubMillis,
                pub_utc_date: moment.utc(alert.pubMillis).toDate(),
                road_type: alert.roadType,
                location: JSON.stringify(alert.location),
                street: alert.street,
                city: alert.city,
                country: alert.country,
                magvar: alert.magvar,
                reliability: alert.reliability,
                report_description: alert.reportDescription,
                report_rating: alert.reportRating,
                confidence: alert.confidence,
                type: alert.type,
                subtype: alert.subtype,
                report_by_municipality_user: alert.reportByMunicipalityUser,
                thumbs_up: alert.nThumbsUp,
                jam_uuid: alert.jamUuid,
                datafile_id: data_file_id, 
                dayofweek: null
            }

            // process dependent fields
            alertEntity.dayofweek = alertEntity.pub_utc_date.getDay();             

            //upsert the alert
            await db.upsertAlertCommand(alertEntity);            

            // process geometry fields
            await db.updateAlertGeometry(alertEntity.id);

            //add the individual coordinate record from the location field
            //alerts only have 1 of these, in the location object
            if (alert.location) {
                let coord: entities.Coordinate = {
                    id: generateCoordinateUniqueIdentifierHash(alert.location, entities.CoordinateType.Location, alertHash, null, null),
                    alert_id: alertHash,
                    coordinate_type_id: entities.CoordinateType.Location,
                    latitude: alert.location.y,
                    longitude: alert.location.x,
                    order: 1
                }

                await db.upsertCoordinateCommand(coord);
            }
        });
        //run the tasks in a throttled fashion
        await throttle.all(taskList, throttleOpts);
    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
};

const processDataJams: Handler = async (event: wazeTypes.dataFileWithInternalId, context: Context, callback: Callback) => {
    try {
        //patch the console so we can get more searchable logging
        //would be nice to make this global, but couldn't quickly get that working
        consolePatch();

        //the event we get will actually already be JSON parsed into an object, no need to parse manually

        //get the startTimeMillis from the root of the file so we can use it later in our hashing 
        let rootStart = event.startTimeMillis;

        //also grab the data_file_id
        let data_file_id = event.data_file_id;

        //create a list of tasks to process jams _asynchronously_
        let taskList = event.jams.map((jam: wazeTypes.jam) => async () => {
            //hash the whole jam along with the rootStart to get a unique id
            let jamHash = generateAJIUniqueIdentifierHash(jam, rootStart);

            //build a jam object
            let jamEntity: entities.Jam = {
                id: jamHash,
                uuid: jam.uuid,
                pub_millis: jam.pubMillis,
                pub_utc_date: moment.utc(jam.pubMillis).toDate(),
                start_node: jam.startNode,
                end_node: jam.endNode,
                road_type: jam.roadType,
                street: jam.street,
                city: jam.city,
                country: jam.country,
                delay: jam.delay,
                speed: jam.speed,
                speed_kmh: jam.speedKMH,
                length: jam.length,
                turn_type: jam.turnType,
                level: jam.level,
                blocking_alert_id: jam.blockingAlertUuid,
                line: JSON.stringify(jam.line),
                type: jam.type,
                datafile_id: data_file_id,
                turn_line: JSON.stringify(jam.turnLine),
                ns_direction: null, 
                ew_direction: null, 
                dayofweek: null
            }

            // calculate derived things

            // jam.NS / EW direction: 
            {
                jamEntity.ns_direction = null;
                jamEntity.ew_direction = null;
                if (jam.line.length >= 2) {
                    let firstPoint = jam.line[0];
                    let lastPoint = jam.line[jam.line.length - 1];

                    if (lastPoint.y > firstPoint.y) {
                        jamEntity.ns_direction = 'N';
                    } else if (lastPoint.y < firstPoint.y) {
                        jamEntity.ns_direction = 'S';
                    } else {
                        jamEntity.ns_direction = null;   // rare, but possible
                    }

                    if (lastPoint.x > firstPoint.x) {
                        jamEntity.ew_direction = 'E';
                    } else if (lastPoint.x < firstPoint.x) {
                        jamEntity.ew_direction = 'W';
                    } else {
                        jamEntity.ew_direction = null;   // rare, but possible
                    }
                }
            }

            jamEntity.dayofweek = jamEntity.pub_utc_date.getDay(); 

            //upsert the jam
            await db.upsertJamCommand(jamEntity);

            // also update its geometry.. sorry, double write. 
            db.updateJamGeometry(jamEntity.id);

            //add the individual coordinate records from the line and turnLine fields
            //we won't do these in parallel because we're already running jams async
            //and don't want to just blast the database
            if (jam.line) {
                for (let index = 0; index < jam.line.length; index++) {
                    const lineCoord = jam.line[index];

                    let coord: entities.Coordinate = {
                        id: generateCoordinateUniqueIdentifierHash(lineCoord, entities.CoordinateType.Line, null, jamHash, null),
                        jam_id: jamHash,
                        coordinate_type_id: entities.CoordinateType.Line,
                        latitude: lineCoord.y,
                        longitude: lineCoord.x,
                        order: index + 1 //index is zero-based, but our order is 1-based, so add 1
                    }

                    await db.upsertCoordinateCommand(coord);
                }
            }

            if (jam.turnLine) {
                for (let index = 0; index < jam.turnLine.length; index++) {
                    const turnLineCoord = jam.turnLine[index];

                    let coord: entities.Coordinate = {
                        id: generateCoordinateUniqueIdentifierHash(turnLineCoord, entities.CoordinateType.TurnLine, null, jamHash, null),
                        jam_id: jamHash,
                        coordinate_type_id: entities.CoordinateType.TurnLine,
                        latitude: turnLineCoord.y,
                        longitude: turnLineCoord.x,
                        order: index + 1 //index is zero-based, but our order is 1-based, so add 1
                    }

                    await db.upsertCoordinateCommand(coord);
                }
            }
        });
        //run the tasks in a throttled fashion
        await throttle.all(taskList, throttleOpts);
    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
};

const processDataIrregularities: Handler = async (event: wazeTypes.dataFileWithInternalId, context: Context, callback: Callback) => {
    try {
        //patch the console so we can get more searchable logging
        //would be nice to make this global, but couldn't quickly get that working
        consolePatch();

        //the event we get will actually already be JSON parsed into an object, no need to parse manually

        //get the startTimeMillis from the root of the file so we can use it later in our hashing 
        let rootStart = event.startTimeMillis;

        //also grab the data_file_id
        let data_file_id = event.data_file_id;

        //create a list of tasks to process irregularities _asynchronously_
        let taskList = event.irregularities.map((irregularity: wazeTypes.irregularity) => async () => {
            //hash the whole irreg along with the rootStart to get a unique id
            let irregularityHash = generateAJIUniqueIdentifierHash(irregularity, rootStart);

            //build an irreg object
            let irregularityEntity: entities.Irregularity = {
                id: irregularityHash,
                uuid: irregularity.id,
                detection_date: irregularity.detectionDate,
                detection_date_millis: irregularity.detectionDateMillis,
                detection_utc_date: moment.utc(irregularity.detectionDateMillis).toDate(),
                alerts_count: irregularity.alertsCount,
                city: irregularity.city,
                street: irregularity.street,
                country: irregularity.country,
                delay_seconds: irregularity.delaySeconds,
                seconds: irregularity.seconds,
                drivers_count: irregularity.driversCount,
                jam_level: irregularity.jamLevel,
                length: irregularity.length,
                line: JSON.stringify(irregularity.line),
                regular_speed: irregularity.regularSpeed,
                severity: irregularity.severity,
                speed: irregularity.speed,
                trend: irregularity.trend,
                type: irregularity.type,
                update_date: irregularity.updateDate,
                update_date_millis: irregularity.updateDateMillis,
                update_utc_date: moment.utc(irregularity.updateDateMillis).toDate(),
                is_highway: irregularity.highway,
                n_comments: irregularity.nComments,
                n_images: irregularity.nImages,
                n_thumbs_up: irregularity.nThumbsUp,
                datafile_id: data_file_id,
                cause_type: irregularity.causeType,
                end_node: irregularity.endNode,
                start_node: irregularity.startNode
            }

            //upsert the irreg
            await db.upsertIrregularityCommand(irregularityEntity);

            //add the individual coordinate records from the line field
            //we won't do these in parallel because we're already running irregs async
            //and don't want to just blast the database
            if (irregularity.line) {
                for (let index = 0; index < irregularity.line.length; index++) {
                    const lineCoord = irregularity.line[index];

                    let coord: entities.Coordinate = {
                        id: generateCoordinateUniqueIdentifierHash(lineCoord, entities.CoordinateType.Line, null, null, irregularityHash),
                        irregularity_id: irregularityHash,
                        coordinate_type_id: entities.CoordinateType.Line,
                        latitude: lineCoord.y,
                        longitude: lineCoord.x,
                        order: index + 1 //index is zero-based, but our order is 1-based, so add 1
                    }

                    await db.upsertCoordinateCommand(coord);
                }
            }
        });
        //run the tasks in a throttled fashion
        await throttle.all(taskList, throttleOpts);
    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
};

// publish a simple sns message
async function publishSnsMessage(message: string, topicARN: string) {
    let snsParams: AWS.SNS.PublishInput = {
        Message: JSON.stringify({ source: 'waze-data-processor', message: message }),
        TopicArn: topicARN
    };
    await sns.publish(snsParams).promise();
}

// Read the S3 key from the retrieved SQS message
function getS3KeyFromMessage(message: AWS.SQS.Message): string {
    // the info we need is down in the Body, because it came in via SNS
    // parse the body into JSON and grab the Message param
    let snsMessage = JSON.parse(message.Body).Message;
    // parse the sns message into json and get the first record
    let rec = JSON.parse(snsMessage).Records[0]
    // now from that we can get down to the s3 key
    return rec.s3.object.key;
}

// Compute the hash of the given object using our standard options
function computeHash(object: Object): string {
    return hash(object, hashOpts);
}

// Generate a unique id based on the timestamp from the data root and the specific object (the whole alert, jam, irregularity, etc)
function generateAJIUniqueIdentifierHash(object: Object, rootStartTime: number): string {
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

// Generate a unique id based on the coordinate, type, and parent id
function generateCoordinateUniqueIdentifierHash(coordinate: wazeTypes.coordinate, type: entities.CoordinateType, alertId: string, jamId: string, irregularityId: string) {
    //hash the coordinate first
    let coordHash = computeHash(coordinate);
    //combine the coord hash with the other data into a single object
    let combinedObject = {
        originalObjectHash: coordHash,
        coordinateType: type,
        alertId: alertId,
        jamId: jamId,
        irregularityId: irregularityId
    }
    //hash the combined data and return it
    return computeHash(combinedObject);
}

// trigger an invocation of one of the list processor lambdas
function invokeListProcessor(data: wazeTypes.dataFileWithInternalId, lambdaARN: string) {
    return lambda.invoke({
        FunctionName: lambdaARN,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(data)
    }).promise();
}

export { processDataFile, processDataAlerts, processDataJams, processDataIrregularities }
