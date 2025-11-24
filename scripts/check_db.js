const fs = require('fs');
const { Pool } = require('pg');
(async ()=>{
  try{
    const env = fs.readFileSync('.env.local','utf8');
    const m = env.match(/DATABASE_URL=\s*\"?([^\r\n\"]+)\"?/);
    const url = m && m[1];
    if(!url) throw new Error('DATABASE_URL not found in .env.local');
    const pool = new Pool({ connectionString: url });
    const res = await pool.query("SELECT p.id, p.name, COALESCE(json_agg(json_build_object('id', m.id, 'name', m.name)) FILTER (WHERE m.id IS NOT NULL), '[]') AS materials FROM projects p LEFT JOIN materials m ON m.project_id = p.id GROUP BY p.id ORDER BY p.created_at DESC LIMIT 10");
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  }catch(err){
    console.error(err);
    process.exit(1);
  }
})();
