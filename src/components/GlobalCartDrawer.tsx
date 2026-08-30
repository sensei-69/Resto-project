import { useCart } from "../context/CartContext";
import { OrderCart } from "./food-select-page/OrderCart";
import "./food-select-page/FoodSelectUI.css";
import "./GlobalCartDrawer.css";

export function GlobalCartDrawer() {
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

  return (
    <>
      <div 
        className={`global-cart-backdrop ${isCartOpen ? "open" : ""}`} 
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />
      <div className={`global-cart-drawer ${isCartOpen ? "open" : ""}`}>
        <OrderCart
          lines={lines}
          foodById={foodById}
          onQty={changeQty}
          onRemove={removeLine}
          onAddOnQty={changeAddOnQty}
          onClear={clearLines}
        />
      </div>
    </>
  );
}
