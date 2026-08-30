import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Heart, Search, ShoppingCart, User } from "lucide-react";
import { CATEGORIES, DIVISIONS } from "./data";
import { CategoryRail } from "./CategoryRail";
import { FoodGrid } from "./FoodGrid";
import { useCart } from "../../context/CartContext";
import type { CategorySection, CategorySortKey, FoodCategory, FoodItem } from "./types";
import "./FoodSelectUI.css";

function catPopularity(cat: FoodCategory) {
  const items = cat.subcategories.flatMap((s) => s.items);
  if (items.length === 0) return 0;
  return items.reduce((sum, i) => sum + (i.popularity ?? 0), 0) / items.length;
}

/** Find the category and subcategory that contain a given food id */
function findCatAndSub(foodId: string) {
  for (const cat of CATEGORIES) {
    for (const sub of cat.subcategories) {
      if (sub.items.some((item) => item.id === foodId)) {
        return { catId: cat.id, subId: sub.id };
      }
    }
  }
  return null;
}

export default function FoodSelectUI() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    lines,
    pending,
    favorites,
    foodById,
    committedByFood,
    cartCount,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    toggleFavorite,
    dishClick,
    addToCartDirect,
    passFood,
    editFood,
    cancelFood,
    cancelPersonalisation,

    removeUnit,
    toggleUnitRemoved,
    toggleUnitAddOn,
  } = useCart();

  const [openCategoryId, setOpenCategoryId] = useState(CATEGORIES[0]!.id);
  const [activeSubId, setActiveSubId] = useState(CATEGORIES[0]!.subcategories[0]!.id);
  const [dishQuery, setDishQuery] = useState("");
  const [catSort, setCatSort] = useState<CategorySortKey>("universal");
  const [luckySeed, setLuckySeed] = useState(0);
  const [personaliseId, setPersonaliseId] = useState<string | null>(null);

  // On mount, if there's a dish we should auto-open (e.g. from landing page)
  const didAutoSelect = useRef(false);
  useEffect(() => {
    if (didAutoSelect.current) return;
    
    const state = location.state as { autoOpenDishId?: string } | null;
    if (!state || !state.autoOpenDishId) return;

    const dishId = state.autoOpenDishId;
    const loc = findCatAndSub(dishId);
    if (loc) {
      setOpenCategoryId(loc.catId);
      setActiveSubId(loc.subId);
      didAutoSelect.current = true;
    }
  }, [location.state]);

  const sortedCategories = useMemo(() => {
    const list = [...CATEGORIES];
    if (catSort === "universal") return list;
    if (catSort === "alpha") return list.sort((a, b) => a.name.localeCompare(b.name));
    if (catSort === "popular") return list.sort((a, b) => catPopularity(b) - catPopularity(a));
    if (catSort === "favorite") {
      const favCount = (c: FoodCategory) =>
        c.subcategories.flatMap((s) => s.items).filter((i) => favorites.includes(i.id)).length;
      return list.sort((a, b) => favCount(b) - favCount(a) || catPopularity(b) - catPopularity(a));
    }
    // "I'm lucky today" — reshuffled each time it is picked
    return list
      .map((c, i) => ({ c, k: Math.sin((i + 1) * 12.9898 + luckySeed * 7.233) }))
      .sort((a, b) => a.k - b.k)
      .map((e) => e.c);
  }, [catSort, favorites, luckySeed]);

  const sections = useMemo<CategorySection[]>(() => {
    if (catSort !== "universal") {
      return [{ id: "all", categories: sortedCategories }];
    }
    const used = new Set<string>();
    const grouped = DIVISIONS.map((d) => {
      const categories = d.categoryIds
        .map((id) => CATEGORIES.find((c) => c.id === id))
        .filter((c): c is FoodCategory => Boolean(c));
      categories.forEach((c) => used.add(c.id));
      return { id: d.id, label: d.label, arabic: d.arabic, categories };
    }).filter((s) => s.categories.length > 0);
    const rest = CATEGORIES.filter((c) => !used.has(c.id));
    if (rest.length > 0) grouped.push({ id: "more", label: "More", arabic: "", categories: rest });
    return grouped;
  }, [catSort, sortedCategories]);

  const activeSub = useMemo(() => {
    for (const cat of CATEGORIES) {
      const found = cat.subcategories.find((s) => s.id === activeSubId);
      if (found) return found;
    }
    return CATEGORIES[0]!.subcategories[0]!;
  }, [activeSubId]);

  const allItems = useMemo(() => {
    const list: FoodItem[] = [];
    for (const cat of CATEGORIES) {
      for (const sub of cat.subcategories) {
        list.push(...sub.items);
      }
    }
    return list;
  }, []);

  const dq = dishQuery.trim().toLowerCase();
  const searching = dq.length > 0;
  const visibleItems = searching
    ? allItems.filter((f) => f.name.toLowerCase().includes(dq))
    : activeSub.items;

  const heroImage = useMemo(() => {
    const last = lines[lines.length - 1];
    return (last && foodById.get(last.foodId)?.image) ?? activeSub.items[0]?.image;
  }, [lines, foodById, activeSub]);

  function changeCatSort(next: CategorySortKey) {
    setCatSort(next);
    if (next === "lucky") setLuckySeed((s) => s + 1);
  }

  function selectCategory(id: string) {
    const cat = CATEGORIES.find((c) => c.id === id)!;
    const nextOpen = openCategoryId === id ? "" : id;
    setOpenCategoryId(nextOpen);
    if (nextOpen) setActiveSubId(cat.subcategories[0]!.id);
  }


  return (
    <div className="fs-root">
      {/* Food photo (sits behind everything else, full-bleed on mobile) */}
      <div className="fs-food-hero">
        <div className="fs-food-glow" />
        {heroImage && <img className="fs-food-image" src={heroImage} alt="" key={heroImage} />}
      </div>

      {/* Top bar */}
      <header className="fs-topbar">
        <div className="fs-topbar-left">
          <button className="fs-back-btn" onClick={() => navigate("/")} aria-label="Back">
            <ChevronLeft className="fs-back-icon" strokeWidth={2.5} />
          </button>
          <h1 className="fs-title">Menu</h1>
        </div>
        <div className="fs-topbar-right">
          <button className="fs-icon-btn" aria-label="Favorites">
            <Heart className="fs-icon-svg" strokeWidth={1.75} />
          </button>
          {cartCount > 0 && (
            <button
              className="fs-icon-btn"
              aria-label="Cart"
              aria-expanded={isCartOpen}
              onClick={() => setIsCartOpen(!isCartOpen)}
            >
              <ShoppingCart className="fs-icon-svg" strokeWidth={1.75} />
              <span className="fs-icon-badge">{cartCount}</span>
              {cartTotal > 0 && <span className="fs-icon-amount">${cartTotal.toFixed(2)}</span>}
            </button>
          )}
          <button
            className="fs-icon-btn fs-profile-btn"
            aria-label="Profile"
            onClick={() => navigate("/")}
          >
            <User className="fs-icon-svg" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div className="fs-content">
        {/* Left panel: categories + expanding subcategories */}
        <div className="fs-left-panel">
          <label className="fs-search">
            <Search className="fs-search-icon" strokeWidth={2.2} />
            <input
              className="fs-search-input"
              type="search"
              value={dishQuery}
              onChange={(e) => setDishQuery(e.target.value)}
              placeholder="Search dishes"
              aria-label="Search dishes"
            />
          </label>
          <div className="fs-left-head">
            <div className="fs-section-heading">Categories</div>
            <label className="fs-filter">
              <span className="fs-filter-label">Filter</span>
              <select
                className="fs-filter-select"
                value={catSort}
                onChange={(e) => changeCatSort(e.target.value as CategorySortKey)}
                aria-label="Sort categories"
              >
                <option value="universal">Universal division</option>
                <option value="lucky">I&apos;m lucky today</option>
                <option value="popular">Most popular dish</option>
                <option value="favorite">Favorite first</option>
                <option value="alpha">Rank with alphabet</option>
              </select>
            </label>
          </div>
          <CategoryRail
            sections={sections}
            openCategoryId={openCategoryId}
            activeSubId={activeSubId}
            query={dishQuery}
            onSelectCategory={selectCategory}
            onSelectSub={setActiveSubId}
          />
        </div>

        {/* Middle: dishes of the selected subcategory */}
        <FoodGrid
          subName={activeSub.name}
          items={visibleItems}
          searching={searching}
          dishQuery={dishQuery}
          pending={pending}
          committed={committedByFood}
          favorites={favorites}
          openDropId={personaliseId}
          onToggleFavorite={toggleFavorite}
          onDishClick={(food) => addToCartDirect(food)}
          onAddPendingUnit={dishClick}
          onPersonalise={(food) => {
            // Selections are saved live; reopening pulls the saved units back for editing.
            if ((pending[food.id]?.length ?? 0) === 0) editFood(food);
            setPersonaliseId((cur) => (cur === food.id ? null : food.id));
          }}
          onCancelOrder={(food) => {
            cancelFood(food.id);
            setPersonaliseId(null);
          }}
          onCancelPersonalisation={(food) => {
            cancelPersonalisation(food.id);
            setPersonaliseId(null);
          }}
          onAcceptOrder={(food) => {
            passFood(food);
            setPersonaliseId(null);
          }}
          onRemoveUnit={(food, index) => {
            removeUnit(food.id, index);
            if ((pending[food.id]?.length ?? 0) <= 1) setPersonaliseId(null);
          }}

          onToggleRemoved={(food, index, ingredientId) =>
            toggleUnitRemoved(food.id, index, ingredientId)
          }
          onToggleAddOn={(food, index, addOnId) => toggleUnitAddOn(food.id, index, addOnId)}
        />
      </div>

    </div>
  );
}
