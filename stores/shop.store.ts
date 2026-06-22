'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ShopCartItem = {
  productId: string;
  name: string;
  nameAr?: string | null;
  image?: string | null;
  price: number;
  compareAtPrice?: number | null;
  taxRate?: number | null;
  quantity: number;
};

type ShopState = {
  cart: ShopCartItem[];
  lastViewedProductId: string | null;
  addItem: (item: Omit<ShopCartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setLastViewedProductId: (productId: string | null) => void;
  itemCount: () => number;
  subtotal: () => number;
  discountAmount: () => number;
  taxAmount: () => number;
};

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      cart: [],
      lastViewedProductId: null,
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.cart.find((cartItem) => cartItem.productId === item.productId);
          if (existing) {
            return {
              cart: state.cart.map((cartItem) =>
                cartItem.productId === item.productId
                  ? { ...cartItem, quantity: cartItem.quantity + quantity }
                  : cartItem,
              ),
            };
          }

          return {
            cart: [...state.cart, { ...item, quantity }],
          };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cart: quantity <= 0
            ? state.cart.filter((item) => item.productId !== productId)
            : state.cart.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
        })),
      removeItem: (productId) =>
        set((state) => ({ cart: state.cart.filter((item) => item.productId !== productId) })),
      clearCart: () => set({ cart: [] }),
      setLastViewedProductId: (productId) => set({ lastViewedProductId: productId }),
      itemCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () =>
        get().cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
      discountAmount: () =>
        get().cart.reduce((sum, item) => {
          const reference = item.compareAtPrice && item.compareAtPrice > item.price ? item.compareAtPrice : item.price;
          return sum + Math.max(0, (reference - item.price) * item.quantity);
        }, 0),
      taxAmount: () =>
        get().cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity * (item.taxRate || 0)) / 100, 0),
    }),
    {
      name: 'shop-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
