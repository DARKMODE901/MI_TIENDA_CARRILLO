import { eq, or, isNull, lt, desc } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { db } from '@/db/client';
import { products, type Product } from '@/db/schema';

export interface CreateProductInput {
  name: string;
  quantity: number;
  price: number;
}

export interface UpdateProductInput {
  name: string;
  quantity: number;
  price: number;
}

/**
 * Patrón Repositorio para la tabla 'products'.
 * Todas las operaciones sobre SQLite se concentran aquí.
 */
export const productRepository = {
  /**
   * Consulta base para el hook reactivo useLiveQuery.
   */
  getLiveQuery() {
    return db.select().from(products).orderBy(desc(products.updatedAt));
  },

  /**
   * Obtiene todos los productos ordenados por fecha de actualización descendente.
   */
  async getAll(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.updatedAt));
  },

  /**
   * Obtiene un producto por su id local (clave primaria de SQLite).
   */
  async getById(id: number): Promise<Product | undefined> {
    const rows = await db.select().from(products).where(eq(products.id, id));
    return rows[0];
  },

  /**
   * Obtiene un producto por su clientId (UUID universal).
   */
  async getByClientId(clientId: string): Promise<Product | undefined> {
    const rows = await db.select().from(products).where(eq(products.clientId, clientId));
    return rows[0];
  },

  /**
   * Crea un producto nuevo en SQLite con clientId UUID y updatedAt actual.
   * syncedAt queda en null (pendiente de sincronizar).
   */
  async create(input: CreateProductInput): Promise<Product> {
    const now = new Date();
    const clientId = Crypto.randomUUID();

    const [inserted] = await db
      .insert(products)
      .values({
        clientId,
        name: input.name.trim(),
        quantity: Math.floor(input.quantity),
        price: Math.floor(input.price),
        updatedAt: now,
        syncedAt: null,
      })
      .returning();

    return inserted;
  },

  /**
   * Actualiza un producto existente asignando updatedAt: new Date().
   */
  async update(id: number, input: UpdateProductInput): Promise<Product | undefined> {
    const now = new Date();

    const [updated] = await db
      .update(products)
      .set({
        name: input.name.trim(),
        quantity: Math.floor(input.quantity),
        price: Math.floor(input.price),
        updatedAt: now,
      })
      .where(eq(products.id, id))
      .returning();

    return updated;
  },

  /**
   * Elimina un producto de la base de datos local por su id.
   */
  async delete(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  },

  /**
   * Retorna los productos que no se han subido a la nube:
   * (syncedAt es null O syncedAt < updatedAt).
   */
  async getPendingSync(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(or(isNull(products.syncedAt), lt(products.syncedAt, products.updatedAt)));
  },

  /**
   * Marca un producto como sincronizado actualizando syncedAt.
   */
  async markAsSynced(clientId: string, syncedAt: Date): Promise<void> {
    await db
      .update(products)
      .set({ syncedAt })
      .where(eq(products.clientId, clientId));
  },

  /**
   * Inserta un producto descargado de Supabase si no existe localmente.
   * Se marca inmediatamente como sincronizado (syncedAt = updatedAt).
   */
  async insertFromRemote(remote: {
    clientId: string;
    name: string;
    quantity: number;
    price: number;
    updatedAt: Date;
  }): Promise<boolean> {
    const existing = await this.getByClientId(remote.clientId);
    if (existing) {
      // Ya existe en local, no se duplica
      return false;
    }

    await db.insert(products).values({
      clientId: remote.clientId,
      name: remote.name,
      quantity: remote.quantity,
      price: remote.price,
      updatedAt: remote.updatedAt,
      syncedAt: remote.updatedAt, // Marcado como sincronizado
    });

    return true;
  },

  /**
   * Verifica si un producto específico está pendiente de sincronización.
   */
  isPending(product: Product): boolean {
    if (!product.syncedAt) return true;
    const syncedTime = new Date(product.syncedAt).getTime();
    const updatedTime = new Date(product.updatedAt).getTime();
    return syncedTime < updatedTime;
  },
};

