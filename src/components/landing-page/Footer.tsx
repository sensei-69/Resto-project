export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-container">
        <span className="lp-footer-brand">
          Resto<span className="lp-text-primary">Venezia</span>
        </span>
        <nav className="lp-footer-nav" aria-label="Footer navigation">
          <a href="#offers" className="lp-footer-link">Offers</a>
          <a href="#about" className="lp-footer-link">About us</a>
          <a href="#menu" className="lp-footer-link">Menu</a>
          <a href="#location" className="lp-footer-link">Location</a>
          <a href="#contact" className="lp-footer-link">Contact</a>
        </nav>
        <p className="lp-footer-copy">© {new Date().getFullYear()} Resto Venezia. All rights reserved.</p>
      </div>
    </footer>
  );
}
