// src/services/crudService.ts
// Servicio genérico para operaciones CRUD y Realtime con tablas de Supabase.

import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface QueryOptions {
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  eq?: { column: string; value: any };
}

export const crudService = {
  /**
   * Obtiene registros de cualquier tabla con filtros opcionales.
   */
  async getAll<T = any>(table: string, options: QueryOptions = {}): Promise<T[]> {
    let query = supabase.from(table).select(options.select || '*');

    if (options.eq) {
      query = query.eq(options.eq.column, options.eq.value);
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.ascending ?? true,
      });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error(`[crudService.getAll - ${table}] Error:`, error);
      throw error;
    }
    return (data as T[]) || [];
  },

  /**
   * Obtiene un registro por su ID o clave primaria.
   */
  async getById<T = any>(
    table: string,
    id: string | number,
    idColumn: string = 'id'
  ): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(idColumn, id)
      .single();

    if (error) {
      console.error(`[crudService.getById - ${table}] Error:`, error);
      throw error;
    }
    return data as T;
  },

  /**
   * Inserta uno o varios registros en la tabla.
   */
  async insert<T = any>(table: string, record: Partial<T> | Partial<T>[]): Promise<T[]> {
    const { data, error } = await supabase
      .from(table)
      .insert(record as any)
      .select();

    if (error) {
      console.error(`[crudService.insert - ${table}] Error:`, error);
      throw error;
    }
    return (data as T[]) || [];
  },

  /**
   * Actualiza un registro por su ID.
   */
  async update<T = any>(
    table: string,
    id: string | number,
    updates: Partial<T>,
    idColumn: string = 'id'
  ): Promise<T> {
    const { data, error } = await supabase
      .from(table)
      .update(updates as any)
      .eq(idColumn, id)
      .select()
      .single();

    if (error) {
      console.error(`[crudService.update - ${table}] Error:`, error);
      throw error;
    }
    return data as T;
  },

  /**
   * Elimina un registro por su ID.
   */
  async delete(
    table: string,
    id: string | number,
    idColumn: string = 'id'
  ): Promise<void> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq(idColumn, id);

    if (error) {
      console.error(`[crudService.delete - ${table}] Error:`, error);
      throw error;
    }
  },

  /**
   * Se suscribe a cambios en tiempo real (INSERT, UPDATE, DELETE) en una tabla.
   * Devuelve el canal para poder desuscribirse con channel.unsubscribe().
   */
  subscribeToTable(
    table: string,
    onChange: (payload: any) => void
  ): RealtimeChannel {
    return supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => onChange(payload)
      )
      .subscribe();
  },
};

