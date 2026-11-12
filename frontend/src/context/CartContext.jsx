import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

const GUEST_KEY = "cart_guest";

const readCart = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

// Combine two carts, summing quantities but never exceeding stock
const mergeCarts = (base, extra) => {
  const merged = base.map((i) => ({ ...i }));
  for (const item of extra) {
    const existing = merged.find((i) => i._id === item._id);
    if (existing) {
      existing.qty = Math.min(existing.qty + item.qty, existing.stock);
    } else {
      merged.push({ ...item });
    }
  }
  return merged;
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const key = user ? `cart_${user._id}` : GUEST_KEY;

  const [state, setState] = useState(() => ({ key, items: readCart(key) }));

  // Switch carts when someone logs in or out
  useEffect(() => {
    if (state.key === key) return;

    let next = readCart(key);
    // Items added while logged out are carried into the new user's cart
    if (state.key === GUEST_KEY && user) {
      next = mergeCarts(next, state.items);
      localStorage.removeItem(GUEST_KEY);
    }
    setState({ key, items: next });
  }, [key]);

  // Save the cart whenever it changes
  useEffect(() => {
    localStorage.setItem(state.key, JSON.stringify(state.items));
  }, [state]);

  const items = state.items;

  const setItems = (updater) =>
    setState((prev) => ({
      ...prev,
      items: typeof updater === "function" ? updater(prev.items) : updater,
    }));

  const addToCart = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        const newQty = Math.min(existing.qty + qty, product.stock);
        return prev.map((i) => (i._id === product._id ? { ...i, qty: newQty } : i));
      }
      return [
        ...prev,
        {
          _id: product._id,
          name: product.name,
          partNumber: product.partNumber,
          price: product.price,
          stock: product.stock,
          image: product.images?.[0] || "",
          qty: Math.min(qty, product.stock),
        },
      ];
    });
  };

  const updateQty = (id, qty) =>
    setItems((prev) =>
      prev.map((i) =>
        i._id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i
      )
    );

  const removeFromCart = (id) => setItems((prev) => prev.filter((i) => i._id !== id));
  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, updateQty, removeFromCart, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);