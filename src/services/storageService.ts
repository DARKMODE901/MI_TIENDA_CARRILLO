// src/services/storageService.ts
// Servicio para interactuar con Supabase Storage.
// NOTA IMPORTANTE: En React Native se DEBE usar ArrayBuffer para subir archivos (evita archivos de 0 bytes).

import { supabase } from '@/lib/supabase';

export interface UploadOptions {
  contentType?: string;
  upsert?: boolean;
}

export const storageService = {
  /**
   * Sube un archivo a un bucket de Supabase usando ArrayBuffer.
   * Compatible con URIs generadas por expo-image-picker o expo-camera.
   *
   * @param bucket Nombre del bucket en Supabase (ej: 'archivos', 'fotos', 'avatars')
   * @param path Ruta destino dentro del bucket (ej: 'usuarios/123/avatar.jpg')
   * @param localUri URI local del archivo (ej: 'file:///...')
   * @param options contentType y opción upsert
   */
  async uploadFile(
    bucket: string,
    path: string,
    localUri: string,
    options: UploadOptions = {}
  ): Promise<string> {
    const { contentType = 'image/jpeg', upsert = true } = options;

    // IMPORTANTE: En React Native fetch + arrayBuffer es la forma confiable para subida binaria
    const response = await fetch(localUri);
    const arrayBuffer = await response.arrayBuffer();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType,
        upsert,
      });

    if (error) {
      console.error('[storageService] Error subiendo archivo:', error);
      throw error;
    }

    return data.path;
  },

  /**
   * Obtiene la URL pública de un archivo (para buckets públicos).
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Genera una URL firmada temporal (para buckets privados).
   * @param expiresIn Tiempo de validez en segundos (por defecto 3600 = 1 hora)
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  /**
   * Elimina uno o más archivos de un bucket.
   */
  async deleteFiles(bucket: string, paths: string | string[]): Promise<void> {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    const { error } = await supabase.storage.from(bucket).remove(pathArray);
    if (error) throw error;
  },

  /**
   * Lista los archivos dentro de un bucket o carpeta.
   */
  async listFiles(bucket: string, folder: string = '') {
    const { data, error } = await supabase.storage.from(bucket).list(folder);
    if (error) throw error;
    return data;
  },
};

