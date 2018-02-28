const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

exports.processData = (event, context, callback) => {
    //attempt to grab a record from the queue
    let sqsParams = {
        QueueUrl: process.env.SQSURL, /* required */
        MaxNumberOfMessages: 1 // we'll only do one at a time
      };

    sqs.receiveMessage(sqsParams, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            return callback(err, null);
        }
        else if (data.Messages && data.Messages.length > 0){
            let s3Key = getS3KeyFromMessage(data.Messages[0]);
            console.log("Retrieved S3 Key", s3Key);

            // now need to read that file in
            let s3Params = {
                Bucket: process.env.WAZEDATAINCOMINGBUCKET,
                Key: s3Key,
            };
            s3.getObject(s3Params, function(err, data) {
                if (err !== null) {
                    console.log(err, err.stack); // an error occurred
                    return callback(err, null);
                }
                let fileData = JSON.parse(data.Body);
                
                // split out alerts, just process those for now
                // TODO: JRS 2018-02-28 - process the other types
                let alerts = fileData.alerts;
                if(alerts && alerts.length > 0){
                    console.log("Processing %d alerts", alerts.length);
                }

                return callback(null, data);
            });

        }
    });


//   fetch(process.env.WAZEDATAURL)
//     .then((response) => {
//       if (response.ok) {
//         return response;
//       }
//       return Promise.reject(new Error(
//             `Failed to fetch ${response.url}: ${response.status} ${response.statusText}`));
//     })
//     .then(response => response.buffer())
//     .then(buffer => (
//       s3.putObject({
//         Bucket: process.env.WAZEDATABUCKET,
//         Key: `wazedata_${moment().format('YYYY_MM_DD_HH_mm_ss_SSS')}.json`,
//         Body: buffer,
//       }).promise()
//     ))
//     .then(v => callback(null, v), callback);
};

function getS3KeyFromMessage(message) {
    // the info we need is down in the Body, because it came in via SNS
    // parse the body into JSON and grab the Message param
    let snsMessage = JSON.parse(message.Body).Message;
    // parse the sns message into json and get the first record
    let rec = JSON.parse(snsMessage).Records[0]
    // now from that we can get down to the s3 key
    return rec.s3.object.key;
}