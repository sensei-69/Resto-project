import { useEffect, useRef, useState } from "react";
import { ArrowRight, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { CATEGORIES } from "../food-select-page/data";
import type { FoodItem } from "../food-select-page/types";

export function DishShow() {
  const navigate = useNavigate();
  const { addToCartDirect } = useCart();

  // Pick interesting items for the marquee — grab first item from each subcategory
  const dishes = CATEGORIES.flatMap(c => c.subcategories.map(s => s.items[0]))
    .filter(Boolean)
    .slice(0, 10) as FoodItem[];

  const row = [...dishes, ...dishes, ...dishes];

  const handleOrder = (food: FoodItem, e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      return;
    }
    addToCartDirect(food);
    navigate("/menu", { state: { autoOpenDishId: food.id } });
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Desktop drag scrolling
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Handle mouse wheel scrolling (translate vertical to horizontal)
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault(); // Prevent page from scrolling down
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });

    let animationId: number;
    let lastTime = performance.now();
    const speed = 75; // px/sec - sped up for better flow

    const scroll = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      if (!isHovered) {
        el.scrollLeft += (speed * dt) / 1000;
      }

      // Loop logic: if we've scrolled past the first third, silently jump back
      // This applies continuously even during manual dragging/scrolling
      const third = el.scrollWidth / 3;
      if (el.scrollLeft >= third && third > 0) {
        el.scrollLeft -= third;
      } else if (el.scrollLeft <= 0 && third > 0) {
        el.scrollLeft += third;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => {
      el.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(animationId);
    };
  }, [isHovered]);

  return (
    <section id="menu" className="lp-dishes-section">
      <div className="lp-dishes-header">
        <h2 className="lp-dishes-title">
          The <span className="lp-text-primary">line-up</span>
        </h2>
        <button
          type="button"
          onClick={() => navigate("/menu")}
          className="lp-dishes-btn"
        >
          <span>See Menu</span>
          <ArrowRight className="lp-dishes-btn-icon" />
        </button>
      </div>

      <div 
        className="lp-marquee-container"
        ref={scrollRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          isDown.current = false;
          if (scrollRef.current) scrollRef.current.style.cursor = "grab";
        }}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
        onPointerDown={(e) => {
          isDown.current = true;
          hasDragged.current = false;
          setIsHovered(true);
          if (scrollRef.current) {
            startX.current = e.pageX - scrollRef.current.offsetLeft;
            scrollLeft.current = scrollRef.current.scrollLeft;
            scrollRef.current.style.cursor = "grabbing";
          }
        }}
        onPointerUp={() => {
          isDown.current = false;
          setIsHovered(false);
          if (scrollRef.current) scrollRef.current.style.cursor = "grab";
        }}
        onPointerMove={(e) => {
          if (!isDown.current || !scrollRef.current) return;
          // Only prevent default if it's a mouse (pointerType === 'mouse') to not interfere with native touch swipe
          if (e.pointerType === 'mouse') {
            e.preventDefault();
          }
          const x = e.pageX - scrollRef.current.offsetLeft;
          const walk = (x - startX.current) * 1; // 1:1 drag ratio for natural feel
          scrollRef.current.scrollLeft = scrollLeft.current - walk;
          if (Math.abs(walk) > 5) hasDragged.current = true;
        }}
        style={{ cursor: "grab" }}
      >
        <div className="lp-marquee-track">
          {row.map((d, i) => {
            const id = `${d.id}-${i}`;
            return (
              <figure key={id} className="lp-dish-card-wrapper">
                <button
                  type="button"
                  onClick={(e) => handleOrder(d, e)}
                  aria-label={`Order ${d.name}`}
                  className="lp-dish-card"
                >
                  <img
                    src={d.image}
                    alt={d.name}
                    loading="lazy"
                    className="lp-dish-card-img"
                  />

                  {/* Price badge */}
                  <span className="lp-dish-price-badge">${d.price.toFixed(2)}</span>

                  {/* Name banner */}
                  <figcaption className="lp-dish-card-caption">
                    <span className="lp-dish-card-name">{d.name}</span>
                  </figcaption>

                  {/* Hover overlay */}
                  <span className="lp-dish-hover-overlay">
                    <span className="lp-dish-hover-icon-circle">
                      <Utensils className="lp-dish-hover-icon" />
                    </span>
                    <span className="lp-dish-hover-text">Order</span>
                  </span>
                </button>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
