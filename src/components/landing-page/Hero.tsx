import { ArrowRight, Star } from "lucide-react";
import heroBurger from "./assets/hero-burger.jpg";

interface HeroProps {
  onMenuClick?: () => void;
}

export function Hero({ onMenuClick }: HeroProps) {
  return (
    <section id="top" className="lp-hero">
      {/* Decorative glow elements */}
      <div className="lp-hero-ring" />
      <div className="lp-hero-glow" />

      <div className="lp-hero-container">
        <div className="lp-hero-content lp-reveal lp-is-visible">
          <div className="lp-hero-tag">
            <Star className="lp-hero-tag-icon" />
            <span>Since 2011 · Tunisian Kitchen</span>
          </div>

          <h1 className="lp-hero-title">
            Taste the
            <br />
            <span className="lp-hero-title-accent">Difference</span>
          </h1>

          <p className="lp-hero-desc">
            A warm, family-run restaurant where tradition meets flavour, offering classic Tunisian dishes made with love.
          </p>

          <div className="lp-hero-actions">
            <button
              type="button"
              onClick={onMenuClick}
              className="lp-hero-btn-primary"
            >
              See the menu
              <ArrowRight className="lp-hero-btn-icon" />
            </button>
            <a href="#location" className="lp-hero-btn-secondary">
              Find us
            </a>
          </div>

          <div className="lp-hero-stats">
            {[
              ["12 min", "avg. serve time"],
              ["4.9★", "2,400+ reviews"],
              ["100%", "fresh, never frozen"],
            ].map(([big, small]) => (
              <div key={small} className="lp-hero-stat-item">
                <div className="lp-hero-stat-val">{big}</div>
                <div className="lp-hero-stat-label">{small}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-hero-visual">
          <div className="lp-hero-circle-orbit" />
          <img
            src={heroBurger}
            alt="Double smash burger with melted cheddar and fresh toppings"
            className="lp-hero-img"
          />
          <span className="lp-hero-badge">Chef&apos;s Pick</span>
        </div>
      </div>
    </section>
  );
}
