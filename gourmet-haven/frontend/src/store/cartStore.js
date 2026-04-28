import { create } from "zustand";

const DELIVERY_FEE_PAISE = 3000;
const PLATFORM_FEE_PAISE = 0;

function normalizeItem(item) {
  return {
    id: item.id,
    name: item.name,
    price: Number(item.price ?? item.pricePaise ?? 0),
    image_url: item.image_url || item.image || null,
    restaurantId: item.restaurantId,
    restaurantName: item.restaurantName || null,
    quantity: Number(item.quantity || 1)
  };
}

function calculateCartState(items, restaurantId = null, restaurantName = null) {
  const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const subtotalPaise = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const deliveryFeePaise = subtotalPaise > 0 ? DELIVERY_FEE_PAISE : 0;
  const platformFeePaise = subtotalPaise > 0 ? PLATFORM_FEE_PAISE : 0;

  return {
    items,
    restaurantId,
    restaurantName,
    totalItems,
    subtotalPaise,
    deliveryFeePaise,
    platformFeePaise,
    totalPaise: subtotalPaise + deliveryFeePaise + platformFeePaise
  };
}

function getRestaurantMeta(items) {
  return {
    restaurantId: items[0]?.restaurantId || null,
    restaurantName: items[0]?.restaurantName || null
  };
}

export const useCartStore = create((set, get) => ({
  ...calculateCartState([], null, null),
  conflictPending: false,
  pendingItem: null,

  addItem: (item) => {
    const normalizedItem = normalizeItem(item);
    const { items, restaurantId } = get();

    if (restaurantId && restaurantId !== normalizedItem.restaurantId && items.length > 0) {
      set({
        conflictPending: true,
        pendingItem: normalizedItem
      });
      return;
    }

    const existingItem = items.find((entry) => entry.id === normalizedItem.id);
    const nextItems = existingItem
      ? items.map((entry) =>
          entry.id === normalizedItem.id
            ? { ...entry, quantity: Number(entry.quantity || 0) + 1 }
            : entry
        )
      : [...items, normalizedItem];

    set({
      ...calculateCartState(
        nextItems,
        normalizedItem.restaurantId || restaurantId,
        normalizedItem.restaurantName || get().restaurantName
      ),
      conflictPending: false,
      pendingItem: null
    });
  },

  removeItem: (itemId) => {
    const nextItems = get().items.filter((item) => item.id !== itemId);
    const meta = getRestaurantMeta(nextItems);

    set({
      ...calculateCartState(nextItems, meta.restaurantId, meta.restaurantName)
    });
  },

  incrementItem: (itemId) => {
    const nextItems = get().items.map((item) =>
      item.id === itemId ? { ...item, quantity: Number(item.quantity || 0) + 1 } : item
    );

    set({
      ...calculateCartState(nextItems, get().restaurantId, get().restaurantName)
    });
  },

  decrementItem: (itemId) => {
    const nextItems = get()
      .items.map((item) =>
        item.id === itemId ? { ...item, quantity: Number(item.quantity || 0) - 1 } : item
      )
      .filter((item) => item.quantity > 0);
    const meta = getRestaurantMeta(nextItems);

    set({
      ...calculateCartState(nextItems, meta.restaurantId, meta.restaurantName)
    });
  },

  clearCart: () =>
    set({
      ...calculateCartState([], null, null),
      conflictPending: false,
      pendingItem: null
    }),

  resolveConflict: () => {
    const pendingItem = get().pendingItem;

    if (!pendingItem) {
      set({
        conflictPending: false,
        pendingItem: null
      });
      return;
    }

    set({
      ...calculateCartState([pendingItem], pendingItem.restaurantId, pendingItem.restaurantName),
      conflictPending: false,
      pendingItem: null
    });
  },

  dismissConflict: () =>
    set({
      conflictPending: false,
      pendingItem: null
    })
}));
