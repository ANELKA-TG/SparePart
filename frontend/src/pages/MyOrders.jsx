import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/my")
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h1>My orders</h1>
      {orders.length === 0 && <p>You have no orders yet.</p>}
      {orders.map((o) => (
        <Link to={`/orders/${o._id}`} className="order-row" key={o._id}>
          <div>
            <strong>Order #{o._id.slice(-6).toUpperCase()}</strong> // takes the last 6 characters of the string
            <span className="muted">
              {new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item(s)
            </span>
          </div>
          <div className="order-right">
            <span className={`badge ${o.status}`}>{o.status}</span>
            <strong>{o.total.toLocaleString()} FCFA</strong>
          </div>
        </Link>
      ))}
    </div>
  );
}