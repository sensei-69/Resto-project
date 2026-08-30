import { Clock, MapPin } from "lucide-react";
import restaurant from "./assets/restaurant.jpg";
import { useReveal } from "./useReveal";

export function Location() {
  const { ref, className } = useReveal<HTMLDivElement>();

  return (
    <section id="location" className="lp-location-section">
      <div ref={ref} className={`${className} lp-location-grid`}>
        <div className="lp-location-img-wrap">
          <img
            src={restaurant}
            alt="Resto Venezia storefront glowing at dusk"
            loading="lazy"
            className="lp-location-img"
          />
          <div className="lp-location-badge">
            <div className="lp-location-badge-title">Open now</div>
            <div className="lp-location-badge-sub">Kitchen closes 23:00</div>
          </div>
        </div>

        <div className="lp-location-info">
          <p className="lp-section-subtitle">Find us</p>
          <h2 className="lp-location-heading">On the corner of hungry street</h2>
          <p className="lp-location-desc">
            Two floors, an open kitchen and a patio that catches the last of the evening sun.
            Walk in, or reserve a table for the weekend rush.
          </p>

          <ul className="lp-location-list">
            <li className="lp-location-item">
              <MapPin className="lp-location-item-icon" />
              <div>
                <div className="lp-location-item-title">128 Venezia Avenue</div>
                <div className="lp-location-item-sub">Downtown District, Central</div>
              </div>
            </li>
            <li className="lp-location-item">
              <Clock className="lp-location-item-icon" />
              <div>
                <div className="lp-location-item-title">Mon – Thu · 11:00 – 23:00</div>
                <div className="lp-location-item-sub">Fri – Sun · 11:00 – 01:00</div>
              </div>
            </li>
          </ul>

          <a href="#contact" className="lp-location-btn">
            Book a table
          </a>
        </div>
      </div>
    </section>
  );
}
