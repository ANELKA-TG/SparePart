import { Link } from "react-router-dom";
import { SITE } from "../config/site";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon, WrenchIcon } from "./Icons";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="brand">
            <span className="brand-mark"><WrenchIcon size={18} /></span>
            <span>Spare<em>Part</em></span>
          </div>
          <p className="footer-text">{SITE.tagline}</p>
        </div>

        <div>
          <h4>Shop</h4>
          <ul>
            <li><Link to="/">All parts</Link></li>
            <li><Link to="/cart">My cart</Link></li>
            <li><Link to="/orders">My orders</Link></li>
          </ul>
        </div>

        <div>
          <h4>Account</h4>
          <ul>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Create an account</Link></li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <ul className="footer-contact">
            <li><PhoneIcon size={16} /> {SITE.phone}</li>
            <li><MailIcon size={16} /> {SITE.email}</li>
            <li><MapPinIcon size={16} /> {SITE.address}</li>
            <li><ClockIcon size={16} /> {SITE.hours}</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
}