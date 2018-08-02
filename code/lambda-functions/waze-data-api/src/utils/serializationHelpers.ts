export function deserializeFloat(params: {[name: string]: string}, querystringKey: string, objectKey: string, object: any, errorsArray: Array<string>) {
    //skip if it isn't even there
    if(!params[querystringKey]){
        return;
    }   

    //attempt to parse the float
    let parsedVal = parseFloat(params[querystringKey]);

    //if it parsed fine, we can set it and move on
    if(!Number.isNaN(parsedVal)){
        object[objectKey] = parsedVal;
        return;
    }

    //need to set an error, since it clearly didn't parse properly
    errorsArray.push(`Could not parse ${querystringKey}`);
    return;
}

export function deserializeInteger(params: {[name: string]: string}, querystringKey: string, objectKey: string, object: any, errorsArray: Array<string>) {
    //skip if it isn't even there
    if(!params[querystringKey]){
        return;
    }   

    //attempt to parse the int
    let parsedVal = parseInt(params[querystringKey]);

    //if it parsed fine, we can set it and move on
    if(!Number.isNaN(parsedVal)){
        object[objectKey] = parsedVal;
        return;
    }

    //need to set an error, since it clearly didn't parse properly
    errorsArray.push(`Could not parse ${querystringKey}`);
    return;
}

export function deserializeIntegerArray(params: {[name: string]: string}, querystringKey: string, objectKey: string, object: any, errorsArray: Array<string>) {
    //skip if it isn't even there
    if(!params[querystringKey]){
        return;
    }   

    //split the value on commas
    let splitValue = params[querystringKey].split(',');
    let parsedArray = new Array<number>();

    for (let i = 0; i < splitValue.length; i++) {
        //attempt to parse the int
        let parsedVal = parseInt(splitValue[i]);

        //if it didn't parse, kick out of the loop
        if(Number.isNaN(parsedVal)){
            return;
        }

        //parsed fine, so add it to the array
        parsedArray.push(parsedVal);
    }

    //if the parsed array and split array are the same size, then we managed to parse everything
    //set the value on the object and exit
    if(parsedArray.length === splitValue.length){
        object[objectKey] = parsedArray;
        return;
    }

    //need to set an error, since it clearly didn't parse properly
    errorsArray.push(`Could not parse ${querystringKey}`);
    return;
}

export function deserializeBoolean(params: {[name: string]: string}, querystringKey: string, objectKey: string, object: any, errorsArray: Array<string>) {
    //skip if it isn't even there
    if(!params[querystringKey]){
        return;
    }   

    //attempt to parse the value, which in this case means lower it then make sure it is either "true" or "false"
    switch (params[querystringKey].toLowerCase()) {
        case 'true':
            object[objectKey] = true;
            return;
        case 'false':
            object[objectKey] = false;
            return;
        default:
            break;
    }

    //need to set an error, since it clearly didn't parse properly
    errorsArray.push(`Could not parse ${querystringKey}`);
    return;
}