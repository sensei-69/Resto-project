import { Mail, MessageCircle, Phone } from "lucide-react";
import { useReveal } from "./useReveal";

const items = [
  { icon: Phone, label: "Call us", value: "+1 (555) 234-5678", href: "tel:+15552345678" },
  { icon: Mail, label: "Email", value: "ciao@restovenezia.com", href: "mailto:ciao@restovenezia.com" },
  { icon: MessageCircle, label: "Social", value: "@restovenezia", href: "https://instagram.com" },
];

export function Contact() {
  const { ref, className } = useReveal<HTMLDivElement>();

  return (
    <section id="contact" className="lp-contact-section">
      <div ref={ref} className={`${className} lp-contact-container`}>
        <div className="lp-contact-grid">
          <div className="lp-contact-text">
            <p className="lp-contact-subtitle">Say hello</p>
            <h2 className="lp-contact-heading">
              Hungry? <span className="lp-text-yellow">Talk to us.</span>
            </h2>
            <p className="lp-contact-desc">
              Catering, big tables, birthdays or just a question about the secret sauce — we answer fast.
            </p>
          </div>

          <div id="offers" className="lp-contact-cards">
            {items.map((c) => (
              <a key={c.label} href={c.href} className="lp-contact-card">
                <c.icon className="lp-contact-card-icon" />
                <div className="lp-contact-card-label">{c.label}</div>
                <div className="lp-contact-card-value">{c.value}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
