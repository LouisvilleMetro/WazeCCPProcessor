import AWS = require('aws-sdk');
import { Handler, Context, Callback } from 'aws-lambda';
import pg = require('pg');
import fs = require('fs');
import glob = require('glob');

const initializeDatabase: Handler = async (event: any, context: Context, callback: Callback) => {
    try {

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

        // how I debug / work on this: 

        // Terraform: 
        //   I uncommented the lambda invocation in terraform to prevent running this code
        //   I had to terraform apply everything, as there are things necessary for cloudwatch logs and stuff that are not obvious if you just -target this function

        // command lines to build and upload new zip: 
        //   npm run build    "run the script called build" .. creates a new .zip file
        //   aws lambda update-function-code --function-name development-tf-waze-db-initialize --region us-west-2 --zip-file fileb://../waze-db-initialize.zip

        // use code like: 
        //   console.log("schemaresult: "+JSON.stringify(schemaResult));

        // new code: 

        // 1. If schema doesn't exist, run the schema script. 
        //    Problem: Version 2 didn't create readonly password 
        //    Change to: Always run schema create script, and use "if not exist" and update the password.    
        //    Everything else will be updated too, so better update database to match. 

        // 2. run the create script
        //    Problem: New Version 3 has all the things already in it
        //    if we have infrastructure set up and run this terraform, its going to invoke this lambda
        //    Therefore a lot of things already exist, and are going to fail
        //    Solution:  make the main create script "if not exists" as well

        // 3. Run additional update scripts
        //    ... 
        //   

        // So pretty much, what this is looking like: 
        // a) always create if not exists
        // b) force update of passwords every time (rewrite create schema script)
        // c) represent version 2 as its own script. 
        // d) always apply all scripts in a particular order

        /*      //check if the schema already exists, and if so, check the version installed against what we're trying to install
              //if versions are same, just log info message and exit, otherwise log warning and exit
              let schemaResult = await dbClient.query("SELECT 1 FROM information_schema.schemata WHERE schema_name = 'waze';");
              
              console.log("schemaresult: "+JSON.stringify(schemaResult));
              
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
      */

        var fileNames = glob.sync("*.sql", {});  // sort defaults to true; 

        for (let fileName of fileNames) {
            if (!fileName.match(/^\d/)) { 
                console.log("Skipping "+fileName+" because it doesn't start with a digit");
                continue; 
            }
            console.log("working on " + fileName);

            let fileContent = fs.readFileSync(fileName, 'utf-8');
            // just in case it was saved as UTF8 BOM .. 
            fileContent = fileContent.replace(/^\uFEFF/, '');

            //now we need to replace the placeholders
            //we'll also do a quick check that they actually exist, and throw an error if not, just in case someone broke the script
            const lambdaUserPlaceholder = 'LAMBDA_ROLE_NAME_PLACEHOLDER';
            const lambdaPassPlaceholder = 'LAMBDA_ROLE_PASSWORD_PLACEHOLDER';
            const readonlyUserPlaceholder = 'READONLY_ROLE_NAME_PLACEHOLDER';
            const readonlyPassPlaceholder = 'READONLY_ROLE_PASSWORD_PLACEHOLDER';

            //run all the replacements
            let replacedFileContent = fileContent.replace(new RegExp(lambdaUserPlaceholder, 'g'), lambda_username)
                .replace(new RegExp(lambdaPassPlaceholder, 'g'), lambda_password)
                .replace(new RegExp(readonlyUserPlaceholder, 'g'), readonly_username)
                .replace(new RegExp(readonlyPassPlaceholder, 'g'), readonly_password);

            let wasReplaced = "";
            if (fileContent != replacedFileContent) { 
                wasReplaced = " (with replacements)";
            }

            //execute the sql!
            console.log("Executing " + fileName + wasReplaced);
            let results = await dbClient.query(replacedFileContent);
            for(let result of (results as any)) { 
                console.log(result.command +" "+result.rowCount);
            }
        }
        //return success
        console.log('Database intialization succeeded');
        return { response: "Database intialization succeeded" }
    }
    catch (err) {
        console.error(err);
        callback(err);
        return err;
    }
    finally {
        // CLOSE THAT CLIENT!
        await dbClient.end();
    }
};

export { initializeDatabase }

//build a terraform-output-friendly warning message
function formatTerraformWarning(warningMessage: string): string {
    return `
    
    WARNING! ********************* WARNING! ********************* WARNING!
    ${warningMessage}
    WARNING! ********************* WARNING! ********************* WARNING!

    `;
}

// for running locally
console.log("test 9:53am");
initializeDatabase(null, null, (r) => console.log("callback: " + JSON.stringify(r)));
