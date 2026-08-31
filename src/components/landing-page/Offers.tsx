import { useEffect, useState } from "react";
import { BadgePercent, Check, Clock, Gift, ShoppingCart, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useCart } from "../../context/CartContext";
import "./offers.css";

type OfferType = "PACK" | "DISCOUNT" | "HAPPY_HOUR";

type OfferItem = {
  id_product: number;
  quantity: number;
  name: string;
  image: string | null;
};

type Offer = {
  id: number;
  title: string;
  type: OfferType;
  price: string | null;
  discount_percent: string | null;
  availability_window: string | null;
  applies_to_whole_menu: boolean;
  is_active: boolean;
  items: OfferItem[];
};

const TYPE_LABEL: Record<OfferType, string> = {
  PACK: "Pack",
  DISCOUNT: "Discount",
  HAPPY_HOUR: "Happy Hour",
};

const THUMB_FALLBACK = "https://placehold.co/80x80/A80D25/FFFFFF?text=%3F";

export function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [addedId, setAddedId] = useState<number | null>(null);
  const { registerFood, addToCartDirect, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api<{ offers: Offer[] }>("/api/offers")
      .then(({ offers: all }) => {
        if (!cancelled) setOffers(all.filter((o) => o.is_active));
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing live: don't render an empty section.
  if (offers.length === 0) return null;

  const orderOffer = (o: Offer) => {
    const food = {
      id: `offer-${o.id}`,
      name: o.title,
      subtitle:
        o.items.map((i) => `${i.quantity}x ${i.name}`).join(" \u00b7 ") || "Special offer",
      price: Number(o.price),
      image: o.items[0]?.image ?? THUMB_FALLBACK,
      ingredients: [],
      addOns: [],
    };
    registerFood(food);
    addToCartDirect(food);
    setAddedId(o.id);
    setIsCartOpen(true);
    window.setTimeout(() => setAddedId((v) => (v === o.id ? null : v)), 2000);
  };

  return (
    <section id="offers" className="lp-offers">
      <div className="lp-offers-inner">
        <p className="lp-offers-eyebrow">Right now</p>
        <h2 className="lp-offers-title">Offers &amp; packs</h2>
        <p className="lp-offers-sub">
          Combos, discounts and happy hours \u2014 live from the kitchen. Order a pack in one tap.
        </p>

        <div className="lp-offers-grid">
          {offers.map((o) => {
            const priced = Number(o.price) > 0;
            const added = addedId === o.id;
            return (
              <article key={o.id} className="lp-offer-card">
                <div className="lp-offer-head">
                  <span className="lp-offer-type">
                    {o.type === "PACK" ? (
                      <Gift size={14} />
                    ) : o.type === "DISCOUNT" ? (
                      <BadgePercent size={14} />
                    ) : (
                      <Tag size={14} />
                    )}
                    {TYPE_LABEL[o.type]}
                  </span>
                  {o.availability_window ? (
                    <span className="lp-offer-window">
                      <Clock size={13} /> {o.availability_window}
                    </span>
                  ) : null}
                </div>

                <h3 className="lp-offer-name">{o.title}</h3>

                <div className="lp-offer-items">
                  {o.applies_to_whole_menu ? (
                    <span className="lp-offer-whole">Valid on the whole menu</span>
                  ) : (
                    o.items.map((i) => (
                      <span key={i.id_product} className="lp-offer-chip">
                        <img src={i.image ?? THUMB_FALLBACK} alt="" loading="lazy" />
                        {i.quantity}x {i.name}
                      </span>
                    ))
                  )}
                </div>

                <div className="lp-offer-foot">
                  <div className="lp-offer-pricing">
                    {priced ? <span className="lp-offer-price">${Number(o.price).toFixed(2)}</span> : null}
                    {o.discount_percent ? (
                      <span className="lp-offer-discount">-{Number(o.discount_percent)}%</span>
                    ) : null}
                  </div>
                  {priced ? (
                    <button
                      type="button"
                      className={`lp-offer-cta${added ? " lp-offer-cta--added" : ""}`}
                      onClick={() => orderOffer(o)}
                    >
                      {added ? <Check size={15} /> : <ShoppingCart size={15} />}
                      {added ? "Added" : "Add to order"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="lp-offer-cta lp-offer-cta--ghost"
                      onClick={() => navigate("/menu")}
                    >
                      Browse the menu
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
