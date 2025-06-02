import { db } from './index';
import { createTables } from './schema';

async function migrate() {
  console.log('🔄 Running database migrations...');
  try {
    await createTables(db);
    console.log('✅ Migrations complete!');
    
    // Add magic_links table if not in schema
    await db.schema
      .createTable('magic_links')
      .ifNotExists()
      .addColumn('token', 'text', (col) => col.primaryKey())
      .addColumn('userId', 'text', (col) => col.notNull())
      .addColumn('expiresAt', 'timestamp', (col) => col.notNull())
      .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
      .execute();
    
    console.log('✅ All tables created successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  migrate();
} 