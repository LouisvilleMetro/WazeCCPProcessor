const origConMethods = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
};

export default function applyConsolePatch() {
    Object.keys(origConMethods).forEach(methodName => {
        (<any>console)[methodName] = function( obj:any, ...placeholders:any[] ){
            if ( typeof obj === 'string' )
                placeholders.unshift( methodName.toUpperCase() + ": " + obj );
            else
            {
                // This handles console.log( object )
                placeholders.unshift( obj );
                placeholders.unshift( methodName.toUpperCase() + ": %o" );
            }
        
            (<any>origConMethods)[methodName].apply( console, placeholders );
        }
    });
}