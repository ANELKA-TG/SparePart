import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand">SparePart</Link>
      <div className="nav-links">
        <Link to="/">Products</Link>
        <Link to="/cart">Cart</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  );
}