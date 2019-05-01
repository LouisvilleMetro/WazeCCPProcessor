output "db_cluster_endpoint" {
    value = "${aws_rds_cluster.waze_database_cluster.endpoint}"
    description = "The db endpoint to use when connecting to the database"
}

output "incoming_files_bucket" {
    value = "${aws_s3_bucket.waze_data_incoming_bucket.id}"
    description = "The bucket where incoming files are stored before processing"
}

output "processed_files_bucket" {
    value = "${aws_s3_bucket.waze_data_processed_bucket.id}"
    description = "The bucket where processed files are stored after processing"
}

output "data_retrieved_sns_topic_arn" {
    value = "${aws_sns_topic.data_retrieved_sns_topic.arn}"
    description = "ARN of the SNS topic that will receive notifications when new files are retrieved"
}

output "data_processed_sns_topic_arn" {
    value = "${aws_sns_topic.data_processed_sns_topic.arn}"
    description = "ARN of the SNS topic that will receive notifications when files are processed"
}

output "data_in_queue_alarm_sns_topic_arn" {
    value = "${aws_sns_topic.data_in_queue_alarm_sns_topic.arn}"
    description = "ARN of the SNS topic that will receive notifications when records have been sitting in the work queue for an extended period"
}

output "data_processing_dlq_sns_topic_arn" {
    value = "${aws_sns_topic.data_processing_dlq_sns_topic.arn}"
    description = "ARN of the SNS topic that will receive notifications when records are found in the dead letter queue"
}

output "api_invoke_url" {
  value = "${aws_api_gateway_deployment.waze_api_gateway_deployment.invoke_url}"
  description = "Base URL to invoke the API"
}

output "simple_map_url" {
  # this looks weird, but don't worry, there's really only ever 1
  value = "${join(",", aws_s3_bucket.waze_simple_map_bucket.*.website_endpoint)}"
  description = "URL to access simple map (if deployed)"
}
