import fetch from 'node-fetch';
import moment = require('moment');
import AWS = require('aws-sdk');
import { Handler, Context, Callback } from 'aws-lambda';

const s3 = new AWS.S3();

const downloadData: Handler = async (event: any, context: Context, callback: Callback) => {
    try{
        //attempt to fetch the data
        let fetchResult = await fetch(process.env.WAZEDATAURL);
        //make sure we got an ok result
        if(!fetchResult.ok){
            throw new Error(`Failed to fetch ${fetchResult.url}: ${fetchResult.status} ${fetchResult.statusText}`);
        }
        //grab the buffer
        let buffer = await fetchResult.buffer();
        //put the object in S3
        let s3Result = await s3.putObject({
            Bucket: process.env.WAZEDATABUCKET,
            Key: `wazedata_${moment().format('YYYY_MM_DD_HH_mm_ss_SSS')}.json`,
            Body: buffer,
        }).promise()
    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }

    callback();
    return;
};

export {downloadData}