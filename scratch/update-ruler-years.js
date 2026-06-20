const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const rulersUpdate = [
  { key: 'harald-v', start: 1991, end: null, birth: 1937, death: null },
  { key: 'olav-v', start: 1957, end: 1991, birth: 1903, death: 1991 },
  { key: 'haakon-vii', start: 1905, end: 1957, birth: 1872, death: 1957 },
  { key: 'oscar-ii', start: 1872, end: 1905, birth: 1829, death: 1907 },
  { key: 'karl-iv', start: 1859, end: 1872, birth: 1826, death: 1872 },
  { key: 'oscar-i', start: 1844, end: 1859, birth: 1799, death: 1859 },
  { key: 'karl-iii-johan', start: 1814, end: 1844, birth: 1763, death: 1844 },
  { key: 'frederik-vi', start: 1808, end: 1814, birth: 1768, death: 1839 },
  { key: 'christian-vii', start: 1766, end: 1808, birth: 1749, death: 1808 },
  { key: 'frederik-iv', start: 1699, end: 1730, birth: 1671, death: 1730 }
];

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log("Updating ruler years in ct_sn_historical_identity_registry...");
  for (let r of rulersUpdate) {
    const res = await client.query(`
      UPDATE ct_sn_historical_identity_registry
      SET rule_start_year = $1,
          rule_end_year = $2,
          birth_year = $3,
          death_year = $4
      WHERE identity_key = $5
      RETURNING identity_key, display_name_no, rule_start_year, rule_end_year;
    `, [r.start, r.end, r.birth, r.death, r.key]);
    if (res.rowCount > 0) {
      console.log(`Updated ${res.rows[0].display_name_no} (${res.rows[0].identity_key}): ${res.rows[0].rule_start_year} - ${res.rows[0].rule_end_year}`);
    } else {
      console.log(`Failed to update ${r.key} (key not found)`);
    }
  }

  await client.end();
}

run().catch(console.error);
