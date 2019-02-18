/*************************************************************************************** 
Note that this script is always run, so everything in it must be idempotent (rerunnable)
IE, use "if not exists" liberally
***************************************************************************************/

-- Create read-only role
-- NOTE: don't change the placeholder text before provisioning the environment, as we replace it during initial install
/*CREATE ROLE READONLY_ROLE_NAME_PLACEHOLDER LOGIN PASSWORD 'READONLY_ROLE_PASSWORD_PLACEHOLDER';

GRANT USAGE ON SCHEMA waze TO READONLY_ROLE_NAME_PLACEHOLDER;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze GRANT SELECT ON SEQUENCES TO READONLY_ROLE_NAME_PLACEHOLDER;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze GRANT SELECT ON TABLES TO READONLY_ROLE_NAME_PLACEHOLDER;
*/