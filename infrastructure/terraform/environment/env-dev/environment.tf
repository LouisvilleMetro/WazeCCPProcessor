# setup the s3 backend for storing state
# see config file in backend folder for further required settings
terraform {
    backend "s3" {
        # name of the state file, unique per environment; could instead tweak it and use workspaces
        key = "env-dev-waze-data-processor.tfstate" 
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
