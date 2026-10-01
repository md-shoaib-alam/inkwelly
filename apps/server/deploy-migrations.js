#!/usr/bin/env node
/**
 * Deploy schema optimization migrations to staging database
 * Usage: bun deploy-migrations.js
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Migrations to apply in order
const MIGRATIONS = [
  '0020_schema_optimization_p0.sql',
  '0021_normalize_parent_contacts.sql',
  '0022_add_academic_year_to_remaining_tables.sql',
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('   Make sure you have a .env file with your database credentials');
    process.exit(1);
  }

  console.log('🔌 Connecting to staging database...');
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Check which migrations have already been applied
    const existingMigrations = await client.query(`
      SELECT migration FROM drizzle.__drizzle_migrations 
      ORDER BY id DESC LIMIT 10
    `);
    
    console.log('Recent migrations:', existingMigrations.rows.map(r => r.migration).join(', '));
    console.log('');

    for (const migrationFile of MIGRATIONS) {
      const migrationPath = join(__dirname, 'drizzle', migrationFile);
      console.log(`📦 Applying ${migrationFile}...`);
      
      try {
        const sql = readFileSync(migrationPath, 'utf-8');
        
        // Split by statement-breakpoint separator used by drizzle-kit
        const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
        
        for (const statement of statements) {
          if (statement && !statement.startsWith('--')) {
            await client.query(statement);
          }
        }
        
        console.log(`✅ ${migrationFile} applied successfully\n`);
      } catch (error) {
        if (error.code === '42701') {
          // duplicate_column - already exists, skip
          console.log(`⚠️  ${migrationFile} already applied (duplicate), skipping\n`);
        } else if (error.code === '42P07') {
          // duplicate_table - already exists, skip
          console.log(`⚠️  ${migrationFile} already applied (table exists), skipping\n`);
        } else {
          console.error(`❌ Error applying ${migrationFile}:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n🎉 All migrations deployed successfully!');
    
    // Verify new columns exist
    const verifyColumns = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('Attendance', 'Grade', 'Fee', 'Assignment', 'Submission', 'ParentContact')
        AND column_name = 'academicYear' OR table_name = 'ParentContact'
      ORDER BY table_name, column_name
    `);
    
    console.log('\n✓ Verified columns:');
    verifyColumns.rows.forEach(row => {
      console.log(`  - ${row.table_name}.${row.column_name}`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
