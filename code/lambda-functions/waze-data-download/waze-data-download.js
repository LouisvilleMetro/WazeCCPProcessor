const fetch = require('node-fetch');
const moment = require('moment');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

exports.downloadData = (event, context, callback) => {
  fetch(process.env.WAZEDATAURL)
    .then((response) => {
      if (response.ok) {
        return response;
      }
      return Promise.reject(new Error(
            `Failed to fetch ${response.url}: ${response.status} ${response.statusText}`));
    })
    .then(response => response.buffer())
    .then(buffer => (
      s3.putObject({
        Bucket: process.env.WAZEDATABUCKET,
        Key: `wazedata_${moment().format('YYYY_MM_DD_HH_mm_ss_SSS')}.json`,
        Body: buffer,
      }).promise()
    ))
    .then(v => callback(null, v), callback);
};