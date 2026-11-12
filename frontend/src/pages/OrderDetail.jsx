import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data))
      .catch((err) => setError(err.response?.data?.message || "Could not load order"));

  useEffect(() => { load(); }, [id]);

  const cancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      const { data } = await api.put(`/orders/${id}/cancel`);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel");
    }
  };

  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!order) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <Link to="/orders">← My orders</Link>
      <h1>Order #{order._id.slice(-6).toUpperCase()}</h1>
      <p>
        <span className={`badge ${order.status}`}>{order.status}</span>{" "}
        <span className="muted">
          {order.isPaid ? "Paid" : "Payment due on delivery (cash)"}
        </span>
      </p>

      <div className="summary">
        {order.items.map((i) => (
          <div className="summary-row" key={i.product}>
            <span>{i.name} <span className="muted">({i.partNumber})</span> × {i.qty}</span>
            <span>{(i.price * i.qty).toLocaleString()} FCFA</span>
          </div>
        ))}
        <div className="summary-row total">
          <span>Total</span>
          <span>{order.total.toLocaleString()} FCFA</span>
        </div>
      </div>

      <h3>Delivery</h3>
      <p>
        {order.shippingInfo.fullName}<br />
        {order.shippingInfo.phone}<br />
        {order.shippingInfo.address}, {order.shippingInfo.city}
        {order.shippingInfo.notes && <><br /><span className="muted">Note: {order.shippingInfo.notes}</span></>}
      </p>

      {order.status === "pending" && (
        <button className="btn danger" onClick={cancel}>Cancel order</button>
      )}
    </div>
  );
}