
# Variable definitions
variable "environment" { 
    type = "string" 
    description = "Name for the environment being deployed to"
}
variable "default_resource_region" { 
    type = "string" 
    description = "Default region to use for provisioning AWS resources"
}



# Output definitions
output "environment" { value = "${var.environment}" }
output "environment_lowercase" { value = "${lower(var.environment)}" }
output "default_resource_region" { value = "${var.default_resource_region}" }
output "remote_state_bucket" { value = "petfirst-terraform-state-management-bucket" }
output "remote_state_bucket_region" { value = "us-east-1" }

# as a rule, we're going to prefix object names with "lower(env)-tf", so setup a var for it
# the reason for this is to make it easy to determine what resources belong to what environement
# and what resources were created (and should be managed) by terraform
output "object_name_prefix" { value = "${lower(var.environment)}-tf"}
