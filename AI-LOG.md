# Registro de Auditoría de IA (AI-LOG) - Parcial 2

**Estudiante:** Leonardo Carrillo Caballero  
**Proyecto:** Mi Tienda – Gestión de Inventario Offline-First con SQLite, Drizzle ORM y Supabase  
**Asignatura:** Desarrollo Móvil  

---

## 1. Resumen de Asistencia de IA

Durante el desarrollo de la aplicación "Mi Tienda", se utilizó un asistente de Inteligencia Artificial para:
1. Diseñar y estructurar la arquitectura del proyecto basada en Expo SDK 58, Expo Router y Drizzle ORM.
2. Definir el esquema type-safe de SQLite en `src/db/schema.ts` acatando las restricciones de Node en `drizzle-kit`.
3. Implementar el patrón repositorio en `src/db/repositories/products.ts` con generación de UUIDs mediante `expo-crypto`.
4. Diseñar el servicio de sincronización bidireccional en dos pasos estrictos (Bajar e Insertar faltantes -> Subir con Upsert y Actualizar estado) en `src/services/sync.ts`.
5. Configurar el enrutamiento protegido mediante `Stack.Protected` según el estado de autenticación de Supabase Auth.

---

## 2. Prompts Utilizados y Decisiones de Arquitectura

### A. Estructura Base y Configuración de Drizzle con Metro/Babel
- **Prompt:** *"Configura Babel, Metro y Drizzle ORM para un proyecto de Expo SDK 58 que requiere cargar archivos `.sql` en tiempo de ejecución."*
- **Generación:** Creación de `babel.config.js` con `babel-plugin-inline-import` para extensiones `.sql`, ajuste en `metro.config.js` agregando `sql` a `sourceExts`, y `drizzle.config.ts` apuntando a `src/db/schema.ts`.
- **Validación del Estudiante:** Se comprobó que `npx drizzle-kit generate` crea los archivos en `src/drizzle` sin advertencias de sintaxis y que `useMigrations` los aplica automáticamente al iniciar `_layout.tsx`.

### B. Esquema Type-Safe de SQLite (`src/db/schema.ts`)
- **Prompt:** *"Define la tabla 'products' en Drizzle SQLite con columnas id, clientId, name, quantity, price, updatedAt y syncedAt. Asegúrate de no importar expo-crypto ni ningún módulo de Expo dentro del schema."*
- **Generación:** Código estricto con `sqliteTable`, `integer` (con `mode: 'timestamp_ms'`) y `text`.
- **Validación del Estudiante:** Se verificó que `drizzle-kit` lee el archivo desde el entorno Node sin el error `Unexpected "typeof"`.

### C. Patrón Repositorio y Custom Hook (`products.ts` y `useProducts.ts`)
- **Prompt:** *"Crea un repositorio para products que maneje clientId con Crypto.randomUUID(), actualice updatedAt con Date y provea un hook reactivo con useLiveQuery."*
- **Generación:** `productRepository` abstrae todas las operaciones sobre SQLite y `useProducts` provee la lista reactiva en vivo junto a los cálculos automáticos de métricas (`totalUnits`, `totalValue`, `pendingCount`).
- **Validación del Estudiante:** Al agregar o editar un producto localmente, las métricas del resumen superior se recalculan de forma instantánea sin necesidad de recargar la pantalla.

### D. Servicio de Sincronización Bidireccional (`src/services/sync.ts`)
- **Prompt:** *"Implementa la función syncProducts(userId) en dos pasos estrictos: 1. Consultar Supabase e insertar en SQLite solo los productos inexistentes; 2. Obtener los productos locales pendientes y subirlos a Supabase con upsert usando client_id como conflicto, marcándolos como sincronizados."*
- **Generación:** Flujo con manejo de excepciones de red para modo avión, control de contadores (`uploaded`, `downloaded`) y actualización atómica del timestamp `syncedAt`.
- **Validación del Estudiante:** En modo avión, la app muestra un mensaje informativo claro sin interrumpir el funcionamiento del inventario local.

---

## 3. Verificación y Calidad de Código

- **TypeScript:** Ejecución de `npx tsc --noEmit` completada con **0 errores**.
- **Expo Router:** Rutas divididas mediante `Stack.Protected` asegurando que las pantallas privadas no sean accesibles sin sesión activa.
- **Persistencia Segura:** Autenticación conectada a `expo-secure-store` garantizando que la sesión se mantiene al reiniciar la aplicación.
