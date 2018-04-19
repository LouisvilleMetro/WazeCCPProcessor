import pg = require('pg') 
 
let pool: pg.Pool; 
 
export function getPool() { 
    if (pool) return pool; // if it is already there, grab it here 
    pool = new pg.Pool(); 
    return pool; 
} 

// end the connection pool so; must be called or lambda will steal connections for long periods
export async function closePool() {
    if(pool){
        await pool.end();
        pool = null;
    }
}