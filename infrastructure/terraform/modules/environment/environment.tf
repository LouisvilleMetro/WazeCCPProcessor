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
resource "aws_s3_bucket" "waze_data_bucket" {
    bucket = "${var.object_name_prefix}-waze-data-${data.aws_caller_identity.current.account_id}"
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
resource "aws_sns_topic" "data_retrieved_sns_topic" {
    name = "${var.object_name_prefix}-waze-data-retrieved-notification"
    display_name = "${var.object_name_prefix}-waze-data-retrieved-notification"
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
  statement_id  = "AllowExecutionFromSNS"
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
          "${aws_s3_bucket.waze_data_bucket.arn}/",
          "${aws_s3_bucket.waze_data_bucket.arn}/*"
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


################################################
# Lambdas
################################################

# we'll use a dummy lambda deploy zip to get terraform to provision a lambda that we're not ready to deploy yet
data "archive_file" "dummy_lambda_node_archive" {
    type = "zip"
    output_path = "${path.module}/.terraform/archive_files/handler_node.zip"
    source_content = "console.log('dummy');"
    source_content_filename = "index.js"
}

# setup placeholder for data retrieve lambda
resource "aws_lambda_function" "waze_data_retrieval_function"{
    # TODO: JRS 2018-02-05 - update this definition to instead pull from artifacts
    lifecycle {
      ignore_changes = ["filename", "source_code_hash"] # make sure tf doesn't overwrite the deployed code once we start deploying
    }
    function_name = "${var.object_name_prefix}-waze-data-retrieval"
    runtime = "nodejs6.10"
    role = "${aws_iam_role.data_retrieval_execution_role.arn}"
    handler = "waze-data-download.downloadData"
    filename = "${data.archive_file.dummy_lambda_node_archive.output_path}"
    timeout = 300
    memory_size = 256
    source_code_hash = "${data.archive_file.dummy_lambda_node_archive.output_base64sha256}"
    environment {
        variables = {
            WAZEDATAURL = "${var.waze_data_url}"
            WAZEDATABUCKET = "${aws_s3_bucket.waze_data_bucket.id}"
            SQSURL = "${aws_sqs_queue.data_processing_queue.id}"
            SNSTOPIC = "${var.enable_waze_data_retrieved_sns_topic == "true" ? aws_sns_topic.data_retrieved_sns_topic.arn : "" }"
        }
    }
    tags {
        Environment = "${var.environment}"
        Scripted = "true"
    }
}

# setup placeholder for data processing lambda
resource "aws_lambda_function" "waze_data_processing_function"{
    # TODO: JRS 2018-02-05 - update this definition to instead pull from artifacts
    lifecycle {
      ignore_changes = ["filename", "source_code_hash"] # make sure tf doesn't overwrite the deployed code once we start deploying
    }
    function_name = "${var.object_name_prefix}-waze-data-processing"
    runtime = "nodejs6.10"
    role = "${aws_iam_role.data_retrieval_execution_role.arn}"
    handler = "wazw-data-process.processData"
    filename = "${data.archive_file.dummy_lambda_node_archive.output_path}"
    timeout = 300
    memory_size = 256
    source_code_hash = "${data.archive_file.dummy_lambda_node_archive.output_base64sha256}"
    environment {
        variables = {
            WAZEDATABUCKET = "${aws_s3_bucket.waze_data_bucket.id}"
            SQSURL = "${aws_sqs_queue.data_processing_queue.id}"
            SNSTOPIC = "${var.enable_waze_data_retrieved_sns_topic == "true" ? aws_sns_topic.data_processed_sns_topic.arn : "" }"
        }
    }
    tags {
        Environment = "${var.environment}"
        Scripted = "true"
    }
}