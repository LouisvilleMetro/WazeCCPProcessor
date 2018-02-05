
# Variable definitions
variable "environment" { 
    type = "string" 
    description = "Name for the environment being deployed to"
}

# Output definitions
output "environment" { value = "${var.environment}" }
output "environment_lowercase" { value = "${lower(var.environment)}" }

# as a rule, we're going to prefix object names with "lower(env)-tf", so setup a var for it
# the reason for this is to make it easy to determine what resources belong to what environement
# and what resources were created (and should be managed) by terraform
output "object_name_prefix" { value = "${lower(var.environment)}-tf"}


#########################################################
# hard-coded values output for re-use elsewhere
#########################################################

# region where resources will be created by default
output "default_resource_region" { value = "us-east-1" }

# name of the remote state bucket
output "remote_state_bucket" { value = "YOUR STATE MANAGEMENT BUCKET NAME HERE" }

# region where remote state bucket is stored
output "remote_state_bucket_region" { value = "us-east-1" }

# Bucket where artifacts, such as lambda code bundles, are stored
output "s3_artifacts_bucket" { value = "YOUR ARTIFACT BUCKET NAME HERE" }