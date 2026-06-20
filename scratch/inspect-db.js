const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log("--- Tables ---");
  const tables = await client.query(`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  for (let row of tables.rows) {
    console.log(`- ${row.table_name} (${row.table_type})`);
  }

  console.log("\n--- ct_v_period_filter_options Schema ---");
  const periodSchema = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ct_v_period_filter_options';
  `);
  for (let row of periodSchema.rows) {
    console.log(`- ${row.column_name}: ${row.data_type}`);
  }

  console.log("\n--- ct_v_ruler_identity_resolved_v2 Schema ---");
  const rulerSchema = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ct_v_ruler_identity_resolved_v2';
  `);
  for (let row of rulerSchema.rows) {
    console.log(`- ${row.column_name}: ${row.data_type}`);
  }

  console.log("\n--- Period Types in ct_v_period_filter_options ---");
  const periodTypes = await client.query(`
    SELECT period_type_key, period_type_label_no, COUNT(*) 
    FROM ct_v_period_filter_options 
    GROUP BY period_type_key, period_type_label_no;
  `);
  console.table(periodTypes.rows);

  console.log("\n--- ct_import_raw_historical_rulers_no Schema ---");
  const rawRulersSchema = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ct_import_raw_historical_rulers_no';
  `);
  for (let row of rawRulersSchema.rows) {
    console.log(`- ${row.column_name}: ${row.data_type}`);
  }

  console.log("\n--- Counts in ct_sn_historical_identity_registry ---");
  const countRes = await client.query(`
    SELECT COUNT(*) as total, 
           COUNT(rule_start_year) as with_rule_start,
           COUNT(birth_year) as with_birth,
           COUNT(payload_json) as with_payload
    FROM ct_sn_historical_identity_registry;
  `);
  console.table(countRes.rows);

  console.log("\n--- ct_period86_media Schema ---");
  const mediaSchema = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ct_period86_media';
  `);
  for (let row of mediaSchema.rows) {
    console.log(`- ${row.column_name}: ${row.data_type}`);
  }

  console.log("\n--- Sample Media from ct_period86_media ---");
  const sampleMedia = await client.query(`
    SELECT *
    FROM ct_period86_media
    LIMIT 15;
  `);
  console.table(sampleMedia.rows);

  await client.end();
}

run().catch(console.error);
