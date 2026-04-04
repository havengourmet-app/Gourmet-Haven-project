import { create } from "zustand";

function calculateTotals(items) {
  const subtotalPaise = items.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0);
  const deliveryFeePaise = subtotalPaise > 0 ? 2500 : 0;
  const platformFeePaise = subtotalPaise > 0 ? 800 : 0;

  return {
    subtotalPaise,
    deliveryFeePaise,
    platformFeePaise,
    totalPaise: subtotalPaise + deliveryFeePaise + platformFeePaise
  };
}

export const useCartStore = create((set, get) => ({
  restaurantId: null,
  items: [],

  addItem: (item) => {
    const { items, restaurantId } = get();

    const nextRestaurantId = restaurantId || item.restaurantId;
    const existingIndex = items.findIndex((entry) => entry.id === item.id);
    let nextItems;

    if (existingIndex >= 0) {
      nextItems = items.map((entry, index) =>
        index === existingIndex ? { ...entry, quantity: entry.quantity + 1 } : entry
      );
    } else {
      nextItems = [...items, { ...item, quantity: 1 }];
    }

    set({
      restaurantId: nextRestaurantId,
      items: nextItems
    });
  },

  updateQuantity: (itemId, quantity) => {
    const nextItems = get()
      .items.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);

    set({
      items: nextItems,
      restaurantId: nextItems[0]?.restaurantId || null
    });
  },

  clearCart: () =>
    set({
      restaurantId: null,
      items: []
    }),

  totals: () => calculateTotals(get().items)
}));
