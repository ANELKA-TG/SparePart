import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { items, updateQty, removeFromCart, totalPrice } = useCart();

  const validItems = items.filter((i) => i && i._id && typeof i.price === "number");

  if (validItems.length === 0)
    return (
      <div className="container">
        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link to="/" className="btn">Browse products</Link>
      </div>
    );

  return (
    <div className="container">
      <h1>Your cart</h1>
      {validItems.map((item) => (
        <div className="cart-row" key={item._id}>
          <div className="cart-info">
            <strong>{item.name}</strong>
            <span className="muted">Part No: {item.partNumber}</span>
            <span>{item.price.toLocaleString()} FCFA</span>
          </div>
          <div className="cart-actions">
            <input
              type="number"
              min="1"
              max={item.stock}
              value={item.qty}
              onChange={(e) => updateQty(item._id, Number(e.target.value))}
            />
            <span className="line-total">
              {(item.price * item.qty).toLocaleString()} FCFA
            </span>
            <button className="link-btn" onClick={() => removeFromCart(item._id)}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <h2 className="cart-total">Total: {totalPrice.toLocaleString()} FCFA</h2>
      <Link to="/checkout" className="btn">Proceed to checkout</Link>
    </div>
  );
}