import { Award, Gauge, Sparkles, Utensils } from "lucide-react";
import { useReveal } from "./useReveal";

const values = [
  {
    icon: Award,
    title: "Perfection",
    text: "Every patty seared to the exact second, seasoned by hand, stacked with intent.",
  },
  {
    icon: Gauge,
    title: "Speed",
    text: "Order to tray in twelve minutes flat — hot food should never wait.",
  },
  {
    icon: Sparkles,
    title: "Cleanliness",
    text: "Open kitchen, daily deep cleans, nothing we would not show you.",
  },
  {
    icon: Utensils,
    title: "Quality",
    text: "Local beef, buns baked at dawn, produce delivered every single morning.",
  },
];

export function Values() {
  const { ref, className } = useReveal<HTMLDivElement>();

  return (
    <section id="about" className="lp-values-section">
      <div ref={ref} className={className}>
        <p className="lp-section-subtitle">Why people come back</p>
        <h2 className="lp-values-heading">Savor the journey, discover the delight</h2>

        <div className="lp-values-grid">
          {values.map((v, i) => (
            <article
              key={v.title}
              style={{ animationDelay: `${i * 90}ms` }}
              className="lp-value-card"
            >
              <span className="lp-value-icon-box">
                <v.icon className="lp-value-icon" />
              </span>
              <h3 className="lp-value-title">{v.title}</h3>
              <p className="lp-value-text">{v.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
