import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { CartIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon, WrenchIcon } from "./Icons";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const urlSearch = params.get("search") || "";

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(urlSearch);

  // Keep the box in sync when the search is cleared elsewhere
  useEffect(() => setQ(urlSearch), [urlSearch]);

  const close = () => setOpen(false);

  const submitSearch = (e) => {
    e.preventDefault();
    close();
    const term = q.trim();
    navigate(term ? `/?search=${encodeURIComponent(term)}` : "/");
  };

  const handleLogout = () => {
    close();
    logout();
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark"><WrenchIcon size={18} /></span>
          <span>Spare<em>Part</em></span>
        </Link>

        <form className="nav-search" onSubmit={submitSearch} role="search">
          <SearchIcon size={18} />
          <input
            type="search"
            placeholder="Search by part name, part number or brand"
            aria-label="Search parts"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          <NavLink to="/" end onClick={close}>Products</NavLink>
          {user && <NavLink to="/orders" onClick={close}>My orders</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
          {user ? (
            <>
              <span className="nav-user"><UserIcon size={16} /> {user.name.split(" ")[0]}</span>
              <button className="link-btn light" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>Login</NavLink>
              <NavLink to="/register" className="nav-cta" onClick={close}>Register</NavLink>
            </>
          )}
        </nav>

        <div className="nav-actions">
          {user && (
            <Link to="/cart" className="cart-link" aria-label="Cart" onClick={close}>
              <CartIcon size={22} />
              {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
            </Link>
          )}
          <button
            className="menu-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}