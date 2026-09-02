import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Carrot,
  Check,
  FolderTree,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Panel, Pill } from "../components/dashboard/shell";
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

type Ingredient = {
  id: number;
  name: string;
  is_available: boolean;
  image: string | null;
  category_ids: number[];
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

const FALLBACK_DISH = "https://placehold.co/400x300/A80D25/FFFFFF?text=Dish";
const FALLBACK_THUMB = "https://placehold.co/200x200/D9C7A7/4A2E19?text=%C2%B7";

const money = (v: string | number) => Number(v).toFixed(2);

const readAsDataUrl = (file: File | undefined, cb: (value: string) => void) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => cb(String(reader.result));
  reader.readAsDataURL(file);
};

const iconBtn =
  "rounded-lg border border-border bg-cream-1 p-2 text-ink-muted transition-colors hover:border-brand hover:text-brand";

/* --------------------------------- Page ---------------------------------- */

type Tab = "ingredients" | "categories" | "products";

const TABS: { key: Tab; label: string; icon: typeof Carrot }[] = [
  { key: "ingredients", label: "Ingredients", icon: Carrot },
  { key: "categories", label: "Categories", icon: FolderTree },
  { key: "products", label: "Products", icon: UtensilsCrossed },
];

export default function AdminMenu() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("ingredients");
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [d, c, i, p] = await Promise.all([
        api<{ divisions: Division[] }>("/api/catalog/divisions"),
        api<{ categories: Category[] }>("/api/catalog/categories"),
        api<{ ingredients: Ingredient[] }>("/api/catalog/ingredients"),
        api<{ products: Product[] }>("/api/catalog/products"),
      ]);
      setDivisions(d.divisions);
      setCategories(c.categories);
      setIngredients(
        i.ingredients.map((x) => ({ ...x, category_ids: (x.category_ids ?? []).map(Number) })),
      );
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

  const refresh = useCallback(() => {
    setError(null);
    void loadAll();
  }, [loadAll]);

  const counts: Record<Tab, number> = {
    ingredients: ingredients.length,
    categories: categories.length,
    products: products.length,
  };

  return (
    <>
      {/* One-line tri-tab switcher, at the very top */}
      <div className="login-fade mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-cream-1 p-2 shadow-sm">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-pressed={active}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3.5 transition-all sm:flex-row sm:gap-2.5 ${
                active
                  ? "bg-gradient-to-br from-brand to-[#6f0918] text-cream-1 shadow-md"
                  : "text-ink-secondary hover:bg-cream-2 hover:text-ink"
              }`}
            >
              <t.icon className="h-5 w-5" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.16em]">
                {t.label}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  active ? "bg-cream-1/20 text-cream-1" : "bg-cream-3 text-ink-muted"
                }`}
              >
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error" className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {loading ? (
        <Panel>
          <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the catalog...
          </p>
        </Panel>
      ) : tab === "ingredients" ? (
        <IngredientsTab
          ingredients={ingredients}
          categories={categories}
          token={token}
          refresh={refresh}
          onError={setError}
        />
      ) : tab === "categories" ? (
        <CategoriesTab
          categories={categories}
          divisions={divisions}
          ingredients={ingredients}
          token={token}
          refresh={refresh}
          onError={setError}
        />
      ) : (
        <ProductsTab
          products={products}
          categories={categories}
          divisions={divisions}
          token={token}
          refresh={refresh}
          onError={setError}
        />
      )}
    </>
  );
}

/* ------------------------------ Ingredients ------------------------------ */

