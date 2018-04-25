# setup the s3 backend for storing state
# see config file in backend folder for further required settings
terraform {
    backend "s3" {
        # name of the state file, unique per environment; could instead tweak it and use workspaces
        key = "env-dev-waze-data-processor.tfstate" 
    }
}

###############################################

module "globals" {
    source = "../../modules/globals"
    environment = "Development"
}

# load the environment module, passing variables when available from the globals output (see globals module readme for the 'why')
module "environment" {
    source = "../../modules/environment"
    environment = "${module.globals.environment}"
    object_name_prefix = "${module.globals.object_name_prefix}"

    # consider whether you want these on or not and the potential cost impact
    enable_data_processor_dlq_sns_topic = "true"
    enable_data_processed_sns_topic = "true"

    # don't do this for production environments, but ok to skip it for dev 
    skip_final_db_snapshot_on_destroy = "true"
    # likewise for this one
    empty_s3_buckets_before_destroy = "true"

    default_resource_region = "${module.globals.default_resource_region}" # see globals.tf to change
    s3_artifacts_bucket = "${module.globals.s3_artifacts_bucket}" # see globals.tf to change
    waze_data_url = "${module.globals.waze_data_url}" # see globals.tf to change
    rds_master_username = "${module.globals.rds_master_username}" # see globals.tf to change
    rds_master_password = "${module.globals.rds_master_password}" # see globals.tf to change
    lambda_db_username = "${module.globals.lambda_db_username}" # see globals.tf to change
    lambda_db_password = "${module.globals.lambda_db_password}" # see globals.tf to change
    
    # Remove the comment from this variable to set your own CIDR block range to avoid conflicts
    # rds_vpc_cidr_block = "10.20.0.0/16"
}
