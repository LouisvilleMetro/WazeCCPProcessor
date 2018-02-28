
## Notes

- You'll need to update the `backend/config` file to contain the name of your state management bucket before running any of the terraform configs.

- To avoid duplicating backend config all over the place, each root tf file should only specify the state file name.  We'll then use the backend config file at backend/config to specify the parts that never change.  This will will be loaded using the `-backend-config="path to config"` arg when running `terraform init`.

- There are values in both `backend/config` and `modules/globals/globals.tf` that need to be updated to match your setup.  Please refer to other readme files and comments for more info.

- **IMPORTANT** - This config stands up infrastructure that is mostly cheap/free (depending on usage), but the database itself is pretty powerful and will result in monthly charges in excess of $200 (as of this writing).


## Terraform Example Commands

I like to run terraform in an empty directory away from the storage location of the actual files, so that I know I won't accidentally mess anything up or commit things that shouldn't be, so these examples reflect that.  Adjust accordingly for your usage.

terraform get &lt;path to root of terraform scripts&gt;\\&lt;environment folder&gt;

terraform init -from-module="&lt;path to root of terraform scripts&gt;\\&lt;environment folder&gt;" -backend-config="&lt;path to root of terraform scripts&gt;\backend\config"