function IngredientsTab({
  ingredients,
  categories,
  token,
  refresh,
  onError,
}: {
  ingredients: Ingredient[];
  categories: Category[];
  token: string | null;
  refresh: () => void;
  onError: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; ingredient: Ingredient | null } | null>(null);

  const visible = ingredients.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));

  const fail = (e: unknown, fallback: string) =>
    onError(e instanceof Error ? e.message : fallback);

  const remove = async (id: number) => {
    try {
      await api(`/api/catalog/ingredients/${id}`, { method: "DELETE", token });
      refresh();
    } catch (e) {
      fail(e, "Delete failed");
    }
  };

  const toggle = async (i: Ingredient) => {
    try {
      await api(`/api/catalog/ingredients/${i.id}`, {
        method: "PATCH",
        body: { is_available: !i.is_available },
        token,
      });
      refresh();
    } catch (e) {
      fail(e, "Update failed");
    }
  };

  const associate = async (ingredientId: number, categoryId: number) => {
    try {
      await api(`/api/catalog/categories/${categoryId}/ingredients`, {
        method: "POST",
        body: { id_ingredient: ingredientId, is_ingredient: true, is_supplementaire: true },
        token,
      });
      refresh();
    } catch (e) {
      fail(e, "Could not associate the category");
    }
  };

  const dissociate = async (ingredientId: number, categoryId: number) => {
    try {
      await api(`/api/catalog/categories/${categoryId}/ingredients/${ingredientId}`, {
        method: "DELETE",
        token,
      });
      refresh();
    } catch (e) {
      fail(e, "Could not dissociate the category");
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search an ingredient"
            className="login-field"
          />
        </div>
        <button
          className="login-cta !w-auto shrink-0 px-5"
          onClick={() => setEditing({ mode: "create", ingredient: null })}
        >
          <span className="inline-flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" /> New ingredient
          </span>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((ing) => {
          const linked = categories.filter((c) => ing.category_ids.includes(Number(c.id)));
          const unlinked = categories.filter((c) => !ing.category_ids.includes(Number(c.id)));
          return (
            <div
              key={ing.id}
              className="rounded-2xl border border-border bg-cream-1 p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <img
                  src={ing.image ?? FALLBACK_THUMB}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-extrabold text-ink">{ing.name}</h3>
                  <button onClick={() => void toggle(ing)} className="mt-1" aria-pressed={ing.is_available}>
                    <Pill tone={ing.is_available ? "success" : "brand"}>
                      {ing.is_available ? "Available" : "Unavailable"}
                    </Pill>
                  </button>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => setEditing({ mode: "edit", ingredient: ing })}
                    aria-label={`Modify ${ing.name}`}
                    className={iconBtn}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => void remove(ing.id)}
                    aria-label={`Delete ${ing.name}`}
                    className={iconBtn}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 border-t border-dashed border-border pt-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                  Categories
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {linked.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-cream-2 py-1 pl-2.5 pr-1.5 text-[11px] font-bold text-ink-secondary"
                    >
                      {c.name}
                      <button
                        onClick={() => void dissociate(ing.id, Number(c.id))}
                        aria-label={`Dissociate ${ing.name} from ${c.name}`}
                        className="rounded-full p-0.5 text-ink-muted hover:bg-brand/10 hover:text-brand"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {linked.length === 0 ? (
                    <span className="text-[11px] text-ink-muted">Not in any category yet.</span>
                  ) : null}
                  {unlinked.length > 0 ? (
                    <select
                      value=""
                      onChange={(e) => e.target.value && void associate(ing.id, Number(e.target.value))}
                      aria-label={`Associate ${ing.name} to a category`}
                      className="cursor-pointer rounded-full border border-dashed border-brand/60 bg-transparent px-2 py-1 text-[11px] font-bold text-brand outline-none"
                    >
                      <option value="">+ Associate...</option>
                      {unlinked.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        {visible.length === 0 ? (
          <Panel>
            <p className="text-sm text-ink-muted">No ingredient matches this search.</p>
          </Panel>
        ) : null}
      </div>

      {editing ? (
        <IngredientDialog
          mode={editing.mode}
          ingredient={editing.ingredient}
          token={token}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      ) : null}
    </>
  );
}

function IngredientDialog({
  mode,
  ingredient,
  token,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  ingredient: Ingredient | null;
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(ingredient?.name ?? "");
  const [image, setImage] = useState<string | null>(ingredient?.image ?? null);
  const [available, setAvailable] = useState(ingredient?.is_available ?? true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSave = Boolean(name.trim()) && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setErr(null);
    const body = { name: name.trim(), image, is_available: available };
    try {
      if (mode === "create") {
        await api("/api/catalog/ingredients", { method: "POST", body, token });
      } else if (ingredient) {
        await api(`/api/catalog/ingredients/${ingredient.id}`, { method: "PATCH", body, token });
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  };

  return (
    <DialogShell
      label={mode === "create" ? "New ingredient" : `Modify ${ingredient?.name ?? "ingredient"}`}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      {err ? <DialogError message={err} /> : null}
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-4">
          <ImageUpload image={image} fallback={FALLBACK_THUMB} rounded onPick={setImage} />
          <div className="min-w-0 flex-1 space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingredient name"
              aria-label="Ingredient name"
              className="login-field !pl-3"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink-secondary">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="h-4 w-4 accent-[#A80D25]"
              />
              Available in the kitchen
            </label>
          </div>
        </div>
      </div>
      <DialogFooter
        saving={saving}
        canSave={canSave}
        saveLabel={mode === "create" ? "Create ingredient" : "Save changes"}
        onCancel={onClose}
        onSave={() => void save()}
      />
    </DialogShell>
  );
}

/* ------------------------------- Categories ------------------------------ */

function CategoriesTab({
  categories,
  divisions,
  ingredients,
  token,
  refresh,
  onError,
}: {
  categories: Category[];
  divisions: Division[];
  ingredients: Ingredient[];
  token: string | null;
  refresh: () => void;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; category: Category | null } | null>(null);

  const divisionName = (id: number) =>
    divisions.find((d) => Number(d.id) === Number(id))?.name ?? "No division";
  const parentName = (id: number | null) =>
    id ? categories.find((c) => Number(c.id) === Number(id))?.name ?? null : null;

  const fail = (e: unknown, fallback: string) =>
    onError(e instanceof Error ? e.message : fallback);

  const remove = async (id: number) => {
    try {
      await api(`/api/catalog/categories/${id}`, { method: "DELETE", token });
      refresh();
    } catch (e) {
      fail(e, "Delete failed");
    }
  };

  const toggle = async (c: Category) => {
    try {
      await api(`/api/catalog/categories/${c.id}`, {
        method: "PATCH",
        body: { is_available: !c.is_available },
        token,
      });
      refresh();
    } catch (e) {
      fail(e, "Update failed");
    }
  };

  const attachIngredient = async (categoryId: number, ingredientId: number) => {
    try {
      await api(`/api/catalog/categories/${categoryId}/ingredients`, {
        method: "POST",
        body: { id_ingredient: ingredientId, is_ingredient: true, is_supplementaire: true },
        token,
      });
      refresh();
    } catch (e) {
      fail(e, "Could not add the ingredient");
    }
  };

  const detachIngredient = async (categoryId: number, ingredientId: number) => {
    try {
      await api(`/api/catalog/categories/${categoryId}/ingredients/${ingredientId}`, {
        method: "DELETE",
        token,
      });
      refresh();
    } catch (e) {
      fail(e, "Could not remove the ingredient");
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Every category lives in a division and carries its own eligible ingredients.
        </p>
        <button
          className="login-cta !w-auto shrink-0 px-5"
          onClick={() => setEditing({ mode: "create", category: null })}
        >
          <span className="inline-flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" /> New category
          </span>
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {categories.map((c) => {
          const inCategory = ingredients.filter((i) => i.category_ids.includes(Number(c.id)));
          const outOfCategory = ingredients.filter((i) => !i.category_ids.includes(Number(c.id)));
          const parent = parentName(c.id_category);
          return (
            <div
              key={c.id}
              className="rounded-2xl border border-border bg-cream-1 p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <img
                  src={c.image ?? FALLBACK_THUMB}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-extrabold text-ink">{c.name}</h3>
                  <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                    {divisionName(c.id_division)}
                    {parent ? ` / ${parent}` : ""}
                  </p>
                  <button onClick={() => void toggle(c)} className="mt-1" aria-pressed={c.is_available}>
                    <Pill tone={c.is_available ? "success" : "brand"}>
                      {c.is_available ? "Available" : "Hidden"}
                    </Pill>
                  </button>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => setEditing({ mode: "edit", category: c })}
                    aria-label={`Modify ${c.name}`}
                    className={iconBtn}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => void remove(Number(c.id))}
                    aria-label={`Delete ${c.name}`}
                    className={iconBtn}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 border-t border-dashed border-border pt-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                  Eligible ingredients
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {inCategory.map((i) => (
                    <span
                      key={i.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-cream-2 py-1 pl-2.5 pr-1.5 text-[11px] font-bold text-ink-secondary"
                    >
                      {i.name}
                      <button
                        onClick={() => void detachIngredient(Number(c.id), i.id)}
                        aria-label={`Remove ${i.name} from ${c.name}`}
                        className="rounded-full p-0.5 text-ink-muted hover:bg-brand/10 hover:text-brand"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {inCategory.length === 0 ? (
                    <span className="text-[11px] text-ink-muted">None yet.</span>
                  ) : null}
                  {outOfCategory.length > 0 ? (
                    <select
                      value=""
                      onChange={(e) =>
                        e.target.value && void attachIngredient(Number(c.id), Number(e.target.value))
                      }
                      aria-label={`Add an ingredient to ${c.name}`}
                      className="cursor-pointer rounded-full border border-dashed border-brand/60 bg-transparent px-2 py-1 text-[11px] font-bold text-brand outline-none"
                    >
                      <option value="">+ Add ingredient...</option>
                      {outOfCategory.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        {categories.length === 0 ? (
          <Panel>
            <p className="text-sm text-ink-muted">No category yet. Create the first one.</p>
          </Panel>
        ) : null}
      </div>

      {editing ? (
        <CategoryDialog
          mode={editing.mode}
          category={editing.category}
          categories={categories}
          divisions={divisions}
          token={token}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      ) : null}
    </>
  );
}

function CategoryDialog({
  mode,
  category,
  categories,
  divisions,
  token,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  category: Category | null;
  categories: Category[];
  divisions: Division[];
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [image, setImage] = useState<string | null>(category?.image ?? null);
  const [divisionId, setDivisionId] = useState<number | "">(category?.id_division ?? "");
  const [parentId, setParentId] = useState<number | "">(category?.id_category ?? "");
  const [available, setAvailable] = useState(category?.is_available ?? true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parentOptions = categories.filter(
    (c) =>
      Number(c.id_division) === Number(divisionId) &&
      Number(c.id) !== Number(category?.id ?? -1),
  );

  const canSave = Boolean(name.trim()) && divisionId !== "" && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setErr(null);
    const body = {
      name: name.trim(),
      image,
      is_available: available,
      id_division: Number(divisionId),
      id_category: parentId === "" ? null : Number(parentId),
    };
    try {
      if (mode === "create") {
        await api("/api/catalog/categories", { method: "POST", body, token });
      } else if (category) {
        await api(`/api/catalog/categories/${category.id}`, { method: "PATCH", body, token });
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  };

  return (
    <DialogShell
      label={mode === "create" ? "New category" : `Modify ${category?.name ?? "category"}`}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      {err ? <DialogError message={err} /> : null}
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-4">
          <ImageUpload image={image} fallback={FALLBACK_THUMB} onPick={setImage} />
          <div className="min-w-0 flex-1 space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              aria-label="Category name"
              className="login-field !pl-3"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink-secondary">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="h-4 w-4 accent-[#A80D25]"
              />
              Visible on the menu
            </label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
              Division
            </span>
            <select
              value={divisionId}
              onChange={(e) => {
                setDivisionId(e.target.value ? Number(e.target.value) : "");
                setParentId("");
              }}
              aria-label="Division"
              className="login-field mt-1 !pl-3"
            >
              <option value="">Pick a division...</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
              Parent (optional)
            </span>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : "")}
              disabled={divisionId === ""}
              aria-label="Parent category"
              className="login-field mt-1 !pl-3 disabled:opacity-50"
            >
              <option value="">No parent</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <DialogFooter
        saving={saving}
        canSave={canSave}
        saveLabel={mode === "create" ? "Create category" : "Save changes"}
        onCancel={onClose}
        onSave={() => void save()}
      />
    </DialogShell>
  );
}

/* -------------------------------- Products ------------------------------- */

function ProductsTab({
  products,
  categories,
  divisions,
  token,
  refresh,
  onError,
}: {
  products: Product[];
  categories: Category[];
  divisions: Division[];
  token: string | null;
  refresh: () => void;
  onError: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<number | "all">("all");
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; product: Product | null } | null>(null);

  const categoryName = (id: number) =>
    categories.find((c) => Number(c.id) === Number(id))?.name ?? "No category";

  const visible = products.filter(
    (p) =>
      (filterCategory === "all" || Number(p.id_category) === Number(filterCategory)) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );

  const fail = (e: unknown, fallback: string) =>
    onError(e instanceof Error ? e.message : fallback);

  const toggleStock = async (p: Product) => {
    try {
      await api(`/api/catalog/products/${p.id}`, {
        method: "PATCH",
        body: { is_available: !p.is_available },
        token,
      });
      refresh();
    } catch (e) {
      fail(e, "Update failed");
    }
  };

  const removeProduct = async (id: number) => {
    try {
      await api(`/api/catalog/products/${id}`, { method: "DELETE", token });
      refresh();
    } catch (e) {
      fail(e, "Delete failed");
    }
  };

  return (
    <>
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
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value === "all" ? "all" : Number(e.target.value))}
          aria-label="Filter by category"
          className="login-field !w-auto !pl-3"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          className="login-cta !w-auto shrink-0 px-5"
          onClick={() => setEditing({ mode: "create", product: null })}
        >
          <span className="inline-flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" /> New product
          </span>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((item) => (
          <div
            key={item.id}
            className="group overflow-hidden rounded-2xl border border-border bg-cream-1 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="relative h-36">
              <img
                src={item.image ?? FALLBACK_DISH}
                alt={item.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute left-2.5 top-2.5 rounded-full bg-brown/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cream-1 backdrop-blur-sm">
                {categoryName(item.id_category)}
              </span>
              <span className="absolute right-2.5 top-2.5">
                <Pill tone={item.is_available ? "success" : "brand"}>
                  {item.is_available ? "Available" : "Out"}
                </Pill>
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-base font-extrabold text-ink">{item.name}</h3>
                <span className="shrink-0 text-base font-extrabold text-brand">
                  ${money(item.price)}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <button
                  onClick={() => void toggleStock(item)}
                  aria-pressed={item.is_available}
                  className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cream-1 transition-colors ${
                    item.is_available ? "bg-success hover:brightness-95" : "bg-brand hover:brightness-95"
                  }`}
                >
                  {item.is_available ? "In stock" : "Out of stock"}
                </button>
                <button
                  onClick={() => setEditing({ mode: "edit", product: item })}
                  aria-label={`Modify ${item.name}`}
                  className={iconBtn}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => void removeProduct(item.id)}
                  aria-label={`Delete ${item.name}`}
                  className={iconBtn}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 ? (
          <Panel>
            <p className="text-sm text-ink-muted">No item matches this filter.</p>
          </Panel>
        ) : null}
      </div>

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
            refresh();
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
  const initialCategory = product
    ? categories.find((c) => Number(c.id) === Number(product.id_category))
    : undefined;

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPriceInput] = useState(product ? money(product.price) : "");
  const [image, setImage] = useState<string | null>(product?.image ?? null);
  const [divisionId, setDivisionId] = useState<number | "">(initialCategory?.id_division ?? "");
  const [categoryId, setCategoryId] = useState<number | "">(
    product ? Number(product.id_category) : "",
  );
  const [eligible, setEligible] = useState<EligibleIngredient[]>([]);
  const [attached, setAttached] = useState<AttachedIngredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [quickName, setQuickName] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);

  const divisionCategories = useMemo(
    () => categories.filter((c) => Number(c.id_division) === Number(divisionId)),
    [categories, divisionId],
  );

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

  const eligibleIds = useMemo(() => new Set(eligible.map((e) => Number(e.id))), [eligible]);
  const ineligible = categoryId
    ? attached.filter((a) => !eligibleIds.has(Number(a.id_ingredient)))
    : [];

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
    <DialogShell
      label={mode === "create" ? "New product" : `Modify ${product?.name ?? "dish"}`}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      {err ? <DialogError message={err} /> : null}

      <div className="grid gap-5 p-5 md:grid-cols-[1.4fr_1fr]">
        {/* LEFT: dish fields */}
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
                <option value="">Pick a division...</option>
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
                  {divisionId === "" ? "Division first..." : "Pick a category..."}
                </option>
                {divisionCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id_category ? `- ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex gap-3">
            <ImageUpload image={image} fallback={FALLBACK_DISH} large onPick={setImage} />
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
              Attached ingredients
            </p>
            {attached.length === 0 ? (
              <p className="mt-2 text-[11px] text-ink-muted">
                Nothing attached yet. Ingredients come from the category panel on the right.
              </p>
            ) : null}
            <ul className="mt-2 grid gap-1.5">
              {attached.map((a) => {
                const bad = categoryId !== "" && !eligibleIds.has(Number(a.id_ingredient));
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

        {/* RIGHT: category-scoped ingredient panel */}
        <div className="rounded-[8px] border border-border bg-cream-2/50 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
            3. Category ingredients
          </p>
          {categoryId === "" ? (
            <p className="mt-2 text-[11px] text-ink-muted">
              Pick a division and a category first. Only that category's eligible ingredients can be attached.
            </p>
          ) : (
            <>
              <p className="mt-1 text-[11px] text-ink-muted">
                Only ingredients marked eligible for this category are listed.
              </p>
              {loadingIngredients ? (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
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
                      No eligible ingredients yet. Use quick add below.
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
                    {quickBusy ? "..." : "Add"}
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-ink-muted">
                  Creates the shared ingredient + its category eligibility, then attach it from the list.
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
    </DialogShell>
  );
}

/* ---------------------------- Shared UI pieces ---------------------------- */

function DialogShell({
  label,
  onClose,
  maxWidth,
  children,
}: {
  label: string;
  onClose: () => void;
  maxWidth: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brown/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className={`my-6 w-full ${maxWidth} rounded-2xl border border-border bg-cream-1 shadow-xl`}>
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-ink">{label}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-brand">
            <X className="h-4 w-4" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function DialogError({ message }: { message: string }) {
  return (
    <div className="mx-5 mt-4 flex items-center gap-2 rounded-[6px] border border-brand/40 bg-brand/10 px-3 py-2 text-sm font-semibold text-brand">
      <AlertTriangle className="h-4 w-4 shrink-0" /> {message}
    </div>
  );
}

function DialogFooter({
  saving,
  canSave,
  saveLabel,
  onCancel,
  onSave,
}: {
  saving: boolean;
  canSave: boolean;
  saveLabel: string;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
      <button
        onClick={onCancel}
        className="rounded-[4px] border border-border px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-secondary hover:border-brand hover:text-brand"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={!canSave}
        className="inline-flex items-center gap-2 rounded-[4px] bg-brand px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cream-1 hover:brightness-95 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        {saveLabel}
      </button>
    </footer>
  );
}

function ImageUpload({
  image,
  fallback,
  rounded = false,
  large = false,
  onPick,
}: {
  image: string | null;
  fallback: string;
  rounded?: boolean;
  large?: boolean;
  onPick: (value: string) => void;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-border ${
        rounded ? "rounded-full" : "rounded-[6px]"
      } ${large ? "h-28 w-28" : "h-20 w-20"}`}
    >
      <img src={image ?? fallback} alt="" className="h-full w-full object-cover" />
      <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 bg-brown/60 text-[9px] font-extrabold uppercase tracking-[0.14em] text-cream-1 opacity-0 transition-opacity hover:opacity-100">
        <ImagePlus className="h-4 w-4" />
        Picture
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => readAsDataUrl(e.target.files?.[0], onPick)}
        />
      </label>
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
