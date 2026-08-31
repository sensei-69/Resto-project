import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Languages,
  LifeBuoy,
  LogOut,
  Menu,
  Settings,
  ShoppingCart,
  User,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import "./navbar-auth.css";

const links = [
  { label: "Offers", href: "#offers", badge: 3 },
  { label: "About us", href: "#about" },
  { label: "Location", href: "#location" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const acctRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { cartCount, setIsCartOpen } = useCart();
  const { user, token, logout } = useAuth();

  // Ticket modal state ("Write a ticket" -> POST /api/tickets)
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the account dropdown on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) {
        setAcctOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const closeTicket = () => {
    setTicketOpen(false);
    setSent(false);
    setSubject("");
    setMessage("");
    setTicketError(null);
  };

  const submitTicket = async () => {
    if (sending || !subject.trim() || !message.trim()) return;
    setSending(true);
    setTicketError(null);
    try {
      await api("/api/tickets", {
        method: "POST",
        body: { subject: subject.trim(), message: message.trim() },
        token,
      });
      setSent(true);
    } catch (err) {
      setTicketError(err instanceof Error ? err.message : "Could not send the ticket");
    } finally {
      setSending(false);
    }
  };

  const signOut = () => {
    setAcctOpen(false);
    logout();
    navigate("/");
  };

  return (
    <header className={`lp-navbar ${scrolled ? "lp-navbar--scrolled" : ""}`}>
      <nav className="lp-nav-container">
        {/* Brand Name \u2014 left */}
        <a href="#top" className="lp-brand">
          Resto<span className="lp-brand-accent">Venezia</span>
        </a>

        {/* Brand Logo \u2014 middle */}
        <a href="#top" aria-label="Resto Venezia home" className="lp-logo-link">
          <span className="lp-logo-badge">
            <Utensils className="lp-logo-icon" />
          </span>
        </a>

        {/* Links & Actions \u2014 right */}
        <div className="lp-nav-right lp-desktop-only">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="lp-nav-link">
              <span>{l.label}</span>
              {l.badge ? <span className="lp-nav-badge">{l.badge}</span> : null}
            </a>
          ))}

          {cartCount > 0 && (
            <button
              type="button"
              aria-label="Cart"
              onClick={() => setIsCartOpen(true)}
              className="lp-profile-btn"
              style={{ position: "relative" }}
            >
              <ShoppingCart className="lp-profile-icon" />
              <span className="lp-nav-badge" style={{ right: -8, top: -8 }}>{cartCount}</span>
            </button>
          )}

          {user ? (
            <div className="lp-myspace" ref={acctRef}>
              <span className="lp-myspace-label">My Space</span>
              <button type="button" aria-label="Notifications" className="lp-profile-btn">
                <Bell className="lp-profile-icon" />
              </button>
              <button
                type="button"
                aria-label="Account menu"
                className="lp-avatar-btn"
                onClick={() => setAcctOpen((o) => !o)}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="lp-avatar-img" />
                ) : (
                  <User className="lp-profile-icon" />
                )}
              </button>
              {acctOpen ? (
                <div className="lp-acct-menu" role="menu">
                  <div className="lp-acct-head">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <div className="lp-acct-item lp-acct-item--static">
                    <Wallet size={16} /> Balance
                    <b>${Number(user.balance).toFixed(2)}</b>
                  </div>
                  <div className="lp-acct-item lp-acct-item--static">
                    <Languages size={16} /> Language
                    <b>{user.preferred_language ?? "EN"}</b>
                  </div>
                  <button
                    type="button"
                    className="lp-acct-item"
                    onClick={() => {
                      setAcctOpen(false);
                      setTicketOpen(true);
                    }}
                  >
                    <LifeBuoy size={16} /> Write a ticket
                  </button>
                  <button
                    type="button"
                    className="lp-acct-item"
                    onClick={() => {
                      setAcctOpen(false);
                      navigate("/dashboard");
                    }}
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <button type="button" className="lp-acct-item lp-acct-item--danger" onClick={signOut}>
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="lp-acct" ref={acctRef}>
              <button
                type="button"
                aria-label="Account"
                onClick={() => setAcctOpen((o) => !o)}
                className="lp-profile-btn"
              >
                <User className="lp-profile-icon" />
              </button>
              {acctOpen ? (
                <div className="lp-acct-menu" role="menu">
                  <button type="button" className="lp-acct-item" onClick={() => navigate("/login")}>
                    Login
                  </button>
                  <button type="button" className="lp-acct-item" onClick={() => navigate("/register")}>
                    Sign up
                  </button>
                </div>
              ) : null}
            </div>
          )}
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
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigate("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="lp-nav-menu-btn lp-nav-menu-btn--mobile"
                >
                  My Space
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="lp-profile-btn lp-profile-btn--mobile"
                >
                  <LogOut className="lp-profile-icon" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigate("/login");
                    setMobileMenuOpen(false);
                  }}
                  className="lp-nav-menu-btn lp-nav-menu-btn--mobile"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate("/register");
                    setMobileMenuOpen(false);
                  }}
                  className="lp-profile-btn lp-profile-btn--mobile"
                >
                  <User className="lp-profile-icon" />
                  <span>Sign up</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Write a ticket modal */}
      {ticketOpen ? (
        <div className="lp-modal-overlay" onClick={closeTicket}>
          <div className="lp-modal" role="dialog" aria-label="Write a ticket" onClick={(e) => e.stopPropagation()}>
            <h3 className="lp-modal-title">Write a ticket</h3>
            {sent ? (
              <>
                <p className="lp-modal-ok">Ticket sent \u2014 we'll get back to you soon.</p>
                <div className="lp-modal-actions">
                  <button type="button" className="lp-modal-btn lp-modal-btn--primary" onClick={closeTicket}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  className="lp-modal-input"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <textarea
                  className="lp-modal-input lp-modal-textarea"
                  placeholder="How can we help?"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                {ticketError ? <p className="lp-modal-err">{ticketError}</p> : null}
                <div className="lp-modal-actions">
                  <button type="button" className="lp-modal-btn" onClick={closeTicket}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="lp-modal-btn lp-modal-btn--primary"
                    disabled={sending || !subject.trim() || !message.trim()}
                    onClick={submitTicket}
                  >
                    {sending ? "Sending\u2026" : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
