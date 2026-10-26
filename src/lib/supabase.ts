// src/lib/supabase.ts
// Cliente de Supabase configurado con almacenamiento seguro y auto-refresh de sesión.

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { secureStorage } from './secureStorage';

// ─── PARCIAL 2: Proyecto Supabase INDEPENDIENTE ────────────────────────────
// Las credenciales se leen del archivo .env en la raíz del proyecto.
// El día del examen solo hay que:
//   1. Crear un proyecto nuevo en https://supabase.com/dashboard
//   2. Pegar la URL y Anon Key en el .env
//   3. Reiniciar Expo con: npx expo start -c

export const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] ⚠️ Faltan credenciales en .env. ' +
    'Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
  );
}

/**
 * Cliente de Supabase:
 * - Almacenamiento seguro particionado (chunked SecureStore en móvil / localStorage en web)
 * - Auto-refresh de token según el estado de la app
 * - Sesión persistente
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Listener de AppState para optimizar el auto-refresh del token:
 * Inicia refresh cuando la app pasa a foreground ('active') y lo pausa en background.
 */
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

