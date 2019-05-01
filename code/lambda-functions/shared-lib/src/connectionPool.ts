import pg = require('pg') 
 
let pool: pg.Pool; 
 
export function getPool() { 
    if (pool) return pool; // if it is already there, grab it here 
    
    let connectionTimeoutMillis = process.env.CONNECTION_TIMEOUT_MILLIS || "30000";
    pool = new pg.Pool({
        connectionTimeoutMillis: parseInt(connectionTimeoutMillis), //time out connection after 30 seconds, more than that and something is probably wrong
        max: parseInt(process.env.POOLSIZE), //allow a single pool to open X connections max
        idleTimeoutMillis: 2000, //time out an idle connection after 2 seconds, in an attempt to not leak connections while still being able to pool
    }); 
    pool.on('error', function(err, client){
        //capture and info-log it
        console.info('Captured connection pool error: ', err);
    });
    return pool; 
} 