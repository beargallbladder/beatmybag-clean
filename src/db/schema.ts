import { Kysely, SqliteDialect } from 'kysely';
import { DB } from '@libsql/kysely-libsql';

// Database types
export interface Database {
  users: UserTable;
  shots: ShotTable;
  sessions: SessionTable;
}

export interface UserTable {
  id: string;
  email: string;
  passwordHash: string;
  role: 'free' | 'pro' | 'dealer' | 'admin';
  credits: number;
  metadata: string;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
  createdAt: Date;
}

export interface ShotTable {
  id: string;
  userId: string;
  ballSpeed: number;
  launchAngle: number;
  spinRate: number;
  carry: number;
  total: number;
  club: string;
  imageUrl: string;
  confidence: number;
  tags: string; // JSON array stored as string
  createdAt: Date;
}

export interface SessionTable {
  id: string;
  dealerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  tags: string; // JSON array stored as string
  shots: string; // JSON array of shot IDs
  sharedAt: Date | null;
  createdAt: Date;
}

// Create database instance
export function createDb(url: string): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new SqliteDialect({
      database: new DB(url)
    })
  });
}

// Migration to create tables
export const createTables = async (db: Kysely<Database>) => {
  // Users table
  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('email', 'text', (col) => col.notNull().unique())
    .addColumn('passwordHash', 'text', (col) => col.notNull())
    .addColumn('role', 'text', (col) => col.notNull()) // 'free', 'pro', 'dealer', 'admin'
    .addColumn('credits', 'integer', (col) => col.notNull().defaultTo(10))
    .addColumn('metadata', 'text', (col) => col.defaultTo('{}')) // For OAuth providers
    .addColumn('stripeCustomerId', 'text') // Stripe customer ID
    .addColumn('subscriptionId', 'text') // Stripe subscription ID
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Shots table
  await db.schema
    .createTable('shots')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) => col.notNull())
    .addColumn('ballSpeed', 'real', (col) => col.notNull())
    .addColumn('launchAngle', 'real', (col) => col.notNull())
    .addColumn('spinRate', 'real', (col) => col.notNull())
    .addColumn('carry', 'real', (col) => col.notNull())
    .addColumn('total', 'real', (col) => col.notNull())
    .addColumn('club', 'text', (col) => col.notNull())
    .addColumn('imageUrl', 'text', (col) => col.notNull())
    .addColumn('confidence', 'real', (col) => col.notNull().defaultTo(1.0))
    .addColumn('tags', 'text', (col) => col.notNull().defaultTo('[]'))
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .addForeignKeyConstraint('userId_fk', ['userId'], 'users', ['id'])
    .execute();

  // Create indexes
  await db.schema
    .createIndex('shots_userId_idx')
    .on('shots')
    .column('userId')
    .execute();

  await db.schema
    .createIndex('shots_createdAt_idx')
    .on('shots')
    .column('createdAt')
    .execute();

  // Sessions table
  await db.schema
    .createTable('sessions')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('dealerId', 'text', (col) => col.notNull())
    .addColumn('customerName', 'text', (col) => col.notNull())
    .addColumn('customerEmail', 'text', (col) => col.notNull())
    .addColumn('customerPhone', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('notes', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('tags', 'text', (col) => col.notNull().defaultTo('[]'))
    .addColumn('shots', 'text', (col) => col.notNull().defaultTo('[]'))
    .addColumn('sharedAt', 'timestamp')
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .addForeignKeyConstraint('dealerId_fk', ['dealerId'], 'users', ['id'])
    .execute();

  // Create indexes
  await db.schema
    .createIndex('sessions_dealerId_idx')
    .on('sessions')
    .column('dealerId')
    .execute();
}; 