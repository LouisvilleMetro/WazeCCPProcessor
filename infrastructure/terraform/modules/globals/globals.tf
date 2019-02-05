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
  value = "us-west-2"
}

output "waze_data_url" {
  value = "https://na-georss.waze.com/rtserver/web/TGeoRSS?tk=ccp_partner&format=JSON&polygon=-85.8815002,38.1998782;-85.9069061,38.1631757;-85.9048462,38.0907962;-85.9213257,38.0307857;-85.9220123,38.0069841;-85.7558441,38.0740415;-85.6604004,38.0789061;-85.5560303,38.074582;-85.4283142,38.1151108;-85.4008484,38.2624456;-85.6288147,38.4191664;-85.641861,38.345426;-85.6555939,38.3147235;-85.6803131,38.2953258;-85.7462311,38.2624456;-85.7805634,38.2807741;-85.8190155,38.2807741;-85.8327484,38.2683759;-85.8403015,38.2306292;-85.8815002,38.1998782"
}

output "rds_master_username" {
  value = "waze_admin"
}

output "rds_master_password" {
  value = "masterpassword"
}

output "rds_readonly_username" {
  value = "waze_readonly"
}

output "rds_readonly_password" {
  value = "readonlypassword"
}

# set a password that we'll later make sure exists in the db on the lambda_role user
output "lambda_db_password" {
  value = "lambdapassword"
}
