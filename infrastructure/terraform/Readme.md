
## Terraform Setup

1. Download the [latest version](https://www.terraform.io/downloads.html) v0.11, unzip, and [set the path](https://www.terraform.io/intro/getting-started/install.html) (eg, sudo ln -s terraform terraform).
1. Give [Terraform access](https://www.terraform.io/docs/configuration/index.html) to your AWS account's APIs, by creating a \*.tf file in your Terraform project directory. (?)
 
## Notes

- You'll need to update the `/infrastructure/terraform/backend/config` file to contain the name of your state management bucket before running any of the terraform configs.

- To avoid duplicating backend config all over the place, each root tf file should only specify the state file name.  We'll then use the backend config file at backend/config to specify the parts that never change.  This will be loaded using the `-backend-config="path to config"` arg when running `terraform init`.

- There are values in both `backend/config` and `modules/globals/globals.tf` that need to be updated to match your setup.  Please refer to other readme files and comments for more info.
