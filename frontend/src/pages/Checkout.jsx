import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.name || "",
    phone: "",
    city: "",
    address: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/orders", {
        items: items.map((i) => ({ product: i._id, qty: i.qty })),
        shippingInfo: form,
      });
      clearCart();
      navigate(`/orders/${data._id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not place order");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0)
    return (
      <div className="container">
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
      </div>
    );

  return (
    <div className="container">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <form onSubmit={handleSubmit} className="form">
          <h3>Delivery details</h3>
          <input name="fullName" placeholder="Full name" value={form.fullName}
            onChange={handleChange} required />
          <input name="phone" placeholder="Phone number" value={form.phone}
            onChange={handleChange} required />
          <input name="city" placeholder="City" value={form.city}
            onChange={handleChange} required />
          <input name="address" placeholder="Delivery address / neighbourhood"
            value={form.address} onChange={handleChange} required />
          <textarea name="notes" placeholder="Notes (optional)" value={form.notes}
            onChange={handleChange} rows={3} />

          <h3>Payment</h3>
          <p className="pay-box"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#000000"><path d="M5,19V5Q5,5 5,6.11Q5,7.22 5,9v6q0,1.77 0,2.89T5,19Zm0,2q-0.83,0-1.41-0.59T3,19V5Q3,4.17 3.59,3.59T5,3H19q0.83,0 1.41,0.59T21,5V7.5H19V5H5V19H19V16.5h2V19q0,0.82-0.59,1.41T19,21H5Zm8-4q-0.82,0-1.41-0.59T11,15V9q0-0.83 0.59-1.41T13,7h7q0.83,0 1.41,0.59T22,9v6q0,0.82-0.59,1.41T20,17H13Zm7-2V9H13v6h7Zm-2.94-1.94Q17.5,12.63 17.5,12t-0.44-1.06T16,10.5t-1.06,0.44T14.5,12t0.44,1.06T16,13.5t1.06-0.44Z"/></svg> Cash on delivery: you pay when you receive your parts.</p>

          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={loading}>
            {loading ? "Placing order..." : "Place order"}
          </button>
        </form>

        <div className="summary">
          <h3>Order summary</h3>
          {items.map((i) => (
            <div className="summary-row" key={i._id}>
              <span>{i.name} × {i.qty}</span>
              <span>{(i.price * i.qty).toLocaleString()} FCFA</span>
            </div>
          ))}
          <div className="summary-row total">
            <span>Total</span>
            <span>{totalPrice.toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>
    </div>
  );
}