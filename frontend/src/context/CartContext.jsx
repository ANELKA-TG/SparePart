import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

const readCart = (key) => {
  if (!key) return [];
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const key = user ? `cart_${user._id}` : null;

  const [state, setState] = useState(() => ({ key, items: readCart(key) }));

  // Load the right cart when someone logs in or out
  useEffect(() => {
    if (state.key !== key) setState({ key, items: readCart(key) });
  }, [key]);

  // Save the cart whenever it changes (only for logged-in users)
  useEffect(() => {
    if (state.key) localStorage.setItem(state.key, JSON.stringify(state.items));
  }, [state]);

  const items = state.items;

  const setItems = (updater) =>
    setState((prev) => ({
      ...prev,
      items: typeof updater === "function" ? updater(prev.items) : updater,
    }));

  // Returns false if nobody is logged in
  const addToCart = (product, qty = 1) => {
    if (!user) return false;
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
    return true;
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