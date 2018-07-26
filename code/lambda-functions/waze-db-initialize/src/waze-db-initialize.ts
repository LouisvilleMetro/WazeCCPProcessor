import AWS = require('aws-sdk');
import { Handler, Context, Callback } from 'aws-lambda';
import pg = require('pg'); 
import fs = require('fs');


const initializeDatabase: Handler = async (event: any, context: Context, callback: Callback) => {
    try{
        
        // get a DB client to run our queries with
        var dbClient = new pg.Client();

        //open the connection
        await dbClient.connect();

        //grab the env vars we'll need for the usernames and passwords to create
        let lambda_username = process.env.LAMBDAPGUSER;
        let lambda_password = process.env.LAMBDAPGPASSWORD;
        let readonly_username = process.env.READONLYPGUSER;
        let readonly_password = process.env.READONLYPASSWORD;
        let current_version = process.env.CURRENTVERSION;

        //check if the schema already exists, and if so, check the version installed against what we're trying to install
        //if versions are same, just log info message and exit, otherwise log warning and exit
        let schemaResult = await dbClient.query("SELECT 1 FROM information_schema.schemata WHERE schema_name = 'waze';");
        if (schemaResult.rowCount > 0){
            //the schema exists, see if we have a version table (that gets its own special error)
            console.log("SCHEMA exists, verifying versions");

            let versionTableExistsResult = await dbClient.query("SELECT 1 FROM information_schema.tables WHERE table_schema = 'waze' AND table_name = 'application_version';")
            if(versionTableExistsResult.rowCount === 0){
                //there IS NO version table, which is a problem
                console.error('Version table not found');
                return { response: formatTerraformWarning('Version table not found, please verify SQL schema is up to date.') };
            }

            //version table found, so we need to make sure it is the same version as what we would be trying to install
            let versionCheckResult = await dbClient.query("SELECT version_number from waze.application_version ORDER BY install_date DESC LIMIT 1");
            //if we didn't get a result, or get a result that isn't an exact match, warn about it
            if(versionCheckResult.rowCount === 0){
                console.error('No version records found');
                return { response: formatTerraformWarning('No version records found, please verify SQL schema is up to date.') };
            }
            else if(versionCheckResult.rows[0].version_number !== current_version){
                console.error('Version mismatch');
                return { response: formatTerraformWarning('Version mismatch, please verify SQL schema is up to date.') };
            }
            else{
                //versions match up, so just return a notice that nothing needed to be done
                console.log('Versions match, no DB changes needed');
                return { response: "Database is up-to-date" };
            }
        }
        
        //the schema didn't exist, so we need to create everything
        //first, load up the initialize script
        let initFile = fs.readFileSync('./initialize-schema-and-roles.sql', 'utf-8');
        
        //now we need to replace the placeholders
        //we'll also do a quick check that they actually exist, and throw an error if not, just in case someone broke the script
        const lambdaUserPlaceholder = 'LAMBDA_ROLE_NAME_PLACEHOLDER';
        const lambdaPassPlaceholder = 'LAMBDA_ROLE_PASSWORD_PLACEHOLDER';
        const readonlyUserPlaceholder = 'READONLY_ROLE_NAME_PLACEHOLDER';
        const readonlyPassPlaceholder = 'READONLY_ROLE_PASSWORD_PLACEHOLDER';

        if(initFile.indexOf(lambdaUserPlaceholder) < 0 || initFile.indexOf(lambdaPassPlaceholder) < 0 || 
           initFile.indexOf(readonlyUserPlaceholder) < 0 || initFile.indexOf(readonlyPassPlaceholder) < 0){
            throw new Error('DB initialization script is missing placeholders and cannot be run');
        }

        //run all the replacements
        initFile = initFile.replace(new RegExp(lambdaUserPlaceholder, 'g'), lambda_username)
                           .replace(new RegExp(lambdaPassPlaceholder, 'g'), lambda_password)
                           .replace(new RegExp(readonlyUserPlaceholder, 'g'), readonly_username)
                           .replace(new RegExp(readonlyPassPlaceholder, 'g'), readonly_password);

        //execute the sql!
        await dbClient.query(initFile);

        //load and run the table creation
        let schemaFile = fs.readFileSync('./schema.sql', 'utf-8');
        await dbClient.query(schemaFile);

        //update the version table
        await dbClient.query('INSERT INTO waze.application_version VALUES ($1, current_timestamp)', [current_version]);

        //return success
        console.log('Database intialization succeeded');
        return { response: "Database intialization succeeded" }

    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
    finally{
        // CLOSE THAT CLIENT!
        await dbClient.end();
    }
};

export {initializeDatabase}

//build a terraform-output-friendly warning message
function formatTerraformWarning(warningMessage:string):string {
    return `
    
    WARNING! ********************* WARNING! ********************* WARNING!
    ${warningMessage}
    WARNING! ********************* WARNING! ********************* WARNING!

    `;
}