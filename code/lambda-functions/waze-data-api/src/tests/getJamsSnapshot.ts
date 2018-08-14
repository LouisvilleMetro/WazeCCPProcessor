import * as api from "../waze-data-api";

let event = { 
    "resource": "/jams-snapshot", 
    "path": "/jams-snapshot", 
    "httpMethod": "GET", 
    "headers": 
    { 
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8", 
        "Accept-Encoding": "gzip, deflate, br", 
        "Accept-Language": "en-US,en;q=0.9", 
        "CloudFront-Forwarded-Proto": "https", 
        "CloudFront-Is-Desktop-Viewer": "true", 
        "CloudFront-Is-Mobile-Viewer": "false", 
        "CloudFront-Is-SmartTV-Viewer": "false", 
        "CloudFront-Is-Tablet-Viewer": "false", 
        "CloudFront-Viewer-Country": "US", 
        "Host": "ap916i6ej9.execute-api.us-east-1.amazonaws.com", 
        "upgrade-insecure-requests": "1", 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36", 
        "Via": "2.0 eac6de8b8ffcf4d5a480e00422a7a4f8.cloudfront.net (CloudFront)", 
        "X-Amz-Cf-Id": "Kdfy8ziEJJxdgTyLHzfF2isimzw-V_bnMW4NrQrt_uysBQOuP_Kexw==", 
        "X-Amzn-Trace-Id": "Root=1-5b72d144-e561a1a8c4a288181bf51cd0", 
        "X-Forwarded-For": "107.142.220.121, 216.137.42.16", 
        "X-Forwarded-Port": "443", 
        "X-Forwarded-Proto": "https" 
    }, 
    "queryStringParameters": 
    { 
        "date": "2018-08-13", 
        "minLon": "-100", 
        "maxLat": "100", 
        "minLat": "-100", 
        "format": "json", 
        "maxLon": "100", 
        "time": "12:02",
        "fields": "city,delay,id,speed"
    }, 
    "pathParameters": <any>null, 
    "stageVariables": <any>null, 
    "requestContext": 
    { 
        "resourceId": "i2hxjm", 
        "resourcePath": "/jams-snapshot", 
        "httpMethod": "GET", 
        "extendedRequestId": "LnWisHSiIAMFmqA=", 
        "requestTime": "14/Aug/2018:12:55:32 +0000", 
        "path": "/waze/jams-snapshot", 
        "accountId": "223308997288", 
        "protocol": "HTTP/1.1", 
        "stage": "waze", 
        "requestTimeEpoch": 1534251332400, 
        "requestId": "54249c13-9fc1-11e8-b812-fd6bbc9bf9b7", 
        "identity": 
        { 
            "cognitoIdentityPoolId": <any>null, 
            "accountId": <any>null, 
            "cognitoIdentityId": <any>null, 
            "caller": <any>null, 
            "sourceIp": "107.142.220.121", 
            "accessKey": <any>null, 
            "cognitoAuthenticationType": <any>null, 
            "cognitoAuthenticationProvider": <any>null, 
            "userArn": <any>null, 
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36", 
            "user": <any>null 
        }, 
        "apiId": "ap916i6ej9" 
    }, 
    "body": <any>null, 
    "isBase64Encoded": false };


api.getJamsSnapshot(event, null, function() { console.log("callback")});