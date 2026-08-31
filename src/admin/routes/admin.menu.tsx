import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ImagePlus,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { PageHeader, Panel, Pill } from "../components/dashboard/shell";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

/* ----------------------------- API data types ---------------------------- */

type Division = {
  id: number;
  name: string;
  name_ar: string | null;
  image: string | null;
  sort_order: number;
  is_available: boolean;
};

type Category = {
  id: number;
  name: string;
  is_available: boolean;
  image: string | null;
  id_category: number | null;
  id_division: number;
};

type EligibleIngredient = {
  id: number;
  name: string;
  is_available: boolean;
  image: string | null;
  is_ingredient: boolean;
  is_supplementaire: boolean;
};

type AttachedIngredient = {
  id_ingredient: number;
  name: string;
  is_ingredient: boolean;
  is_supplementaire: boolean;
  is_removable: boolean;
  price_supplementaire: string | number | null;
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  is_available: boolean;
  image: string | null;
  id_category: number;
};

const FALLBACK_IMAGE = "https://placehold.co/400x300/A80D25/FFFFFF?text=Dish";

const money = (v: string | number) => Number(v).toFixed(2);

/* --------------------------------- Page ---------------------------------- */

export default function AdminMenu() {
  const { token } = useAuth();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterCategory, setFilterCategory] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; product: Product | null } | null>(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [d, c, p] = await Promise.all([
        api<{ divisions: Division[] }>("/api/catalog/divisions"),
        api<{ categories: Category[] }>("/api/catalog/categories"),
        api<{ products: Product[] }>("/api/catalog/products"),
      ]);
      setDivisions(d.divisions);
      setCategories(c.categories);
      setProducts(p.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? "\u2014";

  const visible = products.filter(
    (p) =>
      (filterCategory === "all" || p.id_category === filterCategory) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );

  const patchProduct = async (id: number, body: Partial<Product>) => {
    const before = products;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...body } : p)));
    try {
      await api(`/api/catalog/products/${id}`, { method: "PATCH", body, token });
    } catch (err) {
      setProducts(before);
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const setPrice = (p: Product, value: number) =>
    patchProduct(p.id, { price: Math.max(0, Math.round(value * 100) / 100) });

  const toggleStock = (p: Product) => patchProduct(p.id, { is_available: !p.is_available });

  const removeProduct = async (id: number) => {
    try {
      await api(`/api/catalog/products/${id}`, { method: "DELETE", token });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Kitchen setup"
        title="Menu & stock control"
        description="Pick a division, then a category, then attach that category's ingredients \u2014 dishes always reference the shared kitchen catalog."
        action={
          <button
            className="login-cta !w-auto px-5"
            onClick={() => setEditing({ mode: "create", product: null })}
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" /> New item
            </span>
          </button>
        }
      />

      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a dish or drink"
            className="login-field"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-[4px] border border-border bg-cream-1 p-1">
          <button
            onClick={() => setFilterCategory("all")}
            className={`rounded-[3px] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] transition-colors ${
              filterCategory === "all" ? "bg-brand text-cream-1" : "text-ink-muted hover:bg-cream-2 hover:text-ink"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCategory(c.id)}
              className={`rounded-[3px] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] transition-colors ${
                filterCategory === c.id ? "bg-brand text-cream-1" : "text-ink-muted hover:bg-cream-2 hover:text-ink"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Panel>
          <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the catalog\u2026
          </p>
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((item) => (
            <Panel key={item.id} className="overflow-hidden p-0">
              <div className="relative isolate min-h-[160px]">
                <img
                  src={item.image ?? FALLBACK_IMAGE}
                  alt={item.name}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brown/95 via-brown/70 to-brown/40" />

                <div className="relative z-10 flex h-full min-h-[160px] flex-col justify-between p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4 shrink-0 text-cream-1" />
                        <h3 className="truncate text-lg font-extrabold text-cream-1 drop-shadow">
                          {item.name}
                        </h3>
                      </div>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cream-2">
                        {categoryName(item.id_category)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Pill tone={item.is_available ? "success" : "brand"}>
                        {item.is_available ? "Available" : "Out of stock"}
                      </Pill>
                      <button
                        onClick={() => void removeProduct(item.id)}
                        aria-label={`Delete ${item.name}`}
                        className="rounded-[4px] border border-cream-3/40 bg-brown/60 p-2 text-cream-2 backdrop-blur-sm transition-colors hover:border-brand hover:text-cream-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditing({ mode: "edit", product: item })}
                        aria-label={`Modify ${item.name}`}
                        className="inline-flex items-center gap-1.5 rounded-[4px] border border-cream-3/40 bg-brown/60 px-2 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cream-2 backdrop-blur-sm transition-colors hover:border-brand hover:text-cream-1"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Modify
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cream-2">
                      Price
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void setPrice(item, Number(item.price) - 0.5)}
                        aria-label={`Decrease price of ${item.name}`}
                        className="rounded-[4px] border border-cream-3/50 bg-brown/60 p-1.5 text-cream-1 backdrop-blur-sm transition-colors hover:border-brand hover:text-cream-1"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <div className="flex items-center rounded-[4px] border border-cream-3/50 bg-brown/70 px-2 backdrop-blur-sm">
                        <span className="text-sm font-extrabold text-cream-2">$</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={money(item.price)}
                          onChange={(e) => void setPrice(item, Number(e.target.value))}
                          aria-label={`Price of ${item.name}`}
                          className="w-16 bg-transparent px-1 py-1.5 text-sm font-extrabold text-cream-1 outline-none"
                        />
                      </div>
                      <button
                        onClick={() => void setPrice(item, Number(item.price) + 0.5)}
                        aria-label={`Increase price of ${item.name}`}
                        className="rounded-[4px] border border-cream-3/50 bg-brown/60 p-1.5 text-cream-1 backdrop-blur-sm transition-colors hover:border-brand hover:text-cream-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => void toggleStock(item)}
                  aria-pressed={item.is_available}
                  className={`mt-4 w-full rounded-[6px] px-3 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cream-1 transition-colors ${
                    item.is_available ? "bg-success hover:brightness-95" : "bg-brand hover:brightness-95"
                  }`}
                >
                  {item.is_available ? "Available" : "Out of stock"}
                </button>
                <p className="mt-3 text-[11px] text-ink-muted">
                  Ingredients are managed from <b>Modify</b> \u2014 they reference the shared kitchen catalog, scoped to this dish's category.
                </p>
              </div>
            </Panel>
          ))}
          {visible.length === 0 ? (
            <Panel>
              <p className="text-sm text-ink-muted">No item matches this filter.</p>
            </Panel>
          ) : null}
        </div>
      )}

      {editing ? (
        <DishDialog
          mode={editing.mode}
          product={editing.product}
          divisions={divisions}
          categories={categories}
          token={token}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void loadAll();
          }}
        />
      ) : null}
    </>
  );
}

