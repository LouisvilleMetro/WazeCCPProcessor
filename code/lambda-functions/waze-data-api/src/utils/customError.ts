export class customHttpError extends Error {
    httpStatus : number;
    errors?: string[];

    constructor (httpStatus: number, message: string, errors?: string[]){
        super(message);
        //this.message = message;
        this.httpStatus = httpStatus
        this.errors = errors;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, customHttpError);
        }
    }
}