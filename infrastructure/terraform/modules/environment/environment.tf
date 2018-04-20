# setup the AWS provider
provider "aws" {
    region = "${var.default_resource_region}"
}

###############################################
# Cloudwatch
###############################################

# create a cloudwatch event that will run on a schedule
resource "aws_cloudwatch_event_rule" "data_retrieval_timer" { 
    name = "${var.object_name_prefix}-data-retrieval-timer"
    description = "Cron job to get data from Waze periodically"
    schedule_expression = "rate(2 minutes)"
}

# setup a target for the event
resource "aws_cloudwatch_event_target" "data_retrieval_timer_target" { 
    rule = "${aws_cloudwatch_event_rule.data_retrieval_timer.name}"
    arn  = "${aws_lambda_function.waze_data_retrieval_function.arn}"
}

# give permission for our lambda to be triggered by cloudwatch event
resource "aws_lambda_permission" "allow_data_retrieval_timer_target_lambda" {
    statement_id  = "AllowExecutionFromCloudwatch"
    action        = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.waze_data_retrieval_function.function_name}"
    principal     = "events.amazonaws.com"
    source_arn    = "${aws_cloudwatch_event_rule.data_retrieval_timer.arn}"
}

# create a cloudwatch alarm to alert on the dead letter queue receiving messages
resource "aws_cloudwatch_metric_alarm" "processing_dead_letter_queue_alarm" {
    # we'll only create this alarm if the associated var is true
    count = "${var.enable_data_processor_dlq_sns_topic == "true" ? 1 : 0}"
    alarm_name                = "${var.object_name_prefix}-waze-data-processing-dlq-receive-alarm"
    comparison_operator       = "GreaterThanOrEqualToThreshold"
    evaluation_periods        = "1"
    metric_name               = "NumberOfMessagesReceived"
    namespace                 = "AWS/SQS"
    dimensions {
        QueueName = "${aws_sqs_queue.data_processing_dead_letter_queue.name}"
    }
    period                    = "300"
    statistic                 = "Sum"
    threshold                 = "1"
    alarm_description         = "This metric monitors sqs message receipt in the dead letter queue"
    alarm_actions             = ["${aws_sns_topic.data_processing_dlq_sns_topic.arn}"]
    treat_missing_data        = "notBreaching"
}

# create a cloudwatch alarm to alert on the dead letter queue if items are in it for 24 hours
resource "aws_cloudwatch_metric_alarm" "processing_dead_letter_queue_has_items_alarm" {
    # we'll only create this alarm if the associated var is true
    count = "${var.enable_data_processor_dlq_sns_topic == "true" ? 1 : 0}"
    alarm_name                = "${var.object_name_prefix}-waze-data-processing-dlq-messages-alarm"
    comparison_operator       = "GreaterThanOrEqualToThreshold"
    evaluation_periods        = "1"
    metric_name               = "ApproximateNumberOfMessagesVisible"
    namespace                 = "AWS/SQS"
    dimensions {
        QueueName = "${aws_sqs_queue.data_processing_dead_letter_queue.name}"
    }
    period                    = "86400" # 24 hours
    statistic                 = "Minimum"
    threshold                 = "1"
    alarm_description         = "This metric monitors sqs messages sitting in the dead letter queue"
    alarm_actions             = ["${aws_sns_topic.data_processing_dlq_sns_topic.arn}"]
    treat_missing_data        = "notBreaching"
}

# create a cloudwatch alarm to monitor the work queue
resource "aws_cloudwatch_metric_alarm" "data_processing_queue_alarm" {
  alarm_name                = "${var.object_name_prefix}-waze-data-processing-work-queue-alarm"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  evaluation_periods        = "1"
  metric_name               = "ApproximateNumberOfMessagesVisible"
  namespace                 = "AWS/SQS"
  dimensions {
    QueueName = "${aws_sqs_queue.data_processing_queue.name}"
  }
  period                    = "300"
  statistic                 = "Maximum"
  threshold                 = "1"
  alarm_description         = "This metric monitors sqs message visibility"
  alarm_actions             = ["${aws_sns_topic.data_in_queue_alarm_sns_topic.arn}"]
  treat_missing_data        = "ignore"
}

###############################################
# S3
###############################################

# create the S3 bucket that will store our data files
# since bucket names have to be globally unique, and we're sharing this script,
# we'll inject the account id into the name
data "aws_caller_identity" "current" {}
resource "aws_s3_bucket" "waze_data_incoming_bucket" {
    bucket = "${var.object_name_prefix}-waze-data-incoming-${data.aws_caller_identity.current.account_id}"
    force_destroy = "${var.empty_s3_buckets_before_destroy}"
}

# setup a notification on the incoming bucket to trigger SNS
resource "aws_s3_bucket_notification" "waze_data_incoming_bucket_notification" {
  bucket = "${aws_s3_bucket.waze_data_incoming_bucket.id}"

  topic {
    topic_arn     = "${aws_sns_topic.data_retrieved_sns_topic.arn}"
    events        = ["s3:ObjectCreated:*"]
  }
}

# create a bucket to store the files after processing is done
resource "aws_s3_bucket" "waze_data_processed_bucket" {
    bucket = "${var.object_name_prefix}-waze-data-processed-${data.aws_caller_identity.current.account_id}"
    force_destroy = "${var.empty_s3_buckets_before_destroy}"
}

###############################################
# SQS
###############################################

# create the SQS queue that will track new data
resource "aws_sqs_queue" "data_processing_queue" {
    name = "${var.object_name_prefix}-waze-data-processing"
    delay_seconds = "0"
    receive_wait_time_seconds = "20"
    visibility_timeout_seconds = "360"
    redrive_policy = "{\"deadLetterTargetArn\":\"${aws_sqs_queue.data_processing_dead_letter_queue.arn}\",\"maxReceiveCount\":5}"
    tags {
        Environment = "${var.environment}"
        Scripted = "true"
    }
}

# create a policy that will allow sns to push messages to the queue
resource "aws_sqs_queue_policy" "data_processing_queue_policy" {
    queue_url = "${aws_sqs_queue.data_processing_queue.id}"

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Id": "sqspolicy",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "sqs:SendMessage",
      "Resource": "${aws_sqs_queue.data_processing_queue.arn}",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "${aws_sns_topic.data_retrieved_sns_topic.arn}"
        }
      }
    }
  ]
}
POLICY
}

# create the dead letter queue for our main queue
resource "aws_sqs_queue" "data_processing_dead_letter_queue" {
    name = "${var.object_name_prefix}-waze-data-processing-dlq"
    delay_seconds = "0"
    receive_wait_time_seconds = "0"
    visibility_timeout_seconds = "30"
    message_retention_seconds = "1209600" # 14 days
    tags {
        Environment = "${var.environment}"
        Scripted = "true"
    }
}

###############################################
# SNS TOPICS
###############################################

# create a topic for the dead letter queue notification
resource "aws_sns_topic" "data_processing_dlq_sns_topic" {
    name = "${var.object_name_prefix}-waze-data-processing-dlq-notification"
    display_name = "${var.object_name_prefix}-waze-data-processing-dlq-notification"
}

# create a topic for the data retrieved notification
# this will be triggered by S3, so it needs some setup
resource "aws_sns_topic" "data_retrieved_sns_topic" {
    name = "${var.object_name_prefix}-waze-data-retrieved-notification"
    display_name = "${var.object_name_prefix}-waze-data-retrieved-notification"

}

resource "aws_sns_topic_policy" "data_retrieved_sns_allow_s3_publish_policy" {
  arn = "${aws_sns_topic.data_retrieved_sns_topic.arn}"

  policy = <<POLICY
{
    "Version":"2012-10-17",
    "Statement":[{
        "Effect": "Allow",
        "Principal": {"AWS":"*"},
        "Action": "SNS:Publish",
        "Resource": "${aws_sns_topic.data_retrieved_sns_topic.arn}",
        "Condition":{
            "ArnLike":{"aws:SourceArn":"${aws_s3_bucket.waze_data_incoming_bucket.arn}"}
        }
    }]
}
POLICY
}

# add subscription to notify SQS when message published to topic
resource "aws_sns_topic_subscription" "data_retrieved_sqs_subscription" {
    topic_arn = "${aws_sns_topic.data_retrieved_sns_topic.arn}"
    protocol = "sqs"
    endpoint = "${aws_sqs_queue.data_processing_queue.arn}"
}

# add subscription to notify lambda when message published to topic
resource "aws_sns_topic_subscription" "data_retrieved_lambda_subscription" {
    topic_arn = "${aws_sns_topic.data_retrieved_sns_topic.arn}"
    protocol = "lambda"
    endpoint = "${aws_lambda_function.waze_data_processing_function.arn}"
}

