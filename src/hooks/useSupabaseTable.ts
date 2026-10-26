// src/hooks/useSupabaseTable.ts
// Hook reutilizable para conectar cualquier componente a una tabla de Supabase.
// Incluye carga inicial, estado reactivo, operaciones CRUD y suscripción en tiempo real opcional.

import { useState, useEffect, useCallback } from 'react';
import { crudService, QueryOptions } from '@/services/crudService';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface UseTableOptions extends QueryOptions {
  /** Si es true, se suscribe automáticamente a cambios en tiempo real */
  realtime?: boolean;
  /** Columna que actúa como identificador (por defecto 'id') */
  idColumn?: string;
  /** Si es false, no ejecuta la carga inicial automáticamente */
  autoFetch?: boolean;
}

export function useSupabaseTable<T = any>(
  tableName: string,
  options: UseTableOptions = {}
) {
  const {
    realtime = false,
    idColumn = 'id',
    autoFetch = true,
    ...queryOptions
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await crudService.getAll<T>(tableName, queryOptions);
      setData(results);
    } catch (err: any) {
      setError(err?.message || 'Error cargando datos de Supabase');
    } finally {
      setLoading(false);
    }
  }, [tableName, JSON.stringify(queryOptions)]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }

    let channel: RealtimeChannel | null = null;
    if (realtime) {
      channel = crudService.subscribeToTable(tableName, () => {
        // Al detectar cualquier cambio remoto (insert, update, delete), recarga los datos
        fetchData();
      });
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [fetchData, autoFetch, realtime, tableName]);

  const create = async (item: Partial<T>): Promise<T[]> => {
    try {
      setError(null);
      const inserted = await crudService.insert<T>(tableName, item);
      if (!realtime) {
        await fetchData();
      }
      return inserted;
    } catch (err: any) {
      setError(err?.message || 'Error al insertar registro');
      throw err;
    }
  };

  const update = async (
    id: string | number,
    updates: Partial<T>
  ): Promise<T> => {
    try {
      setError(null);
      const updated = await crudService.update<T>(
        tableName,
        id,
        updates,
        idColumn
      );
      if (!realtime) {
        await fetchData();
      }
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar registro');
      throw err;
    }
  };

  const remove = async (id: string | number): Promise<void> => {
    try {
      setError(null);
      await crudService.delete(tableName, id, idColumn);
      if (!realtime) {
        await fetchData();
      }
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar registro');
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    create,
    update,
    remove,
  };
}

