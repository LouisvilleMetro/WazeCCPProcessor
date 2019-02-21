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

        let whatWeExecuted:string[] = [];

        // how I debug / work on this: 

        // Terraform: 
        //   I commented the lambda invocation in terraform to prevent running this code, and had the out variable return a constant
        //   I had to terraform apply everything, as there are things necessary for cloudwatch logs and stuff that are not obvious 
        //   if you just -target this function

        // command lines to build and upload new zip: 
        //   npm run build    "run the script called build" .. creates a new .zip file
        //   aws lambda update-function-code --function-name development-tf-waze-db-initialize --region us-west-2 --zip-file fileb://../waze-db-initialize.zip

        // Rewriting logic from version 2 to version 3: 

        // 1. Problem: Version 2 didn't create readonly password 
        //    Change to: Always run schema create script, and use "if not exist" and update the password.    
        //    Everything else will be updated too, so better update database to match. 

        // 2. Problem: New Version 3 has all the things already in it
        //    if we have infrastructure set up and run this terraform, its going to invoke this lambda
        //    Therefore a lot of things already exist, and are going to fail
        //    Solution:  Everything is idempotent

        // 3. Run additional update scripts
        //    ... 
        //   

        // So pretty much, what this is looking like: 
        // a) always create if not exists
        // b) force update of passwords every time (rewrite create schema script)
        // c) represent version 2 as its own (set of) scripts (except idempotent). 
        // d) always apply all scripts in a particular order

        // e) ALSO!  Terraform plan ends up invoking this function. 
        //    If it takes too long, then thats bad. 
        //    So make it quickly determine not to invoke itself
        //    So it compares script filenames vs loaded versions and skips
        //    so if you want to reexcute a thing, delete from application_version

        let fileNames = glob.sync("*.sql", {});  // sort defaults to true; 
        let loadedVersions = []; 

        let versionTableExistsResult = await dbClient.query(`
            SELECT *
            FROM information_schema.tables 
            WHERE table_schema = 'waze' 
              AND table_name = 'application_version'`);
        if(versionTableExistsResult.rowCount === 0){
            // no versionTable, so don't populate alreadyLoadedVersions
        } else { 
            let result = await dbClient.query("SELECT * FROM waze.application_version");
            if (result.rowCount>0) { 
                for(let row of result.rows) { 
                    if (row['version_number']) { 
                        loadedVersions[row['version_number']] = row; 
                        console.log("detected loaded version "+row['version_number']+": "+JSON.stringify(row));
                    }                    
                }
            }
        }        
      
        for (let fileName of fileNames) {
            let m = fileName.match(/^([0-9\.]+)/);
            
            if (!m || m.length<1) { 
                console.log("Skipping "+fileName+" because it doesn't start with a version");
                continue; 
            }

            let  version = m[0];
            if (loadedVersions[<any>version]) { 
                console.log("Skipping "+fileName+" because version is already loaded");
                continue; 
            }

            // It is up to the script to insert rows into application_version

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
            whatWeExecuted[<any>fileName] = "ok";
            for(let index in results as any) { 
                let result = (results as any)[index];
                // hopefully this is enough to figure out which statement is a problem in the future
                console.log(index + ". "+result.command +" "+(result.rowCount === null ? "" : result.rowCount));
            }
        }
        //return success
        if (whatWeExecuted.length == 0 ) { 
            return { response: "No changes"}
        } else { 
            return { response: "Database intialization succeeded - " + whatWeExecuted.length+" scripts executed" }; 
        } 
    }
    catch (err) {
        console.error(err);
        callback(err);
        return { response: formatTerraformWarning(err) };
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
