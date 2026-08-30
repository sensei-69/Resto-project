import { useEffect, useState } from "react";
import { User, Utensils, Menu, X, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const links = [
  { label: "Offers", href: "#offers", badge: 3 },
  { label: "About us", href: "#about" },
  { label: "Location", href: "#location" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { cartCount, setIsCartOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`lp-navbar ${scrolled ? "lp-navbar--scrolled" : ""}`}>
      <nav className="lp-nav-container">
        {/* Brand Name — left */}
        <a href="#top" className="lp-brand">
          Resto<span className="lp-brand-accent">Venezia</span>
        </a>

        {/* Brand Logo — middle */}
        <a href="#top" aria-label="Resto Venezia home" className="lp-logo-link">
          <span className="lp-logo-badge">
            <Utensils className="lp-logo-icon" />
          </span>
        </a>

        {/* Links & Actions — right */}
        <div className="lp-nav-right lp-desktop-only">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="lp-nav-link">
              <span>{l.label}</span>
              {l.badge ? <span className="lp-nav-badge">{l.badge}</span> : null}
            </a>
          ))}

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="lp-nav-menu-btn"
            aria-label="My space"
          >
            My space
          </button>

          {cartCount > 0 && (
            <button
              type="button"
              aria-label="Cart"
              onClick={() => setIsCartOpen(true)}
              className="lp-profile-btn"
              style={{ position: 'relative' }}
            >
              <ShoppingCart className="lp-profile-icon" />
              <span className="lp-nav-badge" style={{ right: -8, top: -8 }}>{cartCount}</span>
            </button>
          )}

          <button
            type="button"
            aria-label="Profile"
            onClick={() => navigate("/login")}
            className="lp-profile-btn"
          >
            <User className="lp-profile-icon" />
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lp-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Dropdown */}
      <div className={`lp-mobile-dropdown ${mobileMenuOpen ? "lp-mobile-dropdown--open" : ""}`}>
        <div className="lp-mobile-dropdown-inner">
          {links.map((l) => (
            <a 
              key={l.label} 
              href={l.href} 
              className="lp-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{l.label}</span>
              {l.badge ? <span className="lp-nav-badge lp-nav-badge--mobile">{l.badge}</span> : null}
            </a>
          ))}
          
          <div className="lp-mobile-actions">
            <button
              type="button"
              onClick={() => {
                navigate("/dashboard");
                setMobileMenuOpen(false);
              }}
              className="lp-nav-menu-btn lp-nav-menu-btn--mobile"
            >
              My space
            </button>

            <button
              type="button"
              onClick={() => {
                navigate("/login");
                setMobileMenuOpen(false);
              }}
              className="lp-profile-btn lp-profile-btn--mobile"
            >
              <User className="lp-profile-icon" />
              <span>Profile</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
