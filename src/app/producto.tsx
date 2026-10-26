import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/hooks/useProducts';

export default function ProductoFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const productId = id ? parseInt(id, 10) : null;

  const { createProduct, updateProduct, getProductById } = useProducts();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    if (isEditing && productId) {
      const loadProduct = async () => {
        try {
          setLoadingInitial(true);
          const existing = await getProductById(productId);
          if (existing) {
            setName(existing.name);
            setQuantity(String(existing.quantity));
            setPrice(String(existing.price));
          } else {
            Alert.alert('Error', 'El producto no fue encontrado.');
            router.back();
          }
        } catch (err: any) {
          Alert.alert('Error', err?.message || 'No se pudo cargar el producto.');
          router.back();
        } finally {
          setLoadingInitial(false);
        }
      };

      loadProduct();
    }
  }, [id]);

  const handleSave = async () => {
    setErrorMessage(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('El nombre del producto no puede estar vacío.');
      return;
    }

    const cleanQty = quantity.trim();
    if (!cleanQty || !/^\d+$/.test(cleanQty)) {
      setErrorMessage('La cantidad debe ser un número entero mayor o igual a 0.');
      return;
    }
    const numQty = parseInt(cleanQty, 10);
    if (isNaN(numQty) || numQty < 0) {
      setErrorMessage('La cantidad debe ser un número entero mayor o igual a 0.');
      return;
    }

    const cleanPrice = price.trim();
    if (!cleanPrice || !/^\d+$/.test(cleanPrice)) {
      setErrorMessage('El precio debe ser un número entero mayor o igual a 0 (en pesos, sin decimales).');
      return;
    }
    const numPrice = parseInt(cleanPrice, 10);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMessage('El precio debe ser un número entero mayor o igual a 0.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing && productId) {
        await updateProduct(productId, {
          name: cleanName,
          quantity: numQty,
          price: numPrice,
        });
      } else {
        await createProduct({
          name: cleanName,
          quantity: numQty,
          price: numPrice,
        });
      }

      router.back();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al guardar el producto en SQLite.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Cargando datos del producto...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        {/* Barra superior con navegación */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {isEditing
                ? 'Modifica los valores del producto'
                : 'Ingresa los datos del nuevo producto'}
            </Text>

            {/* Error visible en pantalla */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Campo: Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Producto *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Arroz Diana 1kg, Leche Alquería..."
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoFocus={!isEditing}
              />
            </View>

            {/* Campo: Cantidad */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cantidad en existencia (unidades) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 12"
                placeholderTextColor="#9CA3AF"
                value={quantity}
                onChangeText={(val) => {
                  setQuantity(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                keyboardType="number-pad"
              />
              <Text style={styles.helperText}>Número entero mayor o igual a 0</Text>
            </View>

            {/* Campo: Precio */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Precio unitario en pesos ($) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 4500"
                placeholderTextColor="#9CA3AF"
                value={price}
                onChangeText={(val) => {
                  setPrice(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                keyboardType="number-pad"
              />
              <Text style={styles.helperText}>Sin puntos ni comas (ej. 5000)</Text>
            </View>

            {/* Botón Guardar */}
            <TouchableOpacity
              style={[styles.saveButton, submitting && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>
                    {isEditing ? 'Actualizar Producto' : 'Guardar en Inventario'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={submitting}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});

