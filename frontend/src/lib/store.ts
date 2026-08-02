import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CartItem = {
  id: string;
  title: string;
  image: string;
  price: number;
  qty: number;
  selectedSize?: string;
  selectedColour?: string;
};

type Store = {
  cart: CartItem[];
  wishlist: string[];
};

// ─── Cart Drawer open state (in-memory only, not persisted) ───────────────────
let _cartOpen = false;
const cartOpenListeners = new Set<(v: boolean) => void>();

export function openCart() {
  _cartOpen = true;
  cartOpenListeners.forEach((l) => l(true));
}
export function closeCart() {
  _cartOpen = false;
  cartOpenListeners.forEach((l) => l(false));
}
export function subscribeCartOpen(fn: (v: boolean) => void) {
  cartOpenListeners.add(fn);
  return () => {
    cartOpenListeners.delete(fn);
  };
}
export function getCartOpen() {
  return _cartOpen;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const KEY = "vagoda-store-v2";
const empty: Store = { cart: [], wishlist: [] };

let memory: Store = empty;
const listeners = new Set<() => void>();

function read(): Store {
  if (typeof window === "undefined") return empty;
  try {
    return { ...empty, ...(JSON.parse(localStorage.getItem(KEY) || "{}") as Store) };
  } catch {
    return empty;
  }
}

function write(next: Store) {
  memory = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStore() {
  const [state, setState] = useState<Store>(memory);

  useEffect(() => {
    memory = read();
    setState(memory);
    const listener = () => setState({ ...memory });
    listeners.add(listener);
    return () => void listeners.delete(listener);
  }, []);

  const toggleWishlist = useCallback((id: string) => {
    const has = memory.wishlist.includes(id);
    write({
      ...memory,
      wishlist: has ? memory.wishlist.filter((x) => x !== id) : [...memory.wishlist, id],
    });
    toast.success(has ? "Removed from saved items" : "Saved to your wishlist");
  }, []);

  /**
   * Add a full CartItem to the cart.
   * If the same product+size+colour already exists → increment qty.
   */
  const addToCart = useCallback(
    (item: Omit<CartItem, "qty"> & { qty?: number }) => {
      const existing = memory.cart.findIndex(
        (c) =>
          c.id === item.id &&
          c.selectedSize === item.selectedSize &&
          c.selectedColour === item.selectedColour
      );
      let next: CartItem[];
      if (existing >= 0) {
        next = memory.cart.map((c, i) =>
          i === existing ? { ...c, qty: c.qty + (item.qty ?? 1) } : c
        );
      } else {
        next = [...memory.cart, { ...item, qty: item.qty ?? 1 }];
      }
      write({ ...memory, cart: next });
      toast.success("Added to cart");
    },
    []
  );

  const removeFromCart = useCallback((id: string, selectedSize?: string, selectedColour?: string) => {
    write({
      ...memory,
      cart: memory.cart.filter(
        (c) =>
          !(c.id === id && c.selectedSize === selectedSize && c.selectedColour === selectedColour)
      ),
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number, selectedSize?: string, selectedColour?: string) => {
    if (qty < 1) return;
    write({
      ...memory,
      cart: memory.cart.map((c) =>
        c.id === id && c.selectedSize === selectedSize && c.selectedColour === selectedColour
          ? { ...c, qty }
          : c
      ),
    });
  }, []);

  const clearCart = useCallback(() => {
    write({ ...memory, cart: [] });
  }, []);

  const cartCount = state.cart.reduce((sum, c) => sum + c.qty, 0);
  const cartTotal = state.cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  return {
    ...state,
    cartCount,
    cartTotal,
    toggleWishlist,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
  };
}
