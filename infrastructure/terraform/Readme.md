
## Instructions

See the main ReadMe for details.

## Notes

- To avoid duplicating backend config all over the place, each root tf file should only specify the state file name.  We'll then use the backend config file at backend/config to specify the parts that never change.  This will be loaded using the `-backend-config="path to config"` arg when running `terraform init`.

