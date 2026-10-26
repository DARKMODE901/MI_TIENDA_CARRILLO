import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { syncProducts } from '@/services/sync';
import type { Product } from '@/db/schema';

export default function InventarioScreen() {
  const { user, signOut } = useAuth();
  const { products, metrics, deleteProduct, isPending } = useProducts();

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Acción: Sincronizar con Supabase
  const handleSync = async () => {
    if (!user?.id) {
      setSyncMessage({
        text: 'Debes tener una sesión activa para sincronizar.',
        type: 'error',
      });
      return;
    }

    try {
      setSyncing(true);
      setSyncMessage(null);
      const result = await syncProducts(user.id);

      if (result.success) {
        setSyncMessage({
          text: `Sincronización exitosa: ${result.message}`,
          type: 'success',
        });
      } else {
        setSyncMessage({
          text: result.message,
          type: 'error',
        });
      }
    } catch (err: any) {
      setSyncMessage({
        text: `Error de red: ${err?.message || 'Sin conexión a internet'}`,
        type: 'error',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Acción: Confirmar y Eliminar producto de SQLite local
  const handleDelete = (product: Product) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Deseas eliminar "${product.name}" del inventario local?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
            } catch (err: any) {
              Alert.alert('Error', 'No se pudo eliminar el producto de SQLite.');
            }
          },
        },
      ]
    );
  };

  // Acción: Cerrar Sesión con confirmación
  const handleSignOut = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir de Mi Tienda?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (err: any) {
            Alert.alert('Error', 'No se pudo cerrar sesión.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Barra Superior */}
      <View style={styles.topBar}>
        <View style={styles.branding}>
          <Ionicons name="storefront" size={26} color="#2563EB" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.appName}>Mi Tienda</Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email || 'Modo Offline'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.signOutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Banner de Sincronización si existe */}
      {syncMessage ? (
        <View
          style={[
            styles.syncBanner,
            syncMessage.type === 'success' ? styles.bannerSuccess : styles.bannerError,
          ]}>
          <Ionicons
            name={
              syncMessage.type === 'success' ? 'checkmark-circle' : 'cloud-offline-outline'
            }
            size={18}
            color={syncMessage.type === 'success' ? '#15803D' : '#B91C1C'}
          />
          <Text
            style={[
              styles.syncBannerText,
              syncMessage.type === 'success' ? styles.textSuccess : styles.textError,
            ]}>
            {syncMessage.text}
          </Text>
          <TouchableOpacity onPress={() => setSyncMessage(null)}>
            <Ionicons name="close" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={syncing} onRefresh={handleSync} colors={['#2563EB']} />
        }
        ListHeaderComponent={
          <>
            {/* Tarjetas de Resumen Superior (Métricas) */}
            <View style={styles.metricsContainer}>
              {/* Unidades Totales */}
              <View style={[styles.metricCard, { borderLeftColor: '#2563EB' }]}>
                <Text style={styles.metricLabel}>Total Unidades</Text>
                <Text style={styles.metricValue}>{metrics.totalUnits}</Text>
                <Text style={styles.metricSub}>en stock</Text>
              </View>

              {/* Valor del Inventario */}
              <View style={[styles.metricCard, { borderLeftColor: '#059669' }]}>
                <Text style={styles.metricLabel}>Valor Inventario</Text>
                <Text style={styles.metricValue}>
                  ${metrics.totalValue.toLocaleString('es-CO')}
                </Text>
                <Text style={styles.metricSub}>COP</Text>
              </View>

              {/* Pendientes por Sincronizar */}
              <View
                style={[
                  styles.metricCard,
                  {
                    borderLeftColor: metrics.pendingCount > 0 ? '#D97706' : '#16A34A',
                  },
                ]}>
                <Text style={styles.metricLabel}>Por Subir</Text>
                <Text
                  style={[
                    styles.metricValue,
                    { color: metrics.pendingCount > 0 ? '#D97706' : '#16A34A' },
                  ]}>
                  {metrics.pendingCount}
                </Text>
                <Text style={styles.metricSub}>
                  {metrics.pendingCount === 0 ? 'Al día ☁️' : 'Pendientes ⚠️'}
                </Text>
              </View>
            </View>

            {/* Barra de Acciones Principales */}
            <View style={styles.actionsBar}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/producto')}>
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Nuevo Producto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.syncButton, syncing && styles.buttonDisabled]}
                onPress={handleSync}
                disabled={syncing}>
                {syncing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="sync" size={18} color="#FFFFFF" />
                    <Text style={styles.syncButtonText}>Sincronizar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Título de la sección de lista */}
            <View style={styles.listSectionHeader}>
              <Text style={styles.listSectionTitle}>
                Inventario Local ({products.length} productos)
              </Text>
              <Text style={styles.listSectionHelper}>
                Toca para editar • Mantén presionado para eliminar
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={54} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Inventario vacío</Text>
            <Text style={styles.emptySubtitle}>
              Presiona "Nuevo Producto" para agregar artículos a tu tienda. Funciona 100% offline.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const pending = isPending(item);
          const subtotal = item.quantity * item.price;

          return (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => router.push(`/producto?id=${item.id}`)}
              onLongPress={() => handleDelete(item)}
              activeOpacity={0.7}>
              <View style={styles.productHeader}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>

                {/* Badge de Sincronización */}
                <View
                  style={[
                    styles.syncBadge,
                    pending ? styles.badgePending : styles.badgeSynced,
                  ]}>
                  <Ionicons
                    name={pending ? 'time-outline' : 'cloud-done-outline'}
                    size={13}
                    color={pending ? '#B45309' : '#15803D'}
                  />
                  <Text
                    style={[
                      styles.syncBadgeText,
                      pending ? styles.textPending : styles.textSynced,
                    ]}>
                    {pending ? 'Pendiente' : 'Sincronizado'}
                  </Text>
                </View>
              </View>

              <View style={styles.productBody}>
                <View style={styles.productInfoRow}>
                  <Text style={styles.productDetail}>
                    Cantidad: <Text style={styles.boldText}>{item.quantity} unds</Text>
                  </Text>
                  <Text style={styles.productDetail}>
                    Precio: <Text style={styles.boldText}>${item.price.toLocaleString('es-CO')}</Text>
                  </Text>
                </View>

                <View style={styles.productFooterRow}>
                  <Text style={styles.subtotalText}>
                    Subtotal: ${subtotal.toLocaleString('es-CO')}
                  </Text>

                  <TouchableOpacity
                    style={styles.deleteIconButton}
                    onPress={() => handleDelete(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: 200,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    gap: 4,
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  bannerSuccess: {
    backgroundColor: '#F0FDF4',
    borderBottomColor: '#BBF7D0',
  },
  bannerError: {
    backgroundColor: '#FEF2F2',
    borderBottomColor: '#FECACA',
  },
  syncBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  textSuccess: {
    color: '#15803D',
  },
  textError: {
    color: '#B91C1C',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  metricSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  addButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    height: 46,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  syncButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    height: 46,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  listSectionHeader: {
    marginBottom: 10,
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  listSectionHelper: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeSynced: {
    backgroundColor: '#DCFCE7',
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textPending: {
    color: '#B45309',
  },
  textSynced: {
    color: '#15803D',
  },
  productBody: {},
  productInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  productDetail: {
    fontSize: 13,
    color: '#4B5563',
  },
  boldText: {
    fontWeight: '600',
    color: '#111827',
  },
  productFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  subtotalText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#059669',
  },
  deleteIconButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
