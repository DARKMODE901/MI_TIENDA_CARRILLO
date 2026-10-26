import { supabase } from '@/lib/supabase';
import { productRepository } from '@/db/repositories/products';

export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  message: string;
  error?: string;
}

/**
 * Servicio de sincronización bidireccional entre SQLite y Supabase.
 *
 * ORDEN ESTRICTO:
 * 1. Bajar: Descarga productos remotos de Supabase e inserta solo los que no existan localmente.
 * 2. Subir: Toma los productos pendientes en SQLite y los envía a Supabase con upsert (onConflict: client_id).
 */
export async function syncProducts(userId: string): Promise<SyncResult> {
  let downloadedCount = 0;
  let uploadedCount = 0;

  try {
    // ─── PASO 1 (BAJAR) ───────────────────────────────────────────────────
    const { data: remoteProducts, error: fetchError } = await supabase
      .from('products')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    if (remoteProducts && Array.isArray(remoteProducts)) {
      for (const remote of remoteProducts) {
        const clientId = remote.client_id;
        const updatedAt = new Date(remote.updated_at);

        // Insertar en SQLite únicamente los productos que no existan localmente
        const inserted = await productRepository.insertFromRemote({
          clientId,
          name: remote.name,
          quantity: Number(remote.quantity),
          price: Number(remote.price),
          updatedAt,
        });

        if (inserted) {
          downloadedCount++;
        }
      }
    }

    // ─── PASO 2 (SUBIR) ───────────────────────────────────────────────────
    const pendingProducts = await productRepository.getPendingSync();

    for (const p of pendingProducts) {
      const updatedAtDate = new Date(p.updatedAt);
      const updatedAtIso = updatedAtDate.toISOString();

      const { error: upsertError } = await supabase.from('products').upsert(
        {
          user_id: userId,
          client_id: p.clientId,
          name: p.name,
          quantity: p.quantity,
          price: p.price,
          updated_at: updatedAtIso,
        },
        { onConflict: 'client_id' }
      );

      if (upsertError) {
        throw upsertError;
      }

      // Tras subirlos con éxito, actualizar esos registros en SQLite marcándolos como sincronizados
      await productRepository.markAsSynced(p.clientId, updatedAtDate);
      uploadedCount++;
    }

    const message = `${uploadedCount} subidos, ${downloadedCount} bajados`;
    return {
      success: true,
      uploaded: uploadedCount,
      downloaded: downloadedCount,
      message,
    };
  } catch (error: any) {
    const errorMsg =
      error?.message ||
      'No hay conexión a internet o falló el servicio de sincronización.';

    return {
      success: false,
      uploaded: uploadedCount,
      downloaded: downloadedCount,
      message: `Error: ${errorMsg}`,
      error: errorMsg,
    };
  }
}

