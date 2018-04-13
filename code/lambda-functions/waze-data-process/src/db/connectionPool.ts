import pg = require('pg') 
 
let pool: pg.Pool; 
 
export function getPool() { 
    if (pool) return pool; // if it is already there, grab it here 
    pool = new pg.Pool(); 
    return pool; 
} 