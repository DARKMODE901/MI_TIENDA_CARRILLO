# 🚀 Parcial 2 - Desarrollo Móvil (Expo SDK 58 + Supabase)

Proyecto móvil configurado y preparado para el Examen Parcial 2, utilizando **React Native**, **Expo SDK 58** y Backend as a Service (BaaS) con **Supabase**.

---

## 📋 Características Implementadas

- ⚡ **Supabase Client v2** (`src/lib/supabase.ts`): Conexión independiente con persistencia de sesión y auto-refresh activo.
- 🔒 **Almacenamiento Seguro** (`src/lib/secureStorage.ts`): Adaptador de `expo-secure-store` con fragmentación en bloques de 1000 bytes (chunking) y fallback a `localStorage` en Web.
- 👤 **Autenticación Completa** (`src/context/AuthContext.tsx`): Hook `useAuth()` con `signIn`, `signUp`, `signOut`, manejo de sesiones y usuario activo.
- 📊 **CRUD Universal y Hooks** (`src/services/crudService.ts` y `src/hooks/useSupabaseTable.ts`): Operaciones CRUD en una sola línea para cualquier tabla de Supabase con soporte Realtime.
- 📁 **Supabase Storage** (`src/services/storageService.ts`): Subida binaria mediante `ArrayBuffer` para imágenes de `expo-image-picker` y `expo-camera` (evita archivos corruptos de 0 bytes).
- 📱 **Panel de Control** (`src/app/index.tsx`): Diagnóstico en vivo de conexión con Supabase, formularios de prueba y cheatsheet de código.
- 📝 **Plantilla de Examen** (`src/app/explore.tsx`): Pantalla interactiva tipo lista de tareas/productos con creación, edición, borrado y estado.

---

## 📁 Estructura del Proyecto

```text
├── src/
│   ├── app/
│   │   ├── _layout.tsx           # Layout con ThemeProvider y AuthProvider
│   │   ├── index.tsx             # Panel de inicio, diagnóstico y pruebas de Supabase
│   │   └── explore.tsx           # Pantalla CRUD lista para adaptar
│   ├── components/               # Componentes UI reutilizables
│   ├── context/
│   │   └── AuthContext.tsx       # Contexto global de autenticación
│   ├── hooks/
│   │   └── useSupabaseTable.ts   # Hook reactivo para consumir cualquier tabla
│   ├── lib/
│   │   ├── secureStorage.ts      # Manejo seguro particionado de tokens
│   │   └── supabase.ts           # Cliente configurado de Supabase
│   └── services/
│       ├── crudService.ts        # Métodos genéricos getAll, insert, update, delete
│       └── storageService.ts     # Métodos de subida binaria y URLs de Storage
├── .env.example                  # Plantilla de variables de entorno
├── app.json                      # Configuración de Expo y plugins nativos
└── package.json                  # Dependencias Expo SDK 58
```

---

## 🚀 Inicio Rápido

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/DARKMODE901/PARCIAL-1.git
   cd PARCIAL-1
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   Crea un archivo `.env` en la raíz con tus credenciales de Supabase:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

4. Ejecutar la aplicación:
   ```bash
   npx expo start -c
   ```