# have to tell lambda that sns can trigger it
resource "aws_lambda_permission" "allow_sns_data_retrieved_topic_trigger_processor_lambda" {
  statement_id  = "AllowExecutionFromSNSDataRetrieved"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.waze_data_processing_function.function_name}"
  principal     = "sns.amazonaws.com"
  source_arn    = "${aws_sns_topic.data_retrieved_sns_topic.arn}"
}

# create a topic for the data processed notification
resource "aws_sns_topic" "data_processed_sns_topic" {
    name = "${var.object_name_prefix}-waze-data-processed-notification"
    display_name = "${var.object_name_prefix}-waze-data-processed-notification"
}

# also need a topic that we'll use to trigger the processor lambda when items are in the queue
resource "aws_sns_topic" "data_in_queue_alarm_sns_topic" {
    name = "${var.object_name_prefix}-waze-data-queue-alarm-topic"
    display_name = "${var.object_name_prefix}-waze-data-queue-alarm-topic"
}

# add a subscription so sns knows to notify lambda
resource "aws_sns_topic_subscription" "data_processor_starter_trigger" {
    topic_arn = "${aws_sns_topic.data_in_queue_alarm_sns_topic.arn}"
    protocol = "lambda"
    endpoint = "${aws_lambda_function.waze_data_processing_function.arn}"
}

# have to tell lambda that sns can trigger it
resource "aws_lambda_permission" "allow_sns_trigger_processor_lambda" {
  statement_id  = "AllowExecutionFromSNSAlarmTrigger"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.waze_data_processing_function.function_name}"
  principal     = "sns.amazonaws.com"
  source_arn    = "${aws_sns_topic.data_in_queue_alarm_sns_topic.arn}"
}

###############################################
# IAM
###############################################

# create a service role for the data retriever lambda function
resource "aws_iam_role" "data_retrieval_execution_role" {
    name = "${var.object_name_prefix}-data-retrieval-execution-role"
    assume_role_policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "lambda.amazonaws.com"
                ]
            }
        }
    ]
}
POLICY
}

# create a policy to allow access to the data bucket, the queue, and execution of the data processor
resource "aws_iam_policy" "data_retrieval_resource_access" {
  name = "${var.object_name_prefix}-data-and-queue-access-policy"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Effect": "Allow",
      "Resource": [
          "${aws_s3_bucket.waze_data_incoming_bucket.arn}",
          "${aws_s3_bucket.waze_data_incoming_bucket.arn}/*",
          "${aws_s3_bucket.waze_data_processed_bucket.arn}",
          "${aws_s3_bucket.waze_data_processed_bucket.arn}/*"
      ]
    },
    {
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage"
      ],
      "Effect": "Allow",
      "Resource": [
          "${aws_sqs_queue.data_processing_queue.arn}"
      ]
    },
    {
      "Action": [
        "sns:Publish"
      ],
      "Effect": "Allow",
      "Resource": [
          "${aws_sns_topic.data_in_queue_alarm_sns_topic.arn}",
          "${aws_sns_topic.data_processed_sns_topic.arn}"
      ]
    },
    {
       "Action": [
        "lambda:InvokeFunction"
      ],
      "Effect": "Allow",
      "Resource": [
          "${aws_lambda_function.waze_data_alerts_processing_function.arn}",
          "${aws_lambda_function.waze_data_jams_processing_function.arn}",
          "${aws_lambda_function.waze_data_irregularities_processing_function.arn}"
      ] 
    }
  ]
}
EOF
}

# attach the policy to the lambda role
resource "aws_iam_role_policy_attachment" "data_retrieval_execution_role_resource_access_attachment" {
    role       = "${aws_iam_role.data_retrieval_execution_role.name}"
    policy_arn = "${aws_iam_policy.data_retrieval_resource_access.arn}"
}

# also need to attach the lambda basic role, so it can do useful things like logging
resource "aws_iam_role_policy_attachment" "data_retrieval_lambda_basic_logging_role_policy_attachment" {
    role       = "${aws_iam_role.data_retrieval_execution_role.name}"
    policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


################################################
# Lambdas
################################################

# get info about the artifact for the data retrieval lambda
data "aws_s3_bucket_object" "waze_data_retrieval_function_artifact" {
  bucket = "${var.s3_artifacts_bucket}"
  key    = "waze-data-download.zip"
}

# setup data retrieve lambda
resource "aws_lambda_function" "waze_data_retrieval_function"{
    s3_bucket         = "${data.aws_s3_bucket_object.waze_data_retrieval_function_artifact.bucket}"
    s3_key            = "${data.aws_s3_bucket_object.waze_data_retrieval_function_artifact.key}"
    s3_object_version = "${data.aws_s3_bucket_object.waze_data_retrieval_function_artifact.version_id}"

    function_name = "${var.object_name_prefix}-waze-data-retrieval"
    runtime = "nodejs6.10"
    role = "${aws_iam_role.data_retrieval_execution_role.arn}"
    handler = "waze-data-download.downloadData"
    timeout = 300
    memory_size = 256
    environment {
        variables = {
            WAZEDATAURL = "${var.waze_data_url}"
            WAZEDATABUCKET = "${aws_s3_bucket.waze_data_incoming_bucket.id}"
            SQSURL = "${aws_sqs_queue.data_processing_queue.id}"
        }
    }
    tags {
        Environment = "${var.environment}"
        Scripted = "true"
    }
}

# get info about the artifact for the data processing lambda
data "aws_s3_bucket_object" "waze_data_processing_function_artifact" {
  bucket = "${var.s3_artifacts_bucket}"
  key    = "waze-data-process.zip"
}

# setup data processing lambda
resource "aws_lambda_function" "waze_data_processing_function"{
    s3_bucket         = "${data.aws_s3_bucket_object.waze_data_processing_function_artifact.bucket}"
    s3_key            = "${data.aws_s3_bucket_object.waze_data_processing_function_artifact.key}"
    s3_object_version = "${data.aws_s3_bucket_object.waze_data_processing_function_artifact.version_id}"
    function_name = "${var.object_name_prefix}-waze-data-processing"
    runtime = "nodejs8.10"
    role = "${aws_iam_role.data_retrieval_execution_role.arn}"
    handler = "waze-data-process.processDataFile"
    timeout = 300
    memory_size = 512 #TODO: JRS 2018-02-06 - test large files to see if we need more (or could get by with less) resources
    environment {
        variables = {
            WAZEDATAINCOMINGBUCKET = "${aws_s3_bucket.waze_data_incoming_bucket.id}"
            WAZEDATAPROCESSEDBUCKET = "${aws_s3_bucket.waze_data_processed_bucket.id}"
            SQSURL = "${aws_sqs_queue.data_processing_queue.id}"
            RETRIGGERSNSTOPIC = "${aws_sns_topic.data_in_queue_alarm_sns_topic.arn}"
            SNSTOPIC = "${var.enable_data_processed_sns_topic == "true" ? aws_sns_topic.data_processed_sns_topic.arn : "" }"
            ALERTPROCESSORARN = "${aws_lambda_function.waze_data_alerts_processing_function.arn}"
            JAMPROCESSORARN = "${aws_lambda_function.waze_data_jams_processing_function.arn}"
            IRREGULARITYPROCESSORARN = "${aws_lambda_function.waze_data_irregularities_processing_function.arn}"
            PGHOST = "${aws_rds_cluster.waze_database_cluster.endpoint}"
            PGUSER = "${postgresql_role.lambda_role.name}"
            PGPASSWORD = "${postgresql_role.lambda_role.password}"
            PGDATABASE = "${aws_rds_cluster.waze_database_cluster.database_name}"
            PGPORT = "${var.rds_port}"
        }
    }
    tags {
        Environment = "${var.environment}"
        Scripted = "true"
    }
}

# setup alert processing lambda
resource "aws_lambda_function" "waze_data_alerts_processing_function"{
    s3_bucket         = "${data.aws_s3_bucket_object.waze_data_processing_function_artifact.bucket}"
    s3_key            = "${data.aws_s3_bucket_object.waze_data_processing_function_artifact.key}"
    s3_object_version = "${data.aws_s3_bucket_object.waze_data_processing_function_artifact.version_id}"
    function_name = "${var.object_name_prefix}-waze-data-alerts-processing"
    runtime = "nodejs8.10"
    role = "${aws_iam_role.data_retrieval_execution_role.arn}"
    handler = "waze-data-process.processDataAlerts"
    timeout = 300
    memory_size = 512 #TODO: JRS 2018-02-06 - test large files to see if we need more (or could get by with less) resources
    environment {
        variables = {
            PGHOST = "${aws_rds_cluster.waze_database_cluster.endpoint}"
            PGUSER = "${postgresql_role.lambda_role.name}"
            PGPASSWORD = "${postgresql_role.lambda_role.password}"
            PGDATABASE = "${aws_rds_cluster.waze_database_cluster.database_name}"
            PGPORT = "${var.rds_port}"
        }
    }
    tags {
        Environment = "${var.environment}"
        Scripted = "true"
    }
}

# setup jams processing lambda
resource "aws_lambda_function" "waze_data_jams_processing_function"{
    s3_bucket         = "${data.aws_s3_bucket_object.waze_data_processing_function_artifact.bucket}"
    s3_key            = "${data.aws_s3_bucket_object.waze_data_processing_function_artifact.key}"
    s3_object_version = "${data.aws_s3_bucket_object.waze_data_processing_function_artifact.version_id}"
    function_name = "${var.object_name_prefix}-waze-data-jams-processing"
    runtime = "nodejs6.10"
    role = "${aws_iam_role.data_retrieval_execution_role.arn}"
    handler = "waze-data-process.processDataJams"
    timeout = 300
    memory_size = 512 #TODO: JRS 2018-02-06 - test large files to see if we need more (or could get by with less) resources
    environment {
        variables = {
            PGHOST = "${aws_rds_cluster.waze_database_cluster.endpoint}"
            PGUSER = "${postgresql_role.lambda_role.name}"
            PGPASSWORD = "${postgresql_role.lambda_role.password}"
            PGDATABASE = "${aws_rds_cluster.waze_database_cluster.database_name}"
            PGPORT = "${var.rds_port}"
        }
    }
    tags {
        Environment = "${var.environment}"
        Scripted = "true"
    }
}

# setup irregularities processing lambda
resource "aws_lambda_function" "waze_data_irregularities_processing_function"{
    s3_bucket         = "${data.aws_s3_bucket_object.waze_data_processing_function_artifact.bucket}"
    s3_key            = "${data.aws_s3_bucket_object.waze_data_processing_function_artifact.key}"
    s3_object_version = "${data.aws_s3_bucket_object.waze_data_processing_function_artifact.version_id}"
    function_name = "${var.object_name_prefix}-waze-data-irregularities-processing"
    runtime = "nodejs6.10"
    role = "${aws_iam_role.data_retrieval_execution_role.arn}"
    handler = "waze-data-process.processDataIrregularities"
    timeout = 300
    memory_size = 512 #TODO: JRS 2018-02-06 - test large files to see if we need more (or could get by with less) resources
    environment {
        variables = {
            PGHOST = "${aws_rds_cluster.waze_database_cluster.endpoint}"
            PGUSER = "${postgresql_role.lambda_role.name}"
            PGPASSWORD = "${postgresql_role.lambda_role.password}"
            PGDATABASE = "${aws_rds_cluster.waze_database_cluster.database_name}"
            PGPORT = "${var.rds_port}"
        }
    }
    tags {
        Environment = "${var.environment}"
        Scripted = "true"
    }
}

################################################
# VPC
################################################

# in order to ensure that standing this up can't possibly run afoul of any existing infrastructure
# we'll opt to setup its own VPC and related items so that we can hopefully limit pain and suffering
# of any security folks

# we'll need to know what AZs are available in the region
data "aws_availability_zones" "available" {
    state = "available"
}

# create the VPC
resource "aws_vpc" "waze_vpc" {
    cidr_block = "${var.rds_vpc_cidr_block}"
    instance_tenancy = "default"
    enable_dns_hostnames = true

    tags {
        Name = "${var.object_name_prefix}-waze-vpc"
        Environment = "${var.environment}"
    }
}

# create the subnets
locals {
    # need the netmask of the rds cidr so we can calculate subnets
	rds_vpc_cidr_block_netmask = "${element(split("/", var.rds_vpc_cidr_block), 1)}"
}

resource "aws_subnet" "waze_subnets" {
    count = "3"
    vpc_id = "${aws_vpc.waze_vpc.id}"
    # calculate a /24 cidr inside our rds vpc
    cidr_block = "${cidrsubnet(var.rds_vpc_cidr_block, 24 - local.rds_vpc_cidr_block_netmask, count.index)}"
    availability_zone = "${data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]}"

    tags {
        Name = "${var.object_name_prefix}-waze-subnet-${format("%02d", count.index + 1)}"
        Environment = "${var.environment}"
    }
}

# create the internet gateway
resource "aws_internet_gateway" "waze_gateway" {
    vpc_id = "${aws_vpc.waze_vpc.id}"

    tags {
        Name = "${var.object_name_prefix}-waze-internet-gateway"
        Environment = "${var.environment}"
    }
}

# adjust the default route table
resource "aws_default_route_table" "waze_vpc_routes" {
    default_route_table_id = "${aws_vpc.waze_vpc.default_route_table_id}"

    route {
        cidr_block = "0.0.0.0/0"
        gateway_id = "${aws_internet_gateway.waze_gateway.id}"
    }

    tags {
        Name = "${var.object_name_prefix}-waze-route-table"
        Environment = "${var.environment}"
    }
}

# need a security group to allow traffic to the db
# TODO: JRS 2018-02-23 - probably want to rethink this later and lock down more
resource "aws_security_group" "allow_postgres_traffic" {
    name = "${var.object_name_prefix}-waze-db-security-group"
    description = "Allow postgres ingress"
    vpc_id = "${aws_vpc.waze_vpc.id}"
    # allow postgres port
    ingress {
        from_port = "${var.rds_port}"
        to_port = "${var.rds_port}"
        protocol = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "Allow Postgres from anywhere"
    }
    tags {
        Name = "${var.object_name_prefix}-waze-db-security-group"
        Environment = "${var.environment}"
    }
}

################################################
# RDS
################################################

# create db subnet groups
resource "aws_db_subnet_group" "waze_db_subnet_group" {
  name       = "${var.object_name_prefix}-waze-db-subnet-group"
  subnet_ids = ["${aws_subnet.waze_subnets.*.id}"]

  tags {
    Name = "${var.object_name_prefix}-waze-db-subnet-group"
    Environment = "${var.environment}"
  }
}

# create an aurora postegres cluster to add our rds instance to
resource "aws_rds_cluster" "waze_database_cluster" {
    cluster_identifier = "${var.object_name_prefix}-waze-data-aurora-cluster"
    engine = "aurora-postgresql"
    database_name = "waze_data"
    master_username = "${var.rds_master_username}"
    master_password = "${var.rds_master_password}"
    backup_retention_period = 3 # short because all the data could be regenerated easily
    preferred_backup_window = "02:00-04:00"
    preferred_maintenance_window = "wed:05:00-wed:06:00"
    port = "${var.rds_port}"
    vpc_security_group_ids = ["${aws_security_group.allow_postgres_traffic.id}"]
    storage_encrypted = false # not encrypted because it isn't really sensitive
    db_subnet_group_name = "${aws_db_subnet_group.waze_db_subnet_group.id}"
    final_snapshot_identifier = "${var.object_name_prefix}-db-final-snapshot"
    skip_final_snapshot = "${var.skip_final_db_snapshot_on_destroy}"
}

# create the actual DB instance
resource "aws_rds_cluster_instance" "waze_database_instances" {
  count              = 1 # keeping this here, set to 1, in case someone wants to easily increase it (expensive, though)
  identifier         = "${var.object_name_prefix}-waze-aurora-instance-${count.index}"
  cluster_identifier = "${aws_rds_cluster.waze_database_cluster.id}"
  instance_class     = "db.r4.large"
  publicly_accessible = true
  db_subnet_group_name = "${aws_db_subnet_group.waze_db_subnet_group.id}"
  engine = "aurora-postgresql"

  tags {
    Name = "${var.object_name_prefix}-waze-aurora-instance-${count.index}"
    Environment = "${var.environment}"
  }
}

################################################
# POSTGRESQL
################################################

# setup the pg provider
provider "postgresql" {
    host            = "${aws_rds_cluster.waze_database_cluster.endpoint}"
    port            = "${var.rds_port}"
    database        = "${aws_rds_cluster.waze_database_cluster.database_name}"
    username        = "${var.rds_master_username}"
    password        = "${var.rds_master_password}"
}

# generate a random string for the password
resource "random_string" "password" {
    length = 24
    special = true
}

# setup the new role
resource "postgresql_role" "lambda_role" {
    name     = "lambda_role"
    login    = true
    password = "${random_string.password.result}"

}

# setup the schema
resource "postgresql_schema" "waze_schema" {
    name  = "waze"
    owner = "${var.rds_master_username}"
    if_not_exists = true

    policy {
        create_with_grant = true
        usage_with_grant  = true
        role              = "${postgresql_role.lambda_role.name}"
    }
}