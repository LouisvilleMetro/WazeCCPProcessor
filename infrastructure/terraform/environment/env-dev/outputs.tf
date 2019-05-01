output "db_cluster_endpoint" {
    value = "${module.environment.db_cluster_endpoint}"
    description = "The db endpoint to use when connecting to the database"
}

output "incoming_files_bucket" {
    value = "${module.environment.incoming_files_bucket}"
    description = "The bucket where incoming files are stored before processing"
}

output "processed_files_bucket" {
    value = "${module.environment.processed_files_bucket}"
    description = "The bucket where processed files are stored after processing"
}

output "data_retrieved_sns_topic_arn" {
    value = "${module.environment.data_retrieved_sns_topic_arn}"
    description = "ARN of the SNS topic that will receive notifications when new files are retrieved"
}

output "data_processed_sns_topic_arn" {
    value = "${module.environment.data_processed_sns_topic_arn}"
    description = "ARN of the SNS topic that will receive notifications when files are processed"
}

output "data_in_queue_alarm_sns_topic_arn" {
    value = "${module.environment.data_in_queue_alarm_sns_topic_arn}"
    description = "ARN of the SNS topic that will receive notifications when records have been sitting in the work queue for an extended period"
}

output "data_processing_dlq_sns_topic_arn" {
    value = "${module.environment.data_processing_dlq_sns_topic_arn}"
    description = "ARN of the SNS topic that will receive notifications when records are found in the dead letter queue"
}

output "api_invoke_url" {
  value = "${module.environment.api_invoke_url}"
  description = "Base URL to invoke the API"
}

output "db_init_response" {
    value = "${module.environment.db_init_response}"
    description = "Response returned by DB initialization invocation"
}

output "simple_map_url" {
  value = "${module.environment.simple_map_url}"
  description = "URL to access simple map (if deployed)"
}