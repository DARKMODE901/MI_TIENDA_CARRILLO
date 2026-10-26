import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

/**
 * Conexión nativa con SQLite (Expo SDK 58).
 * Activa enableChangeListener para reactividad con useLiveQuery.
 */
export const expoDb = openDatabaseSync('mitienda.db', { enableChangeListener: true });

// Forzar llaves foráneas y optimizaciones SQLite
expoDb.execSync('PRAGMA foreign_keys = ON;');

/**
 * Instancia de Drizzle ORM sobre SQLite local.
 */
export const db = drizzle(expoDb, { schema });

