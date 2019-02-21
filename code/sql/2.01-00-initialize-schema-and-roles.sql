/*************************************************************************************** 
Note that this script is always run, so everything in it must be idempotent (rerunnable)
IE, use "if not exists" liberally

Any errors will fail the script
***************************************************************************************/

-- This represents Schema as it was in the 2.0 version
-- in 2.0, this file was hand-edited and then hand-run
-- in 3.0, this is auto-run via lambda with placeholders replaced with terraform variables

CREATE SCHEMA IF NOT EXISTS waze;

-- create the lambda role
-- NOTE: don't change the placeholder text before provisioning the environment, as we replace it during initial install
-- this one will die if it already exists; no problem. 
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT                       -- SELECT list can stay empty for this
      FROM   pg_catalog.pg_roles
      WHERE  rolname = 'LAMBDA_ROLE_NAME_PLACEHOLDER') THEN

      CREATE ROLE LAMBDA_ROLE_NAME_PLACEHOLDER LOGIN PASSWORD 'LAMBDA_ROLE_PASSWORD_PLACEHOLDER';
   END IF;
END
$do$;

-- this one gets it if it has already been created
ALTER ROLE LAMBDA_ROLE_NAME_PLACEHOLDER LOGIN PASSWORD 'LAMBDA_ROLE_PASSWORD_PLACEHOLDER';

-- setup permissions for the lambda role
GRANT ALL ON SCHEMA waze TO LAMBDA_ROLE_NAME_PLACEHOLDER;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze GRANT ALL ON TABLES TO LAMBDA_ROLE_NAME_PLACEHOLDER;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze GRANT SELECT, USAGE ON SEQUENCES TO LAMBDA_ROLE_NAME_PLACEHOLDER;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze	GRANT EXECUTE ON FUNCTIONS TO LAMBDA_ROLE_NAME_PLACEHOLDER;
ALTER DEFAULT PRIVILEGES IN SCHEMA waze	GRANT USAGE ON TYPES TO LAMBDA_ROLE_NAME_PLACEHOLDER;
