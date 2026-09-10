import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { OrderCart } from "./food-select-page/OrderCart";
import { CheckoutPanel } from "./CheckoutPanel";
import { money, type Order } from "../lib/orders";
import "./food-select-page/FoodSelectUI.css";
import "./GlobalCartDrawer.css";

type View = "cart" | "checkout" | "placed";

export function GlobalCartDrawer() {
  const navigate = useNavigate();
  const {
    isCartOpen,
    setIsCartOpen,
    lines,
    foodById,
    changeQty,
    removeLine,
    changeAddOnQty,
    clearLines,
  } = useCart();
  const [view, setView] = useState<View>("cart");
  const [placed, setPlaced] = useState<Order | null>(null);

  // Back to the cart once the drawer has finished sliding out.
  useEffect(() => {
    if (isCartOpen) return;
    const t = window.setTimeout(() => {
      setView("cart");
      setPlaced(null);
    }, 320);
    return () => window.clearTimeout(t);
  }, [isCartOpen]);

  // Nothing left to check out: fall back to the (empty) cart.
  useEffect(() => {
    if (view === "checkout" && lines.length === 0) setView("cart");
  }, [view, lines.length]);

  const track = () => {
    setIsCartOpen(false);
    navigate("/my-orders", { state: { placed: placed?.order_number ?? null } });
  };

  return (
    <>
      <div
        className={`global-cart-backdrop ${isCartOpen ? "open" : ""}`}
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />
      <div className={`global-cart-drawer ${isCartOpen ? "open" : ""}`}>
        {view === "cart" ? (
          <OrderCart
            lines={lines}
            foodById={foodById}
            onQty={changeQty}
            onRemove={removeLine}
            onAddOnQty={changeAddOnQty}
            onClear={clearLines}
            onOrder={() => setView("checkout")}
          />
        ) : null}
        {view === "checkout" ? (
          <CheckoutPanel
            onBack={() => setView("cart")}
            onPlaced={(order) => {
              setPlaced(order);
              setView("placed");
            }}
          />
        ) : null}
        {view === "placed" && placed ? (
          <OrderPlaced order={placed} onTrack={track} onClose={() => setIsCartOpen(false)} />
        ) : null}
      </div>
    </>
  );
}

function OrderPlaced({
  order,
  onTrack,
  onClose,
}: {
  order: Order;
  onTrack: () => void;
  onClose: () => void;
}) {
  const where =
    order.method_of_sale === "DELIVERY"
      ? order.delivery_person_name
        ? `${order.delivery_person_name} will bring it to you.`
        : "A rider will be assigned shortly."
      : order.method_of_sale === "DINE_IN"
        ? order.table_number
          ? `We'll serve it at table ${order.table_number}.`
          : "We'll serve it at your table."
        : "Pick it up at the counter when it's ready.";

  return (
    <div className="gc-checkout gc-success">
      <div className="gc-success-icon">
        <CheckCircle2 strokeWidth={2} />
      </div>
      <h2 className="gc-success-title">Order placed!</h2>
      <p className="gc-success-number">#{order.order_number}</p>
      <p className="gc-success-text">
        {money(order.total)} \u00b7 {order.method_of_sale_name} \u00b7 {order.payment_method_name}
        <br />
        The kitchen has your order. {where} Follow every step from your dashboard.
      </p>
      <button className="fs-order-btn gc-cta" onClick={onTrack}>
        Track my order
      </button>
      <button className="gc-ghost" onClick={onClose}>
        Keep browsing
      </button>
    </div>
  );
}
