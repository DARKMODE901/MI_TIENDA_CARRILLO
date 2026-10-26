import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

/**
 * Tabla local de productos para SQLite gestionada con Drizzle ORM.
 * REGLA CRÍTICA: NO importar ningún módulo de Expo aquí para permitir que drizzle-kit funcione en Node.
 */
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: text('client_id').notNull().unique(),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp_ms' }),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

