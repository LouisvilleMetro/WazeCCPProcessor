export function buildCorsResponse(statusCode: number, body: string) {
    return {
        statusCode: statusCode,
        body: body,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    }
}