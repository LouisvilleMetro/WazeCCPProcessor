# setup the s3 backend for storing state
terraform {
    backend "s3" {
        bucket = "state management bucket name" # name of the state manangement bucket
        key = "env-dev-waze-data-processor.tfstate" # name of the state file, unique per environment; could instead tweak it and use workspaces
        region = "us-east-1" # region where state management bucket resides
    }
}

###############################################

# load the environment module
module "environment" {
    source = "../../modules/environment"
    environment = "Development"
    default_resource_region = "us-east-1"
    s3_artifacts_bucket = "bucket where lambda artifacts are stored" # name of the s3 bucket where the lambda function artifacts are stored
}
