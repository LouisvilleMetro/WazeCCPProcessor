import pg = require('pg') 
 
let pool: pg.Pool; 
 
export function getPool() { 
    if (pool) return pool; // if it is already there, grab it here 
    pool = new pg.Pool({
        connectionTimeoutMillis: 30000, //time out connection after 30 seconds, more than that and something is probably wrong
        max: 20, //allow a single pool to open 20 connections max
        idleTimeoutMillis: 2000, //time out an idle connection after 2 seconds, in an attempt to not leak connections while still being able to pool
    }); 
    pool.on('error', function(err, client){
        //capture and info-log it
        console.info('Captured connection pool error: ', err);
    });
    return pool; 
} 

// end the connection pool so; must be called or lambda will steal connections for long periods
export async function closePool() {
    if(pool){
        await pool.end();
        pool = null;
    }
}