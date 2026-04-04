import { useMemo, useState } from "react";
import Shell from "../components/common/Shell";
import MenuItemCard from "../components/customer/MenuItemCard";
import { legacyAssets } from "../lib/legacyAssets";
import { createOrder } from "../services/orderService";
import { useCartStore } from "../store/cartStore";

const SAMPLE_MENU = [
  {
    id: "c0ad0dc8-e7d7-44b9-8ca3-697165ae7e83",
    restaurantId: "d178fe1b-2ed8-4d6e-a0d5-56d44ac8ea01",
    name: "Chicken 65 Biryani",
    description: "Spiced basmati rice, marinated chicken, and house mirchi salan.",
    pricePaise: 29900,
    category: "Biryani",
    isVeg: false,
    image: legacyAssets.chicken
  },
  {
    id: "c11b0f25-4f38-497a-9b59-d7f56a4fa50c",
    restaurantId: "d178fe1b-2ed8-4d6e-a0d5-56d44ac8ea01",
    name: "Double Ka Meetha",
    description: "Classic Hyderabadi dessert finished with saffron cream.",
    pricePaise: 9900,
    category: "Dessert",
    isVeg: true,
    image: legacyAssets.featureFresh
  },
  {
    id: "4274d78b-7d53-434d-b4ec-59b7703df65d",
    restaurantId: "d178fe1b-2ed8-4d6e-a0d5-56d44ac8ea01",
    name: "Paneer Tikka Bowl",
    description: "Charred paneer, saffron rice, pickled onions, and mint yogurt.",
    pricePaise: 24900,
    category: "Bowls",
    isVeg: true,
    image: legacyAssets.friedRice
  }
];

export default function OrdersPage() {
  const { items, addItem, updateQuantity, clearCart, restaurantId, totals } = useCartStore();
  const [notice, setNotice] = useState("");
  const summary = useMemo(() => totals(), [items, totals]);

  async function handleCheckout() {
    setNotice("");

    if (items.length === 0) {
      setNotice("Add a few items before placing an order.");
      return;
    }

    const payload = {
      restaurantId,
      items: items.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        pricePaise: item.pricePaise
      })),
      subtotalPaise: summary.subtotalPaise,
      deliveryFeePaise: summary.deliveryFeePaise,
      platformFeePaise: summary.platformFeePaise,
      totalPaise: summary.totalPaise
    };

    try {
      await createOrder(payload);
      clearCart();
      setNotice("Order draft submitted. Hook the backend next to persist and broadcast updates.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <Shell
      title="Build a Hyderabad order"
      subtitle="This page keeps the menu-card feel of the old project while staying ready for API-backed checkout. Prices are still modeled in paise."
    >
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-5 lg:grid-cols-2">
          {SAMPLE_MENU.map((item) => (
            <MenuItemCard key={item.id} item={item} onAdd={addItem} />
          ))}
        </div>

        <aside className="card-surface h-fit p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Cart summary</p>
          <div className="mt-5 space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">Your cart is empty.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[#f8f9fa] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#1a1a1a]">{item.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">Rs {(item.pricePaise / 100).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded-full border border-black/10 px-3 py-1 text-sm"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-full border border-black/10 px-3 py-1 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 space-y-3 border-t border-black/10 pt-5 text-sm text-slate-500">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>Rs {(summary.subtotalPaise / 100).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery fee</span>
              <span>Rs {(summary.deliveryFeePaise / 100).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Platform fee</span>
              <span>Rs {(summary.platformFeePaise / 100).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-[#1a1a1a]">
              <span>Total</span>
              <span>Rs {(summary.totalPaise / 100).toFixed(2)}</span>
            </div>
          </div>

          {notice ? (
            <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8f9fa] px-4 py-3 text-sm text-slate-600">
              {notice}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleCheckout}
            className="mt-6 w-full rounded-xl bg-[#01de1a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
          >
            Place order
          </button>
        </aside>
      </section>
    </Shell>
  );
}
