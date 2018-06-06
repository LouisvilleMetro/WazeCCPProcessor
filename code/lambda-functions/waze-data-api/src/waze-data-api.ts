import AWS = require('aws-sdk');
import { Handler, Context, Callback } from 'aws-lambda';
import consolePatch from '../../shared-lib/src/consolePatch'


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
export { getAlertsList, getAlertDetail, getIrregularitiesList, getIrregularityDetail, getJamsList, getJamDetail }