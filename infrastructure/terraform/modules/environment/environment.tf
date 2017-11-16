# setup the AWS provider
provider "aws" {
    region = "${var.default_resource_region}"
}

###############################################

module "globals" {
    source = "../globals"
    environment = "${var.environment}"
}

###############################################

# create a cloudwatch event that will run on a schedule
resource "aws_cloudwatch_event_rule" "data_retrieval_timer" { 
    name = "scripted-data-retrieval-timer-${module.globals.environment_to_lower}"
    description = "Cron job to get data from Waze periodically"
    schedule_expression = "rate(2 minutes)"
}

# TODO: create a trigger for the cloudwatch event that can trigger a lambda function
# resource "aws_cloudwatch_event_target" "data_retrieval_timer_target" { 
#     rule = "${aws_cloudwatch_event_rule.data_retrieval_timer.name}"
#     target_id = "data_retrieval_timer_target"
#     arn  = "${aws_lambda_function.data_retrieval_function.id}"
# }

# create the S3 bucket that will store our data files
# since bucket names have to be globally unique, and we're sharing this script,
# we'll inject the account id into the name
data "aws_caller_identity" "current" {}
resource "aws_s3_bucket" "waze_data_bucket" {
  bucket = "scripted-waze-data-${data.aws_caller_identity.current.account_id}-${module.globals.environment_to_lower}"
}

# create the SQS queue that will track new data
resource "aws_sqs_queue" "data_processing_queue" {
    name = "scripted-waze-data-processing-${module.globals.environment_to_lower}"
    #TODO: fill in more options of the queue
}

# TODO: create the dead letter queue

# TODO: create a cloudwatch alarm to monitor the dead letter queue

# TODO: create an SNS topic that can send notifications when alarm on dead letter queue fires

# TODO: create the lambda function that will get data from waze, store it in S3, notify the queue, and start the first round of processing

# create a service role for the data retriever lambda function
resource "aws_iam_role" "data_retrieval_execution_role" {
    name = "scripted-data-retrieval-execution-role-${module.globals.environment_to_lower}"
    assume_role_policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "lambda.amazonaws.com",
                    "events.amazonaws.com"
                ]
            }
        }
    ]
}
POLICY
}

# create a policy to allow access to the data bucket, the queue, and execution of the data processor
resource "aws_iam_policy" "data_retrieval_resource_access" {
  name = "scripted-data-and-queue-access-policy-${module.globals.environment_to_lower}"
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
