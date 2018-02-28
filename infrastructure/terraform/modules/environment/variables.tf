variable "environment" { type = "string" }
variable "default_resource_region" { type = "string" }
variable "s3_artifacts_bucket" { type = "string" }
variable "waze_data_url" { type = "string" }
variable "object_name_prefix" { type = "string"}

variable "rds_master_username" { type = "string" }
variable "rds_master_password" { type = "string" }
variable "rds_port" { 
    type = "string"
    default = "5432" # standard default postegres port
}

variable "rds_vpc_cidr_block" {
    type = "string"
    description = "CIDR block to use to create a VPC to put resources in - see comments for more info"
    default = "10.20.0.0/16"
    # The cidr block above must be valid for AWS VPC and must be large enough that 3 subnets of /24 can be created
    # The subnets will be created by incrementing the 3rd octet by 1 for each subnet
    # In general, just do a *.*.0.0/16 and everything will be fine
}

variable "enable_data_processor_dlq_sns_topic" { 
    type = "string" # TF doesn't have a true boolean type yet, sorry
    description = "Whether or not we publish to an SNS topic to notify on queue records hitting the dead letter queue from processing"
}

variable "enable_data_processed_sns_topic" { 
    type = "string" # TF doesn't have a true boolean type yet, sorry
    description = "Whether or not we publish to an SNS topic to notify on queue records successfully processed"
}

variable "skip_final_db_snapshot_on_destroy" { 
    type = "string" # TF doesn't have a true boolean type yet, sorry
    description = "Whether or not skip taking a final DB snapshot when destroying the stack"
}

variable "empty_s3_buckets_before_destroy" { 
    type = "string" # TF doesn't have a true boolean type yet, sorry
    description = "Whether or not to delete everything in the buckets on destruction, so they can be destroyed without error"
}


