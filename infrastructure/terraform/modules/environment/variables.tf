variable "environment" { type = "string" }
variable "default_resource_region" { type = "string" }
variable "s3_artifacts_bucket" { type = "string" }
variable "waze_data_url" { type = "string" }
variable "object_name_prefix" { type = "string"}

variable "enable_data_retrieved_sns_topic" { 
    type = "string" # TF doesn't have a true boolean type yet, sorry
    description = "Whether or not we publish to an SNS topic to notify on data retrieved"
}

variable "enable_data_processor_dlq_sns_topic" { 
    type = "string" # TF doesn't have a true boolean type yet, sorry
    description = "Whether or not we publish to an SNS topic to notify on queue records hitting the dead letter queue from processing"
}

variable "enable_data_processed_sns_topic" { 
    type = "string" # TF doesn't have a true boolean type yet, sorry
    description = "Whether or not we publish to an SNS topic to notify on queue records successfully processed"
}