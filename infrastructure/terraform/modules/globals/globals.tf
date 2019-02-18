# Variable definitions
variable "environment" {
  type        = "string"
  description = "Name for the environment being deployed to"
}

# Output definitions
output "environment" {
  value = "${var.environment}"
}

output "environment_lowercase" {
  value = "${lower(var.environment)}"
}

# as a rule, we're going to prefix object names with "lower(env)-tf", so setup a var for it
# the reason for this is to make it easy to determine what resources belong to what environement
# and what resources were created (and should be managed) by terraform
output "object_name_prefix" {
  value = "${lower(var.environment)}-tf"
}

#########################################################
# hard-coded values output for re-use elsewhere
#########################################################

# region where resources will be created by default
output "default_resource_region" {
  value = "us-east-1"
}

output "waze_data_url" {
  value = "YOUR SPECIFIC WAZE DATA URL HERE"
}

output "rds_master_username" {
  value = "waze_admin"
}

output "rds_master_password" {
  value = "YOUR DESIRED PASSWORD HERE"
}

output "rds_readonly_username" {
  value = "waze_readonly"
}

output "rds_readonly_password" {
  value = "YOUR DESIRED PASSWORD HERE"
}

# set a password that we'll later make sure exists in the db on the lambda_role user
output "lambda_db_password" {
  value = "YOUR PASSWORD FOR LAMBDA IN POSTGRES"
}
