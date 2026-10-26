# 🚀 Guía Rápida - Parcial 2 (Expo SDK 58 + Supabase)

Este proyecto está 100% configurado, auditado con `expo-doctor` (20/20 checks pasados) y verificado con TypeScript (0 errores).

---

## 🏃‍♂️ 1. Cómo iniciar el proyecto

Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
cd parcial
npx expo start
```

- Presiona `a` para abrir en emulador Android o escanea el QR con **Expo Go** en tu celular.
- Presiona `w` para probar en el navegador web.

---

## 🔑 2. Credenciales de Supabase (`.env`) — PROYECTO INDEPENDIENTE

> ⚠️ **Este proyecto usa su PROPIO Supabase, separado del de GeoCam.**

El día del examen necesitas crear un proyecto nuevo en Supabase y pegar las credenciales:

### Pasos para crear tu Supabase del examen:
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Clic en **"New Project"**
3. Ponle un nombre (ej: `parcial2-movil`)
4. Elige la región más cercana y genera la contraseña de la DB
5. Espera ~1 minuto a que se cree
6. Ve a **Project Settings → API** y copia los valores
7. Pégalos en el archivo `.env` del proyecto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-nuevo-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

8. Reinicia Expo limpiando caché: `npx expo start -c`

---

## 🛠️ 3. Módulos y Arquitectura Lista

| Módulo | Ruta | Descripción |
| :--- | :--- | :--- |
| **Cliente Supabase** | `src/lib/supabase.ts` | Configurado con almacenamiento seguro y auto-refresh de tokens según `AppState`. |
| **Almacenamiento Seguro** | `src/lib/secureStorage.ts` | Particionado (chunking de 1000 bytes) en `expo-secure-store` y `localStorage` en web. |
| **Autenticación** | `src/context/AuthContext.tsx` | Hook `useAuth()` con `signIn`, `signUp`, `signOut`, `user` y `session`. |
| **Servicio CRUD** | `src/services/crudService.ts` | Operaciones genéricas: `getAll`, `getById`, `insert`, `update`, `delete` y `subscribeToTable`. |
| **Hook Reactivo** | `src/hooks/useSupabaseTable.ts` | Conecta cualquier componente a una tabla en 1 línea con estado reactivo y Realtime. |
| **Storage Binario** | `src/services/storageService.ts` | Subida de imágenes usando `ArrayBuffer` (regla obligatoria para evitar archivos de 0 bytes). |
| **Dashboard Examen** | `src/app/index.tsx` | Panel de pruebas con pestañas: Ping de conexión, Auth, CRUD, Storage y snippets. |
| **Plantilla CRUD** | `src/app/explore.tsx` | Pantalla completa con lista, inserción, edición, borrado y cambio de estado. |

---

## 📋 4. Snippets Listos para Usar en el Examen

### A. Conectar cualquier pantalla a una tabla con 1 línea:
```tsx
import { useSupabaseTable } from '@/hooks/useSupabaseTable';

export default function MiPantalla() {
  const { data, loading, error, refresh, create, update, remove } = 
    useSupabaseTable('productos', { realtime: true });

  // data contiene el array de registros actualizados en tiempo real
}
```

### B. Usar Autenticación en cualquier componente:
```tsx
import { useAuth } from '@/context/AuthContext';

export default function Perfil() {
  const { user, isAuthenticated, signIn, signUp, signOut } = useAuth();

  return (
    <View>
      <Text>{isAuthenticated ? `Hola ${user?.email}` : 'No autenticado'}</Text>
      <Button title="Cerrar Sesión" onPress={signOut} />
    </View>
  );
}
```

### C. Subir Foto desde Galería a Supabase Storage:
```tsx
import * as ImagePicker from 'expo-image-picker';
import { storageService } from '@/services/storageService';

const subirImagen = async () => {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
  if (!res.canceled && res.assets[0].uri) {
    const remotePath = await storageService.uploadFile(
      'geocam', // Nombre del bucket
      `fotos/${Date.now()}.jpg`, 
      res.assets[0].uri
    );
    const url = storageService.getPublicUrl('geocam', remotePath);
    console.log('Imagen lista:', url);
  }
};
```

---

## 📦 5. Dependencias Instaladas

- `@supabase/supabase-js`
- `expo-secure-store`
- `expo-image-picker`
- `expo-file-system`
- `expo-sqlite`
- `expo-crypto`
- `@expo/vector-icons`
- `expo-router`
- `react-native-reanimated`, `react-native-screens`, `react-native-safe-area-context`