/* ------------------------------ Dish dialog ------------------------------ */

function DishDialog({
  mode,
  product,
  divisions,
  categories,
  token,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  product: Product | null;
  divisions: Division[];
  categories: Category[];
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initialCategory = product ? categories.find((c) => c.id === product.id_category) : undefined;

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPriceInput] = useState(product ? money(product.price) : "");
  const [image, setImage] = useState<string | null>(product?.image ?? null);
  // Step 1: Division first \u2014 nothing else resolves without it.
  const [divisionId, setDivisionId] = useState<number | "">(initialCategory?.id_division ?? "");
  // Step 2: Category, filtered down to the chosen division.
  const [categoryId, setCategoryId] = useState<number | "">(product?.id_category ?? "");
  const [eligible, setEligible] = useState<EligibleIngredient[]>([]);
  const [attached, setAttached] = useState<AttachedIngredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [quickName, setQuickName] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);

  const divisionCategories = useMemo(
    () => categories.filter((c) => c.id_division === divisionId),
    [categories, divisionId],
  );

  // Step 3: eligible ingredients come from CATEGORY_INGREDIENT only.
  useEffect(() => {
    if (!categoryId) {
      setEligible([]);
      return;
    }
    let cancelled = false;
    setLoadingIngredients(true);
    api<{ ingredients: EligibleIngredient[] }>(`/api/catalog/categories/${categoryId}/ingredients`)
      .then(({ ingredients }) => {
        if (!cancelled) setEligible(ingredients);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Could not load ingredients");
      })
      .finally(() => {
        if (!cancelled) setLoadingIngredients(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  // Load the dish's attached ingredients when editing.
  useEffect(() => {
    if (mode !== "edit" || !product) return;
    let cancelled = false;
    api<{ product: Product & { ingredients: AttachedIngredient[] } }>(
      `/api/catalog/products/${product.id}`,
    )
      .then(({ product: full }) => {
        if (!cancelled) setAttached(full.ingredients);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Could not load the dish");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eligibleIds = useMemo(() => new Set(eligible.map((e) => e.id)), [eligible]);
  // Category changed mid-edit: flag attachments no longer eligible (step 6).
  const ineligible = categoryId ? attached.filter((a) => !eligibleIds.has(a.id_ingredient)) : [];

  const pickDivision = (value: number | "") => {
    setDivisionId(value);
    setCategoryId("");
    setEligible([]);
  };

  const attach = (ing: EligibleIngredient) => {
    if (attached.some((a) => a.id_ingredient === ing.id)) return;
    setAttached((prev) => [
      ...prev,
      {
        id_ingredient: ing.id,
        name: ing.name,
        is_ingredient: ing.is_ingredient,
        is_supplementaire: false,
        is_removable: false,
        price_supplementaire: null,
      },
    ]);
  };

  const patchAttached = (idIngredient: number, fn: (a: AttachedIngredient) => AttachedIngredient) =>
    setAttached((prev) => prev.map((a) => (a.id_ingredient === idIngredient ? fn(a) : a)));

  const detach = (idIngredient: number) =>
    setAttached((prev) => prev.filter((a) => a.id_ingredient !== idIngredient));

  const refreshEligible = async () => {
    if (!categoryId) return;
    const { ingredients } = await api<{ ingredients: EligibleIngredient[] }>(
      `/api/catalog/categories/${categoryId}/ingredients`,
    );
    setEligible(ingredients);
  };

  // "Quick add to this category": ingredient must exist in the shared table
  // and be eligible for the category before it can land on the dish (step 5).
  const quickAdd = async () => {
    const trimmed = quickName.trim();
    if (!trimmed || !categoryId || quickBusy) return;
    setQuickBusy(true);
    setErr(null);
    try {
      let ingredientId: number;
      try {
        const { ingredient } = await api<{ ingredient: EligibleIngredient }>("/api/catalog/ingredients", {
          method: "POST",
          body: { name: trimmed },
          token,
        });
        ingredientId = ingredient.id;
      } catch (e) {
        // Already exists in the shared list \u2014 reuse it.
        const { ingredients } = await api<{ ingredients: EligibleIngredient[] }>("/api/catalog/ingredients");
        const existing = ingredients.find((i) => i.name.toLowerCase() === trimmed.toLowerCase());
        if (!existing) throw e;
        ingredientId = existing.id;
      }
      await api(`/api/catalog/categories/${categoryId}/ingredients`, {
        method: "POST",
        body: { id_ingredient: ingredientId, is_ingredient: true, is_supplementaire: true },
        token,
      });
      await refreshEligible();
      setQuickName("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Quick add failed");
    } finally {
      setQuickBusy(false);
    }
  };

  // Resolve an ineligible attachment by allowing it in the new category.
  const allowInCategory = async (a: AttachedIngredient) => {
    if (!categoryId) return;
    setErr(null);
    try {
      await api(`/api/catalog/categories/${categoryId}/ingredients`, {
        method: "POST",
        body: { id_ingredient: a.id_ingredient, is_ingredient: true, is_supplementaire: true },
        token,
      });
      await refreshEligible();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not add to the category");
    }
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  // Step 7: save is blocked until name + division + category + price resolve,
  // and every attached ingredient traces the category-scoped path.
  const canSave =
    Boolean(name.trim()) &&
    divisionId !== "" &&
    categoryId !== "" &&
    Number(price) > 0 &&
    ineligible.length === 0 &&
    !saving;

  const save = async () => {
    if (!canSave || !categoryId) return;
    setSaving(true);
    setErr(null);
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      image,
      id_category: categoryId,
      ingredients: attached.map((a) => ({
        id_ingredient: a.id_ingredient,
        is_ingredient: a.is_ingredient,
        is_supplementaire: a.is_supplementaire,
        is_removable: a.is_removable,
        price_supplementaire: a.is_supplementaire ? Number(a.price_supplementaire) || 0 : null,
      })),
    };
    try {
      if (mode === "create") {
        await api("/api/catalog/products", { method: "POST", body, token });
      } else if (product) {
        await api(`/api/catalog/products/${product.id}`, { method: "PATCH", body, token });
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brown/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Create a new dish" : `Modify ${product?.name ?? "dish"}`}
    >
      <div className="my-6 w-full max-w-4xl rounded-[10px] border border-border bg-cream-1 shadow-xl">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-ink">
            {mode === "create" ? "New menu item" : `Modify ${product?.name ?? "dish"}`}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-brand">
            <X className="h-4 w-4" />
          </button>
        </header>

        {err ? (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-[6px] border border-brand/40 bg-brand/10 px-3 py-2 text-sm font-semibold text-brand">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
          </div>
        ) : null}

        <div className="grid gap-5 p-5 md:grid-cols-[1.4fr_1fr]">
          {/* LEFT \u2014 dish fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                  1. Division
                </span>
                <select
                  value={divisionId}
                  onChange={(e) => pickDivision(e.target.value ? Number(e.target.value) : "")}
                  aria-label="Division"
                  className="login-field mt-1 !pl-3"
                >
                  <option value="">Pick a division\u2026</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.name_ar ? ` (${d.name_ar})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                  2. Category
                </span>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                  disabled={divisionId === ""}
                  aria-label="Category"
                  className="login-field mt-1 !pl-3 disabled:opacity-50"
                >
                  <option value="">
                    {divisionId === "" ? "Division first\u2026" : "Pick a category\u2026"}
                  </option>
                  {divisionCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id_category ? `\u2014 ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-3">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[6px] border border-border">
                <img src={image ?? FALLBACK_IMAGE} alt="" className="h-full w-full object-cover" />
                <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 bg-brown/60 text-[9px] font-extrabold uppercase tracking-[0.14em] text-cream-1 opacity-0 transition-opacity hover:opacity-100">
                  <ImagePlus className="h-4 w-4" />
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                </label>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dish name"
                  aria-label="Dish name"
                  className="login-field !pl-3"
                />
                <div className="flex items-center rounded-[4px] border border-border bg-cream-1 px-2">
                  <span className="text-sm font-extrabold text-ink-muted">$</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={price}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="0.00"
                    aria-label="Dish price"
                    className="w-24 bg-transparent px-1 py-2 text-sm font-extrabold text-ink outline-none"
                  />
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description (optional)"
                  aria-label="Description"
                  rows={2}
                  className="login-field !h-auto !pl-3"
                />
              </div>
            </div>

            {/* Attached ingredients */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                Attached ingredients \u2014 flags per dish, shared kitchen record
              </p>
              {attached.length === 0 ? (
                <p className="mt-2 text-[11px] text-ink-muted">
                  Nothing attached yet. Ingredients are optional, but must come from the category panel.
                </p>
              ) : null}
              <ul className="mt-2 grid gap-1.5">
                {attached.map((a) => {
                  const bad = categoryId !== "" && !eligibleIds.has(a.id_ingredient);
                  return (
                    <li
                      key={a.id_ingredient}
                      className={`flex flex-wrap items-center gap-2 rounded-[4px] border px-3 py-1.5 text-sm ${
                        bad ? "border-brand bg-brand/10" : "border-border bg-cream-2/50"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate font-semibold">{a.name}</span>
                      {bad ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-brand">
                            <AlertTriangle className="h-3 w-3" /> Not in this category
                          </span>
                          <button
                            onClick={() => void allowInCategory(a)}
                            className="rounded-[3px] bg-brand/15 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-brand hover:bg-brand/25"
                          >
                            Allow in category
                          </button>
                        </>
                      ) : (
                        <>
                          <FlagButton
                            on={a.is_ingredient}
                            label="Standard"
                            onClick={() =>
                              patchAttached(a.id_ingredient, (x) => ({ ...x, is_ingredient: !x.is_ingredient }))
                            }
                          />
                          <FlagButton
                            on={a.is_removable}
                            label="Removable"
                            onClick={() =>
                              patchAttached(a.id_ingredient, (x) => ({ ...x, is_removable: !x.is_removable }))
                            }
                          />
                          <FlagButton
                            on={a.is_supplementaire}
                            label="Add-on"
                            onClick={() =>
                              patchAttached(a.id_ingredient, (x) => ({
                                ...x,
                                is_supplementaire: !x.is_supplementaire,
                              }))
                            }
                          />
                          {a.is_supplementaire ? (
                            <div className="flex items-center rounded-[4px] border border-border bg-cream-1 px-2">
                              <span className="text-xs font-extrabold text-ink-muted">+$</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={a.price_supplementaire ?? ""}
                                onChange={(e) =>
                                  patchAttached(a.id_ingredient, (x) => ({
                                    ...x,
                                    price_supplementaire: e.target.value,
                                  }))
                                }
                                aria-label={`Add-on price for ${a.name}`}
                                className="w-14 bg-transparent px-1 py-1 text-xs font-extrabold text-ink outline-none"
                              />
                            </div>
                          ) : null}
                        </>
                      )}
                      <button
                        onClick={() => detach(a.id_ingredient)}
                        aria-label={`Remove ${a.name}`}
                        className="text-ink-muted hover:text-brand"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* RIGHT \u2014 category-scoped ingredient panel (step 3) */}
          <div className="rounded-[8px] border border-border bg-cream-2/50 p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
              3. Category ingredients
            </p>
            {categoryId === "" ? (
              <p className="mt-2 text-[11px] text-ink-muted">
                Pick a division and a category first \u2014 only that category's eligible ingredients can be attached.
              </p>
            ) : (
              <>
                <p className="mt-1 text-[11px] text-ink-muted">
                  Only ingredients marked eligible for this category are listed.
                </p>
                {loadingIngredients ? (
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-muted">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading\u2026
                  </p>
                ) : (
                  <ul className="mt-3 grid max-h-[340px] gap-1.5 overflow-y-auto pr-1">
                    {eligible.map((ing) => {
                      const already = attached.some((a) => a.id_ingredient === ing.id);
                      return (
                        <li
                          key={ing.id}
                          className="flex items-center gap-2 rounded-[4px] border border-border bg-cream-1 px-2.5 py-1.5 text-sm"
                        >
                          <span className="min-w-0 flex-1 truncate">{ing.name}</span>
                          <button
                            onClick={() => attach(ing)}
                            disabled={already}
                            aria-label={`Attach ${ing.name}`}
                            className="rounded-[3px] bg-brand/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-brand hover:bg-brand/20 disabled:opacity-40"
                          >
                            {already ? "Attached" : "Attach"}
                          </button>
                        </li>
                      );
                    })}
                    {eligible.length === 0 ? (
                      <li className="text-[11px] text-ink-muted">
                        No eligible ingredients yet \u2014 use quick add below.
                      </li>
                    ) : null}
                  </ul>
                )}
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
                    Quick add to this category
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && void quickAdd()}
                      placeholder="Ingredient name"
                      aria-label="Quick add ingredient to this category"
                      className="login-field !pl-3"
                    />
                    <button
                      onClick={() => void quickAdd()}
                      disabled={quickBusy || !quickName.trim()}
                      className="shrink-0 rounded-[4px] bg-brand px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cream-1 disabled:opacity-50"
                    >
                      {quickBusy ? "\u2026" : "Add"}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-ink-muted">
                    Writes the shared ingredient + its category eligibility \u2014 then attach it from the list.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">
          {ineligible.length > 0 ? (
            <span className="mr-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-brand">
              <AlertTriangle className="h-3.5 w-3.5" />
              {ineligible.length} attached ingredient{ineligible.length > 1 ? "s are" : " is"} not eligible in this category
            </span>
          ) : null}
          <button
            onClick={onClose}
            className="rounded-[4px] border border-border px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-secondary hover:border-brand hover:text-brand"
          >
            Cancel
          </button>
          <button
            onClick={() => void save()}
            disabled={!canSave}
            className="inline-flex items-center gap-2 rounded-[4px] bg-brand px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cream-1 hover:brightness-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {mode === "create" ? "Create item" : "Save changes"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function FlagButton({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-[3px] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] transition-colors ${
        on ? "bg-success/12 text-success hover:bg-success/20" : "bg-ink/8 text-ink-muted hover:bg-ink/15"
      }`}
    >
      {label}
    </button>
  );
}
