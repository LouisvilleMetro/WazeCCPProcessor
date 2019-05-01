variable "api_gateway_rest_api_id" {
    type = "string"
}

variable "api_gateway_parent_id" {
    type = "string"
}

variable "resource_path_part" {
    type = "string"
}

variable "api_http_method" {
    type = "string"
}

variable "api_gateway_region" {
    type = "string"
}

variable "lambda_function_arn" {
    type = "string"
}

data "aws_caller_identity" "current" {}

# setup the resource
resource "aws_api_gateway_resource" "gateway_resource" {
  rest_api_id = "${var.api_gateway_rest_api_id}"
  parent_id   = "${var.api_gateway_parent_id}"
  path_part   = "${var.resource_path_part}"
}

# setup the method
resource "aws_api_gateway_method" "gateway_method" {
  rest_api_id   = "${var.api_gateway_rest_api_id}"
  resource_id   = "${aws_api_gateway_resource.gateway_resource.id}"
  http_method   = "${var.api_http_method}"
  authorization = "NONE"
  # TODO: require API key
}

# setup the integration between the api gateway and the lambda
resource "aws_api_gateway_integration" "gateway_integration" {
  rest_api_id             = "${var.api_gateway_rest_api_id}"
  resource_id             = "${aws_api_gateway_resource.gateway_resource.id}"
  http_method             = "${aws_api_gateway_method.gateway_method.http_method}"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.api_gateway_region}:lambda:path/2015-03-31/functions/${var.lambda_function_arn}/invocations"
  integration_http_method = "POST" # must be POST for lambda proxy integration
}

# give permissions for api to trigger lambda
resource "aws_lambda_permission" "gateway_lambda_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = "${var.lambda_function_arn}"
  principal     = "apigateway.amazonaws.com"

  # More: http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-control-access-using-iam-policies-to-invoke-api.html
  source_arn = "arn:aws:execute-api:${var.api_gateway_region}:${data.aws_caller_identity.current.account_id}:${var.api_gateway_rest_api_id}/*/${aws_api_gateway_method.gateway_method.http_method}${aws_api_gateway_resource.gateway_resource.path}"
}

# for CORS support, we also need to setup OPTIONS specifically
resource "aws_api_gateway_method" "options_method" {
  rest_api_id = "${var.api_gateway_rest_api_id}"
  resource_id = "${aws_api_gateway_resource.gateway_resource.id}"
  http_method = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = "${var.api_gateway_rest_api_id}"
  resource_id = "${aws_api_gateway_resource.gateway_resource.id}"
  http_method = "${aws_api_gateway_method.options_method.http_method}"
  type = "MOCK"
  request_templates = { 
    "application/json" = <<PARAMS
{ "statusCode": 200 }
PARAMS
  }
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  depends_on = ["aws_api_gateway_integration.options_integration"]
  rest_api_id = "${var.api_gateway_rest_api_id}"
  resource_id = "${aws_api_gateway_resource.gateway_resource.id}"
  http_method = "${aws_api_gateway_method.options_method.http_method}"
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS,GET,PUT,PATCH,DELETE'",
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
}

resource "aws_api_gateway_method_response" "options_method_200_response" {
  depends_on = ["aws_api_gateway_method.options_method"]
  rest_api_id = "${var.api_gateway_rest_api_id}"
  resource_id = "${aws_api_gateway_resource.gateway_resource.id}"
  http_method = "OPTIONS"
  status_code = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}