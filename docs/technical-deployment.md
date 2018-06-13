
# Deploy the Solution to Your Cloud

We have an end-to-end data processor and database working that you can deploy.  It saves your CCP data as JSON files every 2 minutes, and processes the data into a combined real-time and historic database.

**Here are the steps to make it work:**

### AWS setup

1. Log into your own AWS console.

**Create IAM User**
1. Go to IAM, Add User, name `waze_terraform_user`. Chose programmatic access, attach policy directly: Administrator Access. Create User.
2. Copy access key and secret access key

*Note: when finished deploying the code, remove this admin user for security. We could build a security policy for this in the future.*

**Create State Management Bucket** (one-time)

1. Go to [S3](https://s3.console.aws.amazon.com/s3/home), create bucket `waze-terraform-state-management-CITYNAME`, default properties and permissions, create.
2. Choose a region that has all services needed. Note your region for later.

### Download Git Repo Code and Configure

1. Download this repo to a folder on your computer.
1. On your desktop, go to `/infrastructure/terraform/backend/config` and edit the file.  Add the name of your state management bucket `waze-terraform-state-management-CITYNAME`, and region (eg. "us-east-1").
1. Go to `/infrastructure/terraform/modules/globals/globals.tf` and update the following:
```
# region where resources will be created by default
output "default_resource_region" { value = "us-east-1" }

output "waze_data_url" { value = "YOUR SPECIFIC WAZE DATA FULL HTTP URL HERE" }
output "rds_master_username" { value = "YOUR DESIRED DB USER NAME HERE" }
output "rds_master_password" { value = "YOUR DESIRED DB ADMIN PASSWORD HERE" }
output "lambda_db_password" { value = "YOUR DESIRED PASSWORD FOR THE LAMBDA PROCESSING USER HERE"}
```

### Setup Terraform for the First Time (one-time)

1. Download the [latest version](https://www.terraform.io/downloads.html) v0.11, unzip, move to /bin if needed, and [set the path](https://www.terraform.io/intro/getting-started/install.html) (eg, sudo ln -s terraform terraform).
1. Verify your version is correct by running `terraform --version`.

### Running Terraform
1. In your terminal go to your `/infrastructure/terraform/environment/env-dev` directory (use `env-dev` for a development/test deployment, or `env-prod` for production level deployment)
    - The dev environment has options set that will allow destroying everything with no extra work other than `terraform destroy`
    - The prod environment has options set that will prevent destroying the database unless you have taken a final snapshot and will prevent destroying the S3 buckets if there are files in them.  This is done to help protect production data from accidental, unrecoverable destruction.
1. Set session variables for Terraform with access keys from AWS IAM user:

    **Linux**
    - `export AWS_ACCESS_KEY_ID="YOUR IAM USER ACCESS KEY"`
    - `export AWS_SECRET_ACCESS_KEY="YOUR IAM USER SECRET ACCESS KEY"`
    
    **Windows**
    - `set AWS_ACCESS_KEY_ID=‹value>`
    - `set  AWS_SECRET_ACCESS_KEY=‹value>`
    
    **Windows Powershell**
    - `$env:AWS_ACCESS_KEY_ID = "<value>"`
    - `$env:AWS_SECRET_ACCESS_KEY = "<value>"`
1. Run the following commands
    - `terraform get`
    - `terraform init -backend-config="../../backend/config"`
    - `terraform plan`
    - `terraform apply`
1. Make a note of `db_cluster_endpoint` value that will be output when Terraform completes.

### Running SQL schema creation script
After the stack is up and running use you favorite PostGres connection client (eg, DBeaver, pgAdmin) and connect to the `db_cluster_endpoint` from above using your previously specified `rds_master_username` and `rds_master_password`.

1. Open `/code/sql/schema.sql`
1. Update the password for the `lambda_role` (near the top) to match what you provided in the terraform config
1. Connect to the DB using the `db_cluster_endpoint` value output from Terraform, the DB schema `waze_data`, and your DB admin username and password from file configurations.
1. Run script in your DB client

*Note: this is a manual process for now to ensure DB updates are applied accurately for the moment.*

### Using the optional SNS notifications

The system makes use of several SNS topics that can optionally be subscribed to in order to receive notifications or trigger other events.  Currently there are 4 topics available:
  - *File received:* notification that fires every time a file is added to the incoming S3 bucket
  - *File processed:* notification that fires when we've finished processing a file; this is optional sending notifications to this topic can be disabled in terraform
  - *Records in dead-letter queue:* sends notifications when records are in the dead-letter queue; this is optional sending notifications to this topic can be disabled in terraform
  - *Records in work queue:* notification that fires if there are records in the work queue that need to be processed; because of the nature of the queue, there may not _actually_ be anything left in the queue when the notification is sent

Example usages of these topics:
  - Subscribe with email to the "Records in dead-letter queue" topic to get an email when things go to that queue (usually indicates errors)
  - Subscribe a web hook to the "File processed" notification to kick off an external process that needs to read the new data from the database

The ARNs for each of the topics can be found in the outputs after running terraform, and you can view them in the AWS Console.

### Clean Up

Go to your AWS IAM area and delete the `waze_terraform_user` you created.
