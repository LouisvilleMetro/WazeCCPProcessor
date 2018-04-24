# WazeCCPProcessor

Takes [Waze CCP](https://www.waze.com/ccp) data feed and processes it into a cloud database for querying, analysis, API hooks, and mapping.

## Overview

Louisville is creating an automated cloud processing solution that can be replicated by any CCP Partner, with the help of other govs, partners, and sponsors.

You grab this [Terraform.io](http://www.terraform.io) code and deploy the infrastructure stack (currently AWS but cloud agnostic).

You enter your CCP data feed URL as a parameter.

Then you can store, analyze, query, extract live and historic data for your city.

See the [Projects](https://github.com/LouisvilleMetro/WazeCCPProcessor/projects) area for how you can help, and the [Wiki](https://github.com/LouisvilleMetro/WazeCCPProcessor/wiki) for all the details.

## What is Completed

We have an end-to-end data processor and database working that you can deploy.  

Right now it starts saving your CCP data as JSON files to an S3 bucket every 2 minutes, which you should be doing if you are a CCP partner.

**Here are the steps to make it work:**

### AWS setup

1. Log into your own AWS console.
2. Create a new [S3 bucket](https://s3.console.aws.amazon.com/s3/home), *eg 'waze-artifacts-your-city'*. It needs read/write permissions only for your AWS console account. You only have to do this step one time.
3. Create your lambda functions. 
    - Make sure NVM, NPM, and Node are updated on your machine first.
    - Run *'npm install'* on the *waze-data-download* code in **[code/lambda-functions/waze-data-download](code/lambda-functions/waze-data-download)**.  This should install dependencies, build, and output a zip file at `code/lambda-functions/waze-data-download.zip` locally.  
    - Run *'npm install'* on the *waze-data-process* code in **[code/lambda-functions/waze-data-process](code/lambda-functions/waze-data-process)**.  This should install dependencies, build, and output a zip file at `code/lambda-functions/waze-data-process.zip` locally.
    - Alternatively, you can use our zip files at **[code/lambda-functions/waze-data-download.zip](code/lambda-functions/waze-data-download.zip)** and **[code/lambda-functions/waze-data-process.zip](code/lambda-functions/waze-data-process.zip)**.
4. Upload the zip files from step 3 to the S3 bucket you created in step 2.  


### Preparing to run terraform


### Running terraform


### Running SQL schema creation script
After the stack is up and running

### Using the optional SNS notifications


---

### Everything between the horizontal lines needs to be revisited for new setup - JRS

5. Create a new [Cloud Formation](https://console.aws.amazon.com/cloudformation/home) stack and run the YAML at [infrastructure/cloudformation/WazeProcessorStack.yml](infrastructure/cloudformation/WazeProcessorStack.yml).
6. You will be prompted for 3 variables:
  * **EnvironmentName**: Enter name of the environment (Dev, Test, Prod, etc). This allows you to deploy and test updates easily.
  * **S3ArtifactsBucket**: Enter the S3 bucket name from step 2 where you put your Lambda functions from step 4.
  * **WazeDataHttpUrl**: Full URL to the Waze CCP data feed provided to you by Waze.


---

This creates an infrastructure stack which has pings your custom Waze CCP data feed every 2 minutes and save the JSON to a new bucket, which then gets processed into the relational database.  There is error handling and also notification options for when things go right or wrong.  

Here's what was created:

![Waze Current Architecture](docs/Current%20Architecture.png "Waze Current Architecture")

? You can update the stack with new infrastructure as the code here gets updated, and it only affects new and changed items. You can also remove all the infrastructure automatically (minus the S3 bucket you created manually) by deleting the Terraform stack. 


## Loading Historic JSON Data Files

You can also dump any previously collected historic JSON files into your bucket and the processor will go through them and save/update the relevant data into your database.

### Notes on processing many files at once

The system will queue up and process every file that gets added to the incoming data bucket.  This makes it easy to process any old files you may have already collected, or reprocess files later if changes are made that would require it.  If you should decide to dump a mass of files in the bucket, you may want to consider temporarily disabling all of the foreign keys.  Doing so will _greatly_ increase throughput, which also means reduced cost to run.  Disabling the foreign keys is not without risk, though, so it is advisable to create a backup beforehand and understand what you might need to do to clean up should inconsistent data get loaded while the keys are off.  We are working on a script you can run to disable and re-enable your FKs. 

## Costs

This config stands up infrastructure that is mostly cheap/free (depending on usage), but the database itself is pretty powerful and will result in monthly charges in excess of $200 (as of this writing).  We are working on ways to reduce the costs and you can help out on this [issue](https://github.com/LouisvilleMetro/WazeCCPProcessor/issues/32)

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
