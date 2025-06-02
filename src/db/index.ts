import { createDb } from './schema';
import { config } from '../config';

export const db = createDb(config.DATABASE_URL); 