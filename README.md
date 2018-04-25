# WazeCCPProcessor

Takes [Waze CCP](https://www.waze.com/ccp) data feed and processes it into a cloud database for querying, analysis, API hooks, and mapping.

## Overview

Louisville is creating an automated cloud processing solution that can be replicated by any CCP Partner, with the help of other govs, partners, and sponsors.

You grab this [Terraform.io](http://www.terraform.io) code and deploy the infrastructure stack (currently AWS but cloud agnostic).

You enter your CCP data feed URL as a parameter.

Then you can store, analyze, query, extract live and historic data for your city.

See the [Projects](https://github.com/LouisvilleMetro/WazeCCPProcessor/projects) area for how you can help, and the [Wiki](https://github.com/LouisvilleMetro/WazeCCPProcessor/wiki) for all the details.

## Deploy the Solution to Your Cloud

We have an end-to-end data processor and database working that you can deploy.  It saves your CCP data as JSON files every 2 minutes, and processes the data into a combined real-time and historic database.

**Here are the steps to make it work:**

### AWS setup

1. Log into your own AWS console.

**Create IAM User**
1. Go to IAM, Add User, name ‘waze_terraform_user’. Chose programmatic access, attach policy directly: Administrator Access. Create User.
2. Copy access key and secret access key

*Note: when finished deploying the code, remove this admin user for security. We could build a policy for this in the future.*

**Create State Management Bucket

1. Go to [S3](https://s3.console.aws.amazon.com/s3/home), create bucket ‘waze-terraform-state-management-CITYNAME’, default properties and permissions, create.
2. Choose a region that has all services needed. Note your region for later.

**Create Artifacts Bucket**

Go to S3, create bucket ‘waze-terraform-artifacts-CITYNAME’, default properties and permissions, create.

### Download Git Repo Code and Configure

1. Download this repo to a folder on your computer.
1. Go to `/code/lambda-functions/` and place the 2 zip files there into your AWS artifacts bucket "waze-terraform-artifacts-CITYNAME", with default permissions.
1. On your desktop, go to `/infrastructure/terraform/backend/config` and edit the file.  Add the name of your state management bucket "waze-terraform-state-management-CITYNAME", and region (eg. "us-east-1").
1. Go to `/infrastructure/terraform/modules/globals/globals.tf` and update the following:

`# region where resources will be created by default
output "default_resource_region" { value = "us-east-1" }

# Bucket where artifacts, such as lambda code bundles, are stored
output "s3_artifacts_bucket" { value = "waze-terraform-artifacts-CITYNAME" }
output "waze_data_url" { value = "YOUR SPECIFIC WAZE DATA FULL HTTP URL HERE" }
output "rds_master_username" { value = "YOUR DESIRED DB USER NAME HERE" }
output "rds_master_password" { value = "YOUR DESIRED DB PASSWORD HERE" }`

### Preparing to run Terraform for the first time
See `/infrastructure/terraform/Readme.md`

### Running Terraform
In your terminal go to your `/infrastructure/terraform/environment/env-dev` directory
1. Run the following commands
    - `terraform get`
    - `terraform init -backend-config="../../backend/config"`
    - `terraform plan`
    - `terraform apply`
1. Make a note of db_cluster_endpoint value that will be output when Terraform completes.

### Running SQL schema creation script
After the stack is up and running use you favorite PostGres connection client (eg, DBeaver, pgAdmin) and connect to the db_cluster_endpoint from above using your specified rds_master_username and rds_master_password.

1. Open /code/sql/schema.sql and run script in your DB client. 

*Note: this is a manual process for now to ensure DB updates are applied accurately for the moment.*

### Using the optional SNS notifications
Details coming soon.

### Clean Up

Go to your AWS IAM area and delete the `waze_terraform_user` you created.

## Finished Result

This creates an infrastructure stack which has pings your custom Waze CCP data feed every 2 minutes and save the JSON to a new bucket, which then gets processed into the relational database.  There is error handling and also notification options for when things go right or wrong.  

Here's what was created:

![Waze Current Architecture](docs/Current%20Architecture.png "Waze Current Architecture")

You can update the stack with new infrastructure as the code here gets updated, and it only affects new and changed items. You can also remove all the infrastructure automatically (minus the S3 bucket you created manually) by deleting the Terraform stack using `terraform destroy` after the `get` and `init` commands. 

## Loading Historic JSON Data Files

You can also dump any previously collected historic JSON files into your bucket and the processor will go through them and save/update the relevant data into your database.

### Notes on processing many files at once

The system will queue up and process every file that gets added to the incoming data bucket.  This makes it easy to process any old files you may have already collected, or reprocess files later if changes are made that would require it.  If you should decide to dump a mass of files in the bucket, you may want to consider temporarily disabling all of the foreign keys.  Doing so will _greatly_ increase throughput, which also means reduced cost to run.  Disabling the foreign keys is not without risk, though, so it is advisable to create a backup beforehand and understand what you might need to do to clean up should inconsistent data get loaded while the keys are off.  We are working on a script you can run to disable and re-enable your FKs. 

## Costs

This config stands up infrastructure that is mostly cheap/free (depending on usage), but the database itself is pretty powerful and will result in monthly charges in excess of $200 (as of this writing).  We are working on ways to reduce the costs and you can help out on this [issue](https://github.com/LouisvilleMetro/WazeCCPProcessor/issues/32).

## Current Plans

We are working on writing API hooks, data visualizations and tools, and maps, which is all part of our project roadmap.

See our [Projects](https://github.com/LouisvilleMetro/WazeCCPProcessor/projects) area for our blueprint of how we are proceeding. 

**We would like to collaborate with you!**  Please suggest updates, work on the [help wanted issues](https://github.com/LouisvilleMetro/WazeCCPProcessor/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22), collaborate on the Wiki, etc.  It would be great to work together to get the best solution, use cases, and finish faster.   

We've build out the code in [Terraform](http://www.terraform.io) and supported AWS at first, but would like it to be deployed to any cloud provider.  See our [Issues area](https://github.com/LouisvilleMetro/WazeCCPProcessor/issues) for how you can help with this.

## Background

If you'd like a little more background on Louisville and what our city has been going with Waze and other mobility data, take a look at these links:

1. [Louisville Waze Internal Hackathon Recap](https://medium.com/louisville-metro-opi2/waze-louisvilles-first-internal-hackathon-647363a85392)
2. [Harvard Civic Analytics Network Presentation - Slides](https://docs.google.com/presentation/d/1esPVvhuIRjD199rN8aimK_XcmCt0pJOkjEIyCMhGKks/)
3. [Waze April 2018 Monthly Call - Slides](https://docs.google.com/presentation/d/1loAV4BDAUyXdrn44QoLmYiwZdLmL59C4jvJGlZ1a-AY/)
4. [Open Government Coalition](https://www.govintheopen.com/)
