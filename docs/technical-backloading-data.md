# Backloading Data Files into Your Database

You can copy older or missing JSON data files into your 'incoming' bucket, and the system will process those into your database automatically.

## Copy a few files using AWS Console manually

You can log into the AWS console GUI and upload files from your desktop manually.  This is a good option if you just have a few (1-1000 or so) file you need to process.

1. Log into your console and go to your [S3 bucket list](https://s3.console.aws.amazon.com/s3/home).
1. Look for a bucket called something like `development-tf-waze-data-incoming-############` and click it.  
1. Click 'Upload', 'Add Files', choose your files on your desktop (or drag to window), and click Next a few times.
1. Files will upload and start processing immediately.
1. When complete, the JSON file will be moved to your `development-tf-waze-data-processed-############` bucket.

## Copy lots of files using AWS CLI

If you have a lot of files in another bucket that you want to copy over en masse, then you should use the Command Line Interface and run copy commands to move them over in chunks.

### First Time AWS CLI Setup

First you need to setup the CLI on your desktop enviroment.  This includes [installing the CLI tools](https://docs.aws.amazon.com/cli/latest/userguide/installing.html), and [making a CLI IAM user](https://docs.aws.amazon.com/rekognition/latest/dg/setting-up.html#setting-up-iam) for this purpose, and [setting up authentication](https://docs.aws.amazon.com/rekognition/latest/dg/setup-awscli.html)

To test your setup, you should be able to get a list of all your bucket creation dates and names using the command `aws s3 ls`.

### CLI Copy Command Examples

You can use the `cp` command to copy files form one buck to another.  

**Example**

`​aws s3 cp s3://scripted-waze-data--############-dev/ s3://development-tf-waze-data-incoming--############ --recursive --exclude "*" --include "wazedata_2017_11_01*"`

In this example, here is what is going on.

- `aws s3 cp` - copy from S3 buckets
- `s3://scripted-waze-data--############-dev/` - source bucket, where the old files are (yours will be different than this example)
- `s3://development-tf-waze-data-incoming--############` - destination bucket, where you want to copy files for processing
- `--recursive` - make sure to get all files even in folders (though we aren't using folders yet)
- `--exclude "*"` - exclude all files by default
- `--include "wazedata_2017_11_01*"` - copy (inlcude) only files that match this pattern. This is the key part of your command!

This example will get all November 1, 2017 files only.  You can start with something smaller until you are comfortable, like `​--include "wazedata_2017_11_01_10*"` which will only get Nov 1 files in the 10 o'clock hour.

When you run your CLI command, it can take 3-10 minutes for AWS to look in the bucket and start moving files over.  It will show you the status of this in your terminal.

## Reprocessing duplicate files

If you put the exact same file back in the processing bucket for a second time, it will not be processed.  This is by design, since the data is already in your DB.  Do you can test with an hour in November, then test again with the same day in November, then do the whole month and you won't get duplicate data.

## Processing Time

We have added throttling and foreign keys so that the database CPU usage doesn't spike at 100% and then crash. The trade off to this is that it takes some time to process the files.  But your existing recent data files will continue to process every 2 mintues.

For example, processing a day of files takes about 12 minutes, 10 days about 2 hours, and a month about 6-10 hours.  But you can run your CLI commands and come back later to run the next command.

## Checking on Database Status

You can check on the progress of your import by going to the [Amazon RDS Console area](https://console.aws.amazon.com/rds/home?#dbinstances:).

Chose the instance named something like `development-tf-waze-aurora-instance-0`, then look at the CPU Utilization chart.  Normally it will be between 3-5%, but when processing it will be between 80-95%.  When it drops back down you will know processing is done.

### Notes on processing many files at once

The system will queue up and process every file that gets added to the incoming data bucket.  This makes it easy to process any old files you may have already collected, or reprocess files later if changes are made that would require it.  If you should decide to dump a mass of files in the bucket, you may want to consider temporarily disabling all of the foreign keys.  Doing so will _greatly_ increase throughput, which also means reduced cost to run.  Disabling the foreign keys is not without risk, though, so it is advisable to create a backup beforehand and understand what you might need to do to clean up should inconsistent data get loaded while the keys are off.  We are working on a script you can run to disable and re-enable your FKs. 

## Dealing with Problem Files

If you have JSON files sitting in your `development-tf-waze-data-incoming-***` bucket for an hour or more that means there was an error processing them.  The errors will show up in your [SQS Queue](https://console.aws.amazon.com/sqs/home) called `development-tf-waze-data-processing-dlq` if you want more details.  

It could be they were saved before you ran your database script.  In that case, go to your `incoming` bucket, checked all files, select Open, they will all download to your desktop, click Upload, selected those same files, upload them and they will now all process and be moved to `processed`.

It could be that there are other errors with the file, like a schema change or network issue, etc.  In that case open an Issue in this repo and upload the file and we'll try to see what's wrong and maybe improve the process/code.

## How Many Files Should I Process at Once?

We recommend testing with an hour `"wazedata_2017_11_01_10*"`, then day `"wazedata_2017_11_01*"`, then maybe 10 days `"wazedata_2017_11_0*"` of files at first.  When you are comfortable you can try a month at a time `"wazedata_2017_11*"`.  One month at a time is the most we recommend.  

## Can this process be improved?

There are lots of things that could be improved with this process.  Maybe [splitting the DB into real-time and historic DBs](https://github.com/LouisvilleMetro/WazeCCPProcessor/issues/32).  Maybe running scripts that remove Foreign Keys and Indexes then adds them back in later, which results in about a 50% speed increase.  Maybe changing the way the throttling works could help.  Feel free to [help us come up with ideas and solutions](https://github.com/LouisvilleMetro/WazeCCPProcessor/issues).