import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { crudService } from '@/services/crudService';
import { storageService } from '@/services/storageService';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActiveTab = 'status' | 'auth' | 'crud' | 'storage' | 'snippets';

export default function ParcialHomeScreen() {
  const theme = useTheme();
  const { session, user, isAuthenticated, signIn, signUp, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('status');

  // Estado de conexión
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [connectionMsg, setConnectionMsg] = useState('');

  // Estado de Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Estado de CRUD
  const [tableName, setTableName] = useState('tareas');
  const [items, setItems] = useState<any[]>([]);
  const [crudLoading, setCrudLoading] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  // Estado de Storage
  const [bucketName, setBucketName] = useState('geocam');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Prueba inicial de conexión
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      setConnectionMsg('Comprobando conexión con Supabase...');
      const startTime = Date.now();
      const { data, error } = await supabase.auth.getSession();
      const latency = Date.now() - startTime;

      if (error) {
        setConnectionStatus('error');
        setConnectionMsg(`Error: ${error.message}`);
      } else {
        setConnectionStatus('success');
        setConnectionMsg(`Conexión exitosa (${latency} ms)`);
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionMsg(err?.message || 'Fallo de red al conectar');
    }
  };

  // Handlers de Auth
  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atención', 'Ingresa email y contraseña');
      return;
    }
    try {
      setAuthLoading(true);
      await signIn(email, password);
      Alert.alert('Éxito', 'Sesión iniciada correctamente');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      Alert.alert('Error de Autenticación', err.message || 'No fue posible iniciar sesión');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atención', 'Ingresa email y contraseña');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Seguridad', 'La contraseña debe tener mínimo 6 caracteres');
      return;
    }
    try {
      setAuthLoading(true);
      await signUp(email, password);
      Alert.alert(
        'Registro enviado',
        'Usuario registrado. Si tu proyecto tiene confirmación de email activa, revisa tu correo.'
      );
    } catch (err: any) {
      Alert.alert('Error de Registro', err.message || 'No fue posible registrarse');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthLoading(true);
      await signOut();
      Alert.alert('Sesión cerrada', 'Has cerrado sesión con éxito');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al cerrar sesión');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handlers de CRUD
  const loadTableData = async () => {
    if (!tableName.trim()) return;
    try {
      setCrudLoading(true);
      const data = await crudService.getAll(tableName.trim(), { limit: 25 });
      setItems(data);
    } catch (err: any) {
      Alert.alert(
        `Error al consultar "${tableName}"`,
        err.message || 'Verifica el nombre de la tabla o las políticas RLS en Supabase'
      );
    } finally {
      setCrudLoading(false);
    }
  };

  const handleCreateRecord = async () => {
    if (!tableName.trim()) return;
    if (!newItemTitle.trim()) {
      Alert.alert('Atención', 'Ingresa al menos un título o dato');
      return;
    }

    try {
      setCrudLoading(true);
      // Intentamos insertar con campos comunes: titulo/nombre y descripcion
      const newRecord: any = {
        titulo: newItemTitle.trim(),
        nombre: newItemTitle.trim(),
        descripcion: newItemDesc.trim(),
      };
      if (user?.id) {
        newRecord.user_id = user.id;
      }

      await crudService.insert(tableName.trim(), newRecord);
      Alert.alert('Guardado', 'Registro insertado en Supabase');
      setNewItemTitle('');
      setNewItemDesc('');
      await loadTableData();
    } catch (err: any) {
      Alert.alert('Error de Inserción', err.message || 'No se pudo insertar');
    } finally {
      setCrudLoading(false);
    }
  };

  const handleDeleteRecord = async (id: any) => {
    try {
      setCrudLoading(true);
      await crudService.delete(tableName.trim(), id);
      await loadTableData();
    } catch (err: any) {
      Alert.alert('Error al eliminar', err.message || 'No se pudo eliminar');
    } finally {
      setCrudLoading(false);
    }
  };

  // Handlers de Storage
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para seleccionar imágenes.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImageUri) {
      Alert.alert('Atención', 'Primero selecciona una imagen');
      return;
    }

    try {
      setUploadLoading(true);
      const filename = `img_${Date.now()}.jpg`;
      const targetPath = user?.id ? `${user.id}/${filename}` : `publicos/${filename}`;

      const uploadedPath = await storageService.uploadFile(
        bucketName.trim(),
        targetPath,
        selectedImageUri,
        { contentType: 'image/jpeg' }
      );

      const publicUrl = storageService.getPublicUrl(bucketName.trim(), uploadedPath);
      setUploadedUrl(publicUrl);
      Alert.alert('¡Subida exitosa!', `Archivo subido a Supabase Storage: ${uploadedPath}`);
    } catch (err: any) {
      Alert.alert('Error al subir', err.message || 'No fue posible subir la imagen al bucket');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header principal */}
          <ThemedView type="backgroundElement" style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View>
                <ThemedText type="title" style={styles.headerTitle}>
                  Parcial 2 🚀
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  React Native + Expo SDK 58 + Supabase
                </ThemedText>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  connectionStatus === 'success'
                    ? styles.badgeSuccess
                    : connectionStatus === 'error'
                    ? styles.badgeError
                    : styles.badgeTesting,
                ]}>
                <Ionicons
                  name={
                    connectionStatus === 'success'
                      ? 'checkmark-circle'
                      : connectionStatus === 'error'
                      ? 'alert-circle'
                      : 'sync'
                  }
                  size={14}
                  color="#fff"
                />
                <ThemedText style={styles.statusBadgeText}>
                  {connectionStatus === 'success'
                    ? 'Conectado'
                    : connectionStatus === 'error'
                    ? 'Error'
                    : 'Verificando'}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="small" style={styles.endpointText} numberOfLines={1}>
              URL: {supabaseUrl || 'No configurada'}
            </ThemedText>
            {connectionMsg ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.statusMsg}>
                {connectionMsg}
              </ThemedText>
            ) : null}
          </ThemedView>

          {/* Selector de pestañas */}
          <View style={styles.tabBar}>
            {(
              [
                { id: 'status', label: 'Inicio', icon: 'speedometer-outline' },
                { id: 'auth', label: 'Auth', icon: 'lock-closed-outline' },
                { id: 'crud', label: 'Tablas', icon: 'server-outline' },
                { id: 'storage', label: 'Storage', icon: 'cloud-upload-outline' },
                { id: 'snippets', label: 'Cheatsheet', icon: 'code-slash-outline' },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.id)}>
                  <Ionicons
                    name={tab.icon}
                    size={18}
                    color={active ? '#2563EB' : theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    style={[
                      styles.tabButtonText,
                      active && { color: '#2563EB', fontWeight: 'bold' },
                    ]}>
                    {tab.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CONTENIDO DE CADA PESTAÑA */}

          {/* TAB 1: INICIO & RESUMEN */}
          {activeTab === 'status' && (
            <View style={styles.sectionContainer}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="subtitle">Estado General del Proyecto</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
                  Todo el entorno está listo para responder a cualquier requerimiento de tu examen:
                </ThemedText>

                <View style={styles.featureList}>
                  <FeatureItem
                    icon="checkmark-done"
                    title="Supabase SDK 2.x"
                    desc="Cliente configurado en src/lib/supabase.ts"
                  />
                  <FeatureItem
                    icon="shield-checkmark"
                    title="Almacenamiento Seguro"
                    desc="expo-secure-store particionado (chunking) para tokens"
                  />
                  <FeatureItem
                    icon="person"
                    title="Contexto de Autenticación"
                    desc="useAuth() con signIn, signUp, signOut y persistencia"
                  />
                  <FeatureItem
                    icon="layers"
                    title="CRUD Universal & Hooks"
                    desc="crudService y hook useSupabaseTable para cualquier tabla"
                  />
                  <FeatureItem
                    icon="images"
                    title="Supabase Storage Binario"
                    desc="Subida con ArrayBuffer (evita archivos corruptos de 0 bytes)"
                  />
                  <FeatureItem
                    icon="hardware-chip"
                    title="Módulos Nativos de Apoyo"
                    desc="ImagePicker, FileSystem, SQLite, Crypto y Vector Icons listos"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, { marginTop: Spacing.three }]}
                  onPress={testConnection}
                  disabled={connectionStatus === 'testing'}>
                  {connectionStatus === 'testing' ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={16} color="#fff" />
                      <ThemedText style={styles.actionBtnText}>Re-probar Conexión Supabase</ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </ThemedView>
            </View>
          )}

          {/* TAB 2: AUTENTICACIÓN */}
          {activeTab === 'auth' && (
            <View style={styles.sectionContainer}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="subtitle">Módulo de Autenticación</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
                  Sesiones persistentes con SecureStore y auto-refresh.
                </ThemedText>

                <View style={styles.userStatusBox}>
                  <ThemedText type="small" style={{ fontWeight: 'bold' }}>
                    Estado actual:{' '}
                    <ThemedText
                      type="small"
                      style={{ color: isAuthenticated ? '#16A34A' : '#DC2626' }}>
                      {isAuthenticated ? 'AUTENTICADO' : 'INVITADO (Sin sesión)'}
                    </ThemedText>
                  </ThemedText>
                  {user && (
                    <>
                      <ThemedText type="small" style={{ marginTop: 4 }}>
                        Email: {user.email}
                      </ThemedText>
                      <ThemedText type="code" style={{ fontSize: 11, marginTop: 2 }}>
                        UID: {user.id}
                      </ThemedText>
                    </>
                  )}
                </View>

                {isAuthenticated ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnDanger, { marginTop: Spacing.two }]}
                    onPress={handleSignOut}
                    disabled={authLoading}>
                    {authLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="log-out-outline" size={18} color="#fff" />
                        <ThemedText style={styles.actionBtnText}>Cerrar Sesión</ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={{ marginTop: Spacing.two }}>
                    <ThemedText type="small" style={styles.inputLabel}>
                      Correo electrónico:
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="ejemplo@correo.com"
                      placeholderTextColor="#888"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />

                    <ThemedText type="small" style={[styles.inputLabel, { marginTop: Spacing.two }]}>
                      Contraseña:
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="#888"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />

                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { flex: 1, marginRight: 6 }]}
                        onPress={handleSignIn}
                        disabled={authLoading}>
                        {authLoading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <ThemedText style={styles.actionBtnText}>Iniciar Sesión</ThemedText>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.btnSecondary, { flex: 1, marginLeft: 6 }]}
                        onPress={handleSignUp}
                        disabled={authLoading}>
                        {authLoading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <ThemedText style={styles.actionBtnText}>Registrarse</ThemedText>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ThemedView>
            </View>
          )}

          {/* TAB 3: CRUD & TABLAS */}
          {activeTab === 'crud' && (
            <View style={styles.sectionContainer}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="subtitle">Operaciones CRUD en Tablas</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
                  Interactúa directamente con cualquier tabla de tu Supabase.
                </ThemedText>

                <View style={{ marginTop: Spacing.two }}>
                  <ThemedText type="small" style={styles.inputLabel}>
                    Nombre de la tabla:
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Nombre de tabla (ej: tareas, photos)"
                      placeholderTextColor="#888"
                      value={tableName}
                      onChangeText={setTableName}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={[styles.actionBtn, { minWidth: 90 }]}
                      onPress={loadTableData}
                      disabled={crudLoading}>
                      {crudLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <ThemedText style={styles.actionBtnText}>Cargar</ThemedText>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Formulario rápido para insertar */}
                <View style={styles.insertBox}>
                  <ThemedText type="small" style={{ fontWeight: 'bold' }}>
                    + Insertar nuevo registro en "{tableName}"
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { marginTop: 6 }]}
                    placeholder="Título o Nombre"
                    placeholderTextColor="#888"
                    value={newItemTitle}
                    onChangeText={setNewItemTitle}
                  />
                  <TextInput
                    style={[styles.input, { marginTop: 6 }]}
                    placeholder="Descripción o detalle (opcional)"
                    placeholderTextColor="#888"
                    value={newItemDesc}
                    onChangeText={setNewItemDesc}
                  />
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnSuccess, { marginTop: 8 }]}
                    onPress={handleCreateRecord}
                    disabled={crudLoading}>
                    <ThemedText style={styles.actionBtnText}>Guardar en Supabase</ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Lista de registros */}
                <View style={{ marginTop: Spacing.three }}>
                  <ThemedText type="small" style={{ fontWeight: 'bold' }}>
                    Registros en Supabase ({items.length}):
                  </ThemedText>

                  {items.length === 0 ? (
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={{ marginTop: 8, fontStyle: 'italic' }}>
                      No hay registros cargados o la tabla está vacía. Presiona "Cargar".
                    </ThemedText>
                  ) : (
                    items.map((item, index) => {
                      const id = item.id ?? item.client_id ?? index;
                      const title = item.titulo || item.nombre || item.title || item.note || `Item #${id}`;
                      return (
                        <View key={String(id)} style={styles.recordCard}>
                          <View style={{ flex: 1 }}>
                            <ThemedText type="small" style={{ fontWeight: 'bold' }}>
                              {title}
                            </ThemedText>
                            <ThemedText type="code" style={{ fontSize: 11, marginTop: 2 }}>
                              ID: {String(id)} {item.created_at ? `• ${new Date(item.created_at).toLocaleDateString()}` : ''}
                            </ThemedText>
                            {item.descripcion && (
                              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
                                {item.descripcion}
                              </ThemedText>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteRecord(id)}
                            style={styles.deleteBtn}>
                            <Ionicons name="trash-outline" size={18} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                </View>
              </ThemedView>
            </View>
          )}

          {/* TAB 4: STORAGE */}
          {activeTab === 'storage' && (
            <View style={styles.sectionContainer}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="subtitle">Supabase Storage</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
                  Subida binaria con ArrayBuffer para evitar archivos de 0 bytes en React Native.
                </ThemedText>

                <View style={{ marginTop: Spacing.two }}>
                  <ThemedText type="small" style={styles.inputLabel}>
                    Bucket de destino:
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="geocam, archivos, avatares..."
                    placeholderTextColor="#888"
                    value={bucketName}
                    onChangeText={setBucketName}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnSecondary, { marginTop: Spacing.two }]}
                  onPress={handlePickImage}>
                  <Ionicons name="image-outline" size={18} color="#fff" />
                  <ThemedText style={styles.actionBtnText}>Seleccionar Foto de Galería</ThemedText>
                </TouchableOpacity>

                {selectedImageUri && (
                  <View style={styles.previewBox}>
                    <ThemedText type="small" style={{ fontWeight: 'bold' }}>
                      Previsualización:
                    </ThemedText>
                    <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnSuccess, { marginTop: 10 }]}
                      onPress={handleUploadImage}
                      disabled={uploadLoading}>
                      {uploadLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload" size={18} color="#fff" />
                          <ThemedText style={styles.actionBtnText}>Subir al Bucket "{bucketName}"</ThemedText>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {uploadedUrl && (
                  <View style={[styles.userStatusBox, { marginTop: Spacing.three }]}>
                    <ThemedText type="small" style={{ fontWeight: 'bold', color: '#16A34A' }}>
                      ✓ Archivo subido:
                    </ThemedText>
                    <ThemedText type="code" style={{ fontSize: 11, marginTop: 4 }} numberOfLines={2}>
                      {uploadedUrl}
                    </ThemedText>
                  </View>
                )}
              </ThemedView>
            </View>
          )}

          {/* TAB 5: SNIPPETS DE EXAMEN */}
          {activeTab === 'snippets' && (
            <View style={styles.sectionContainer}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="subtitle">📋 Cheatsheet Rápido para el Examen</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
                  Copia y adapta estos patrones listos durante la prueba:
                </ThemedText>

                <SnippetCard
                  title="1. Usar Hook Reactivo de Tabla (1 Línea)"
                  code={`import { useSupabaseTable } from '@/hooks/useSupabaseTable';

const { data, loading, error, refresh, create, update, remove } = 
  useSupabaseTable('productos', { realtime: true });`}
                />

                <SnippetCard
                  title="2. Insertar Registro con Supabase"
                  code={`import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('tareas')
  .insert([{ titulo: 'Estudiar', terminada: false }])
  .select();`}
                />

                <SnippetCard
                  title="3. Consultar con Filtros"
                  code={`const { data, error } = await supabase
  .from('productos')
  .select('*')
  .eq('categoria', 'electronica')
  .order('precio', { ascending: true });`}
                />

                <SnippetCard
                  title="4. Autenticación en Cualquier Pantalla"
                  code={`import { useAuth } from '@/context/AuthContext';

const { user, isAuthenticated, signIn, signUp, signOut } = useAuth();`}
                />

                <SnippetCard
                  title="5. Subir Foto a Storage (Regla ArrayBuffer)"
                  code={`import { storageService } from '@/services/storageService';

const path = await storageService.uploadFile(
  'geocam', 
  \`\${user.id}/foto_\${Date.now()}.jpg\`, 
  localImageUri
);`}
                />
              </ThemedView>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function FeatureItem({ icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={20} color="#2563EB" style={{ marginTop: 2 }} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <ThemedText type="small" style={{ fontWeight: 'bold' }}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {desc}
        </ThemedText>
      </View>
    </View>
  );
}

function SnippetCard({ title, code }: { title: string; code: string }) {
  return (
    <View style={styles.snippetCard}>
      <ThemedText type="small" style={{ fontWeight: 'bold', color: '#2563EB' }}>
        {title}
      </ThemedText>
      <ThemedText type="code" style={styles.snippetCode}>
        {code}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.five * 2,
  },
  headerCard: {
    padding: Spacing.three,
    borderRadius: 14,
    marginBottom: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeSuccess: {
    backgroundColor: '#16A34A',
  },
  badgeError: {
    backgroundColor: '#DC2626',
  },
  badgeTesting: {
    backgroundColor: '#D97706',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  endpointText: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.8,
  },
  statusMsg: {
    marginTop: 4,
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(37,99,235,0.15)',
  },
  tabButtonText: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: Spacing.four,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 14,
  },
  featureList: {
    marginTop: Spacing.two,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnSecondary: {
    backgroundColor: '#4B5563',
  },
  btnSuccess: {
    backgroundColor: '#16A34A',
  },
  btnDanger: {
    backgroundColor: '#DC2626',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  userStatusBox: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    backgroundColor: 'rgba(128,128,128,0.08)',
    borderRadius: 8,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: Spacing.two,
  },
  insertBox: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    backgroundColor: 'rgba(128,128,128,0.08)',
    borderRadius: 8,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
    backgroundColor: 'rgba(128,128,128,0.05)',
  },
  deleteBtn: {
    padding: 8,
  },
  previewBox: {
    marginTop: Spacing.two,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 6,
  },
  snippetCard: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  snippetCode: {
    fontSize: 11,
    marginTop: 6,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
  },
});
