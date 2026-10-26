// src/app/explore.tsx
// Pantalla de ejemplo y plantilla rápida para el examen: CRUD completo con Supabase.
// Puedes cambiar 'tareas' por cualquier tabla que te pida el profesor (ej: 'productos', 'alumnos', etc.)

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSupabaseTable } from '@/hooks/useSupabaseTable';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

interface ItemRecord {
  id?: number | string;
  titulo?: string;
  nombre?: string;
  descripcion?: string;
  completado?: boolean;
  user_id?: string;
  created_at?: string;
}

export default function CrudExamScreen() {
  const { user } = useAuth();

  // Nombre de la tabla a gestionar en el examen (Cámbialo según el enunciado del profesor)
  const [currentTable, setCurrentTable] = useState('tareas');
  const [inputTitle, setInputTitle] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // Hook reactivo conectado a Supabase con soporte Realtime
  const { data, loading, error, refresh, create, update, remove } =
    useSupabaseTable<ItemRecord>(currentTable, {
      realtime: true,
      orderBy: 'created_at',
      ascending: false,
    });

  const handleSave = async () => {
    if (!inputTitle.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa un título o nombre.');
      return;
    }

    try {
      if (editingId !== null) {
        // Actualizar registro existente
        await update(editingId, {
          titulo: inputTitle.trim(),
          nombre: inputTitle.trim(),
          descripcion: inputDesc.trim(),
        });
        setEditingId(null);
      } else {
        // Crear nuevo registro
        const newRecord: ItemRecord = {
          titulo: inputTitle.trim(),
          nombre: inputTitle.trim(),
          descripcion: inputDesc.trim(),
          completado: false,
        };
        if (user?.id) {
          newRecord.user_id = user.id;
        }
        await create(newRecord);
      }

      setInputTitle('');
      setInputDesc('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar en Supabase.');
    }
  };

  const handleEdit = (item: ItemRecord) => {
    setEditingId(item.id ?? null);
    setInputTitle(item.titulo || item.nombre || '');
    setInputDesc(item.descripcion || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setInputTitle('');
    setInputDesc('');
  };

  const handleToggleCompleted = async (item: ItemRecord) => {
    if (!item.id) return;
    try {
      await update(item.id, {
        completado: !item.completado,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo cambiar el estado.');
    }
  };

  const handleDelete = (id: string | number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este registro de Supabase?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Cabecera */}
        <ThemedView type="backgroundElement" style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <ThemedText type="title" style={styles.headerTitle}>
                Gestor CRUD 📝
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Tabla activa en Supabase:
              </ThemedText>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
              <Ionicons name="refresh" size={18} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {/* Selector / Input de tabla */}
          <TextInput
            style={styles.tableInput}
            value={currentTable}
            onChangeText={setCurrentTable}
            placeholder="Nombre de la tabla (ej: tareas, productos)"
            placeholderTextColor="#888"
            autoCapitalize="none"
          />
        </ThemedView>

        {/* Formulario de Entrada / Edición */}
        <ThemedView type="backgroundElement" style={styles.formCard}>
          <ThemedText type="small" style={{ fontWeight: 'bold' }}>
            {editingId !== null ? '✏️ Editando Registro' : '➕ Nuevo Registro'}
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Título o Nombre principal *"
            placeholderTextColor="#888"
            value={inputTitle}
            onChangeText={setInputTitle}
          />

          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Descripción o detalles (opcional)"
            placeholderTextColor="#888"
            value={inputDesc}
            onChangeText={setInputDesc}
          />

          <View style={styles.formButtonsRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { flex: 1 }]}
              onPress={handleSave}>
              <Ionicons
                name={editingId !== null ? 'save-outline' : 'add-circle-outline'}
                size={18}
                color="#fff"
              />
              <ThemedText style={styles.btnText}>
                {editingId !== null ? 'Actualizar' : 'Guardar en Supabase'}
              </ThemedText>
            </TouchableOpacity>

            {editingId !== null && (
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel, { marginLeft: 8 }]}
                onPress={handleCancelEdit}>
                <ThemedText style={styles.btnText}>Cancelar</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </ThemedView>

        {/* Mensaje de error si falla la consulta */}
        {error ? (
          <ThemedView style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        ) : null}

        {/* Lista de Registros */}
        {loading && data.length === 0 ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color="#2563EB" />
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 8 }}>
              Sincronizando con Supabase...
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item, index) => String(item.id ?? index)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.emptyText}>
                No hay registros en "{currentTable}". Agrega uno arriba o verifica las políticas RLS.
              </ThemedText>
            }
            renderItem={({ item }) => {
              const id = item.id;
              const title = item.titulo || item.nombre || `Registro #${id}`;
              const isDone = !!item.completado;

              return (
                <View style={styles.cardItem}>
                  <TouchableOpacity
                    style={styles.checkTouch}
                    onPress={() => handleToggleCompleted(item)}>
                    <Ionicons
                      name={isDone ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={isDone ? '#16A34A' : '#9CA3AF'}
                    />
                  </TouchableOpacity>

                  <View style={{ flex: 1, marginHorizontal: 8 }}>
                    <ThemedText
                      type="small"
                      style={[
                        styles.itemTitle,
                        isDone && styles.itemTitleDone,
                      ]}>
                      {title}
                    </ThemedText>
                    {item.descripcion ? (
                      <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        numberOfLines={2}>
                        {item.descripcion}
                      </ThemedText>
                    ) : null}
                    <ThemedText type="code" style={styles.itemMeta}>
                      ID: {String(id)}
                    </ThemedText>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleEdit(item)}>
                      <Ionicons name="pencil" size={18} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => id && handleDelete(id)}>
                      <Ionicons name="trash" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  header: {
    padding: Spacing.two,
    borderRadius: 12,
    marginTop: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(37,99,235,0.1)',
  },
  tableInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: '#000',
  },
  formCard: {
    padding: Spacing.two,
    borderRadius: 12,
    marginTop: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: '#000',
    marginTop: 6,
  },
  formButtonsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  btnPrimary: {
    backgroundColor: '#2563EB',
  },
  btnCancel: {
    backgroundColor: '#6B7280',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: 'rgba(220,38,38,0.1)',
    borderRadius: 8,
    marginTop: Spacing.two,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    flex: 1,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: Spacing.two,
    paddingBottom: Spacing.five * 2,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
    backgroundColor: 'rgba(128,128,128,0.05)',
    marginBottom: 8,
  },
  checkTouch: {
    padding: 2,
  },
  itemTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
  itemTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  itemMeta: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
  },
});
