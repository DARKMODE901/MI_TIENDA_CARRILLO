import { useMemo } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import {
  productRepository,
  type CreateProductInput,
  type UpdateProductInput,
} from '@/db/repositories/products';
import type { Product } from '@/db/schema';

/**
 * Hook reactivo para la pantalla principal y componentes de productos.
 * Utiliza useLiveQuery de Drizzle para actualizar la UI automáticamente ante cualquier cambio en SQLite.
 */
export function useProducts() {
  // Consulta reactiva en vivo sobre SQLite
  const { data: rawProducts, error } = useLiveQuery(productRepository.getLiveQuery());
  const products: Product[] = rawProducts || [];

  // Cálculos de métricas de inventario
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let totalValue = 0;
    let pendingCount = 0;

    for (const p of products) {
      const qty = p.quantity || 0;
      const price = p.price || 0;
      totalUnits += qty;
      totalValue += qty * price;
      if (productRepository.isPending(p)) {
        pendingCount += 1;
      }
    }

    return {
      totalUnits,
      totalValue,
      pendingCount,
    };
  }, [products]);

  const createProduct = async (input: CreateProductInput) => {
    return await productRepository.create(input);
  };

  const updateProduct = async (id: number, input: UpdateProductInput) => {
    return await productRepository.update(id, input);
  };

  const deleteProduct = async (id: number) => {
    await productRepository.delete(id);
  };

  const getProductById = async (id: number) => {
    return await productRepository.getById(id);
  };

  const isPending = (product: Product) => {
    return productRepository.isPending(product);
  };

  return {
    products,
    error,
    metrics,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    isPending,
  };
}

