import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Carrot,
  Check,
  ChevronDown,
  FolderTree,
  ImagePlus,
  Layers,
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

type CategoryLink = {
  id_category: number;
  is_ingredient: boolean;
  is_supplementaire: boolean;
};

type Ingredient = {
  id: number;
  name: string;
  is_available: boolean;
  image: string | null;
  category_ids: number[];
  category_links: CategoryLink[];
};

/** How an ingredient behaves inside a category: part of the dish, a paid extra, or both. */
type LinkRole = "principal" | "addon" | "both";

const roleOf = (l: { is_ingredient: boolean; is_supplementaire: boolean }): LinkRole =>
  l.is_ingredient && l.is_supplementaire ? "both" : l.is_supplementaire ? "addon" : "principal";

const roleToFlags = (role: LinkRole) => ({
  is_ingredient: role !== "addon",
  is_supplementaire: role !== "principal",
});

const ROLE_LABEL: Record<LinkRole, string> = {
  principal: "Principal",
  addon: "Add-on",
  both: "Principal + Add-on",
};

const ROLE_OPTIONS: { key: LinkRole; label: string }[] = [
  { key: "principal", label: "Principal" },
  { key: "addon", label: "Add-on" },
  { key: "both", label: "Both" },
];

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
  image?: string | null;
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
const FALLBACK_CAT = "https://placehold.co/300x200/4A2E19/D9C7A7?text=Category";

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
        i.ingredients.map((x) => ({
          ...x,
          category_ids: (x.category_ids ?? []).map(Number),
          category_links: (x.category_links ?? []).map((l) => ({
            ...l,
            id_category: Number(l.id_category),
          })),
        })),
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
      {/* Tab switcher */}
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((ing) => {
          const linked = ing.category_links.flatMap((link) => {
            const cat = categories.find((c) => Number(c.id) === link.id_category);
            return cat ? [{ link, cat }] : [];
          });
          return (
            <div
              key={ing.id}
              className={`relative overflow-hidden rounded-2xl border bg-cream-1 shadow-sm transition-all hover:shadow-lg ${
                ing.is_available ? "border-border" : "border-brand/30 bg-brand/[0.02]"
              }`}
            >
              {/* ── Top section: image + info ── */}
              <div className="flex items-center gap-4 p-4 pb-3">
                <div className="relative shrink-0">
                  <img
                    src={ing.image ?? FALLBACK_THUMB}
                    alt=""
                    className={`h-16 w-16 rounded-xl border-2 object-cover transition-all ${
                      ing.is_available ? "border-success/40" : "border-brand/40 grayscale-[0.5] opacity-70"
                    }`}
                  />
                  <span
                    className={`absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-cream-1 ${
                      ing.is_available ? "bg-success" : "bg-brand"
                    }`}
                    title={ing.is_available ? "In stock" : "Out of stock"}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[15px] font-extrabold tracking-tight text-ink">{ing.name}</h3>
                  <div className="mt-2">
                    <ToggleSwitch
                      on={ing.is_available}
                      onChange={() => void toggle(ing)}
                      labelOn="Available"
                      labelOff="Not available"
                    />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
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

              {/* ── Bottom section: categories ── */}
              <div className="border-t border-border/60 bg-cream-2/50 px-4 py-3">
                <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-ink-muted">
                  Linked categories
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {linked.map(({ link, cat }) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-cream-1 py-1 pl-2 pr-1.5 text-[10px] font-bold text-ink-secondary shadow-sm"
                    >
                      {cat.image ? (
                        <img src={cat.image} alt="" className="h-4 w-4 rounded-full object-cover" />
                      ) : null}
                      {cat.name}
                      <RoleBadge role={roleOf(link)} />
                    </span>
                  ))}
                  {linked.length === 0 ? (
                    <span className="text-[10px] italic text-ink-muted">
                      No category linked yet
                    </span>
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

function IngredientDialog({
  mode,
  ingredient,
  categories,
  token,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  ingredient: Ingredient | null;
  categories: Category[];
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(ingredient?.name ?? "");
  const [image, setImage] = useState<string | null>(ingredient?.image ?? null);
  const [available, setAvailable] = useState(ingredient?.is_available ?? true);
  // Category id -> role. Seeded from the existing links when editing.
  const initialLinks = useMemo<Record<number, LinkRole>>(
    () =>
      Object.fromEntries(
        (ingredient?.category_links ?? []).map((l) => [l.id_category, roleOf(l)]),
      ),
    [ingredient],
  );
  const [links, setLinks] = useState<Record<number, LinkRole>>(initialLinks);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSave = Boolean(name.trim()) && !saving;

  const isLinked = (id: number) => id in links;

  const toggleCategory = (id: number) => {
    setLinks((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = "principal";
      return next;
    });
  };

  const setRole = (id: number, role: LinkRole) => setLinks((prev) => ({ ...prev, [id]: role }));

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setErr(null);
    const body = { name: name.trim(), image, is_available: available };
    try {
      let ingredientId: number;
      if (mode === "create") {
        const res = await api<{ ingredient: { id: number } }>("/api/catalog/ingredients", {
          method: "POST",
          body,
          token,
        });
        ingredientId = res.ingredient.id;
      } else if (ingredient) {
        await api(`/api/catalog/ingredients/${ingredient.id}`, { method: "PATCH", body, token });
        ingredientId = ingredient.id;
      } else {
        setSaving(false);
        return;
      }

      // Sync category links: upsert new/changed roles, delete the removed ones.
      const upserts = Object.entries(links)
        .map(([catId, role]) => [Number(catId), role] as const)
        .filter(([catId, role]) => initialLinks[catId] !== role)
        .map(([catId, role]) =>
          api(`/api/catalog/categories/${catId}/ingredients`, {
            method: "POST",
            body: { id_ingredient: ingredientId, ...roleToFlags(role) },
            token,
          }),
        );
      const removals = Object.keys(initialLinks)
        .map(Number)
        .filter((catId) => !(catId in links))
        .map((catId) =>
          api(`/api/catalog/categories/${catId}/ingredients/${ingredientId}`, {
            method: "DELETE",
            token,
          }),
        );
      await Promise.all([...upserts, ...removals]);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  };

  // Group categories: top-level (no parent) and sub-categories
  const topLevel = categories.filter((c) => !c.id_category);
  const subOf = (parentId: number) => categories.filter((c) => Number(c.id_category) === parentId);

  return (
    <DialogShell
      label={mode === "create" ? "New ingredient" : `Modify ${ingredient?.name ?? "ingredient"}`}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {err ? <DialogError message={err} /> : null}
      <div className="space-y-5 p-5">
        {/* Name + image */}
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
            <ToggleSwitch
              on={available}
              onChange={() => setAvailable((v) => !v)}
              labelOn="Available in the kitchen"
              labelOff="Not available"
            />
          </div>
        </div>

        {/* Category association */}
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
            {mode === "create" ? "Associate to categories (optional)" : "Categories"}
          </p>
          <p className="mb-2 mt-1 text-[11px] text-ink-muted">
            Pick the categories this ingredient belongs to, then use the switch to say whether it is a{" "}
            <strong className="text-success">principal</strong> ingredient or an{" "}
            <strong className="text-brand">add-on</strong> for that category. Tick{" "}
            <strong>Both</strong> when it can be either.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {topLevel.map((cat) => {
              const subs = subOf(cat.id);
              const selected = isLinked(cat.id);
              return (
                <div key={cat.id}>
                  {/* Parent category card */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`group relative w-full overflow-hidden rounded-xl border-2 transition-all ${
                      selected
                        ? "border-brand shadow-md"
                        : "border-border hover:border-brand/40"
                    }`}
                  >
                    <img
                      src={cat.image ?? FALLBACK_CAT}
                      alt={cat.name}
                      className="h-16 w-full object-cover"
                    />
                    <div
                      className={`absolute inset-0 flex items-end p-1.5 ${
                        selected ? "bg-brand/50" : "bg-brown/40 group-hover:bg-brown/30"
                      }`}
                    >
                      {selected && (
                        <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-cream-1" />
                      )}
                      <span className="w-full truncate text-center text-[10px] font-extrabold uppercase tracking-[0.1em] text-cream-1">
                        {cat.name}
                      </span>
                    </div>
                  </button>
                  {selected && (
                    <RoleControl role={links[cat.id]} onChange={(r) => setRole(cat.id, r)} />
                  )}
                  {/* Sub-categories */}
                  {subs.length > 0 && (
                    <div className="mt-1 space-y-1 pl-2">
                      {subs.map((sub) => {
                        const subSelected = isLinked(sub.id);
                        return (
                          <div key={sub.id}>
                            <button
                              type="button"
                              onClick={() => toggleCategory(sub.id)}
                              className={`flex w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold transition-all ${
                                subSelected
                                  ? "border-brand bg-brand/10 text-brand"
                                  : "border-border bg-cream-2 text-ink-secondary hover:border-brand/40"
                              }`}
                            >
                              {subSelected && <Check className="h-3 w-3 shrink-0" />}
                              <span className="truncate">{sub.name}</span>
                            </button>
                            {subSelected && (
                              <RoleControl role={links[sub.id]} onChange={(r) => setRole(sub.id, r)} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {categories.length === 0 && (
            <p className="text-[11px] text-ink-muted">No categories yet. Create one first.</p>
          )}
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
  const [selected, setSelected] = useState<number | null>(null);
  // Which parent card currently shows its sub-category dropdown.
  const [openSubsFor, setOpenSubsFor] = useState<number | null>(null);

  // Close the dropdown when clicking anywhere else on the page.
  useEffect(() => {
    if (openSubsFor === null) return;
    const close = () => setOpenSubsFor(null);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [openSubsFor]);

  const divisionName = (id: number) =>
    divisions.find((d) => Number(d.id) === Number(id))?.name ?? "No division";
  const parentName = (id: number | null) =>
    id ? categories.find((c) => Number(c.id) === Number(id))?.name ?? null : null;

  const fail = (e: unknown, fallback: string) =>
    onError(e instanceof Error ? e.message : fallback);

  const remove = async (id: number) => {
    try {
      await api(`/api/catalog/categories/${id}`, { method: "DELETE", token });
      if (selected === id) setSelected(null);
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

  // Separate top-level and sub-categories
  const topLevel = categories.filter((c) => !c.id_category);
  const subOf = (parentId: number) =>
    categories.filter((c) => Number(c.id_category) === parentId);

  const selectedCat = selected !== null ? categories.find((c) => c.id === selected) ?? null : null;
  const inCategory = selectedCat
    ? ingredients.filter((i) => i.category_ids.includes(Number(selectedCat.id)))
    : [];
  const outOfCategory = selectedCat
    ? ingredients.filter((i) => !i.category_ids.includes(Number(selectedCat.id)))
    : [];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Click a category to manage its ingredients. Use the <strong>sub</strong> button on a card to
          list its sub-categories.
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

      {/* ---- Big image grid of top-level categories ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {topLevel.map((cat) => {
          const subs = subOf(cat.id);
          const isSelected = selected === cat.id;
          const subsOpen = openSubsFor === cat.id;
          return (
            <div key={cat.id} className={`relative ${subsOpen ? "z-30" : ""}`}>
              {/* Parent card — full div is clickable */}
              <button
                type="button"
                onClick={() => setSelected(isSelected ? null : cat.id)}
                className={`group relative w-full overflow-hidden rounded-2xl border-2 text-left transition-all focus:outline-none ${
                  isSelected
                    ? "border-brand shadow-lg ring-2 ring-brand/30"
                    : "border-border hover:border-brand/50 hover:shadow-md"
                }`}
              >
                {/* Big image */}
                <div className="relative h-36 w-full">
                  <img
                    src={cat.image ?? FALLBACK_CAT}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brown/80 via-brown/20 to-transparent" />
                  {/* Availability badge */}
                  <span className="absolute right-2 top-2">
                    <Pill tone={cat.is_available ? "success" : "brand"}>
                      {cat.is_available ? "On" : "Off"}
                    </Pill>
                  </span>
                  {/* Selected checkmark */}
                  {isSelected && (
                    <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-cream-1">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                  {/* Name at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="truncate text-sm font-extrabold text-cream-1">{cat.name}</p>
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-cream-1/70">
                      {divisionName(cat.id_division)}
                      {subs.length > 0 ? ` · ${subs.length} sub` : ""}
                    </p>
                  </div>
                </div>
                {/* Action row */}
                <div className="flex items-center justify-between gap-1 bg-cream-1 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); void toggle(cat); }}
                      aria-label={`Toggle ${cat.name}`}
                      className="text-[10px] font-bold text-ink-muted hover:text-brand"
                    >
                      {cat.is_available ? "Hide" : "Show"}
                    </button>
                    {subs.length > 0 && (
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenSubsFor(subsOpen ? null : cat.id);
                        }}
                        aria-expanded={subsOpen}
                        aria-label={`${subsOpen ? "Hide" : "Show"} sub-categories of ${cat.name}`}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold transition-colors ${
                          subsOpen
                            ? "border-brand bg-brand text-cream-1"
                            : "border-border text-ink-secondary hover:border-brand hover:text-brand"
                        }`}
                      >
                        <Layers className="h-3 w-3" />
                        {subs.length} sub
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${subsOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing({ mode: "edit", category: cat }); }}
                      aria-label={`Edit ${cat.name}`}
                      className={iconBtn}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); void remove(cat.id); }}
                      aria-label={`Delete ${cat.name}`}
                      className={iconBtn}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </button>

              {/* Sub-categories dropdown: overlays the grid so other cards keep their place */}
              {subs.length > 0 && subsOpen && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  role="region"
                  aria-label={`Sub-categories of ${cat.name}`}
                  className="absolute left-0 right-0 top-full z-30 mt-1 space-y-1.5 rounded-xl border border-border bg-cream-1 p-2 shadow-xl"
                >
                  {subs.map((sub) => {
                    const subSelected = selected === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelected(subSelected ? null : sub.id)}
                        className={`group flex w-full items-center gap-2.5 overflow-hidden rounded-xl border-2 text-left transition-all ${
                          subSelected
                            ? "border-brand shadow-md ring-1 ring-brand/20"
                            : "border-border hover:border-brand/40 hover:shadow-sm"
                        }`}
                      >
                        <img
                          src={sub.image ?? FALLBACK_CAT}
                          alt={sub.name}
                          className="h-12 w-12 shrink-0 object-cover"
                        />
                        <div className="min-w-0 flex-1 py-1">
                          <p className="flex items-center gap-1 truncate text-[11px] font-extrabold text-ink">
                            <Layers className="h-3 w-3 shrink-0 text-ink-muted" />
                            {sub.name}
                          </p>
                          <p className="truncate text-[10px] text-ink-muted">
                            {divisionName(sub.id_division)}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1 pr-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditing({ mode: "edit", category: sub }); }}
                            aria-label={`Edit ${sub.name}`}
                            className={iconBtn}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); void remove(sub.id); }}
                            aria-label={`Delete ${sub.name}`}
                            className={iconBtn}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {categories.length === 0 ? (
          <Panel>
            <p className="text-sm text-ink-muted">No category yet. Create the first one.</p>
          </Panel>
        ) : null}
      </div>

      {/* ---- Ingredient panel for selected category ---- */}
      {selectedCat && (
        <div className="mt-6 rounded-2xl border border-brand/30 bg-cream-1 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={selectedCat.image ?? FALLBACK_CAT}
                alt={selectedCat.name}
                className="h-10 w-10 rounded-xl object-cover"
              />
              <div>
                <h3 className="text-sm font-extrabold text-ink">{selectedCat.name}</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                  {divisionName(selectedCat.id_division)}
                  {parentName(selectedCat.id_category)
                    ? ` / ${parentName(selectedCat.id_category)}`
                    : ""}
                </p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-ink-muted hover:text-brand">
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
            Eligible ingredients
          </p>

          {/* Ingredient image grid */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {inCategory.map((i) => {
              const link = i.category_links.find((l) => l.id_category === Number(selectedCat.id));
              return (
                <div key={i.id} className="group relative">
                  {link ? (
                    <span className="pointer-events-none absolute left-1 top-1 z-10 rounded-full bg-cream-1 shadow">
                      <RoleBadge role={roleOf(link)} short />
                    </span>
                  ) : null}
                  <div className="overflow-hidden rounded-xl border-2 border-success/40 bg-cream-2">
                    <img
                      src={i.image ?? FALLBACK_THUMB}
                      alt={i.name}
                      className="h-16 w-full object-cover"
                    />
                    <p className="truncate px-1 py-1 text-center text-[10px] font-bold text-ink">
                      {i.name}
                    </p>
                  </div>
                  <button
                    onClick={() => void detachIngredient(Number(selectedCat.id), i.id)}
                    aria-label={`Remove ${i.name}`}
                    className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-brand text-cream-1 shadow group-hover:flex"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            {/* Add ingredient tiles */}
            {outOfCategory.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => void attachIngredient(Number(selectedCat.id), i.id)}
                aria-label={`Add ${i.name}`}
                className="group overflow-hidden rounded-xl border-2 border-dashed border-border bg-cream-2/50 transition-all hover:border-brand/50 hover:bg-cream-2"
              >
                <img
                  src={i.image ?? FALLBACK_THUMB}
                  alt={i.name}
                  className="h-16 w-full object-cover opacity-40 transition-opacity group-hover:opacity-70"
                />
                <p className="truncate px-1 py-1 text-center text-[10px] font-bold text-ink-muted group-hover:text-brand">
                  + {i.name}
                </p>
              </button>
            ))}

            {inCategory.length === 0 && outOfCategory.length === 0 && (
              <p className="col-span-full text-[11px] text-ink-muted">
                No ingredients exist yet. Create some in the Ingredients tab.
              </p>
            )}
          </div>
        </div>
      )}

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
      !c.id_category && // only top-level categories can be parents
      Number(c.id_division) === Number(divisionId) &&
      Number(c.id) !== Number(category?.id ?? -1),
  );

  const isSubCategory = parentId !== "";
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
        {/* Image + name */}
        <div className="flex items-center gap-4">
          <ImageUpload image={image} fallback={FALLBACK_CAT} onPick={setImage} large />
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

        {/* Division */}
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

        {/* Parent — visual toggle: top-level vs sub-category */}
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
            Type
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setParentId("")}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                !isSubCategory
                  ? "border-brand bg-brand/5 shadow-sm"
                  : "border-border hover:border-brand/40"
              }`}
            >
              <p className="text-[11px] font-extrabold text-ink">
                {!isSubCategory && <Check className="mb-0.5 mr-1 inline h-3 w-3 text-brand" />}
                Top-level
              </p>
              <p className="mt-0.5 text-[10px] text-ink-muted">
                e.g. Pizza, Burgers, Cold Drinks
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                if (parentOptions.length > 0) setParentId(parentOptions[0].id);
              }}
              disabled={divisionId === "" || parentOptions.length === 0}
              className={`rounded-xl border-2 p-3 text-left transition-all disabled:opacity-40 ${
                isSubCategory
                  ? "border-brand bg-brand/5 shadow-sm"
                  : "border-border hover:border-brand/40"
              }`}
            >
              <p className="text-[11px] font-extrabold text-ink">
                {isSubCategory && <Check className="mb-0.5 mr-1 inline h-3 w-3 text-brand" />}
                Sub-category
              </p>
              <p className="mt-0.5 text-[10px] text-ink-muted">
                Joins a parent category
              </p>
            </button>
          </div>

          {isSubCategory && (
            <div className="mt-2">
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : "")}
                disabled={divisionId === ""}
                aria-label="Parent category"
                className="login-field !pl-3 disabled:opacity-50"
              >
                <option value="">Choose parent...</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
              {c.id_category ? `  ↳ ${c.name}` : c.name}
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((item) => (
          <div
            key={item.id}
            className={`group overflow-hidden rounded-2xl border bg-cream-1 shadow-sm transition-all hover:shadow-lg ${
              item.is_available ? "border-border" : "border-brand/30"
            }`}
          >
            {/* ── Image header ── */}
            <div className="relative h-44 overflow-hidden">
              <img
                src={item.image ?? FALLBACK_DISH}
                alt={item.name}
                loading="lazy"
                className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  item.is_available ? "" : "grayscale-[0.5] opacity-75"
                }`}
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-brown-dark/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cream-1 backdrop-blur-sm">
                {categoryName(item.id_category)}
              </span>
              <span className="absolute right-3 top-3">
                <Pill tone={item.is_available ? "success" : "brand"}>
                  {item.is_available ? "Available" : "Out"}
                </Pill>
              </span>
              {/* Price + name overlaid on image bottom */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                <h3 className="truncate text-[15px] font-extrabold tracking-tight text-cream-1 drop-shadow-md">{item.name}</h3>
                <span className="shrink-0 rounded-full bg-brand px-3 py-1 text-[13px] font-extrabold text-cream-1 shadow-md">
                  ${money(item.price)}
                </span>
              </div>
            </div>

            {/* ── Actions footer ── */}
            <div className="flex items-center gap-2 border-t border-border/60 bg-cream-2/40 px-3 py-2.5">
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
  const [quickRole, setQuickRole] = useState<LinkRole>("principal");

  const divisionCategories = useMemo(
    () => categories.filter((c) => Number(c.id_division) === Number(divisionId)),
    [categories, divisionId],
  );

  // Top-level categories for the visual picker
  const topLevelCats = useMemo(
    () => divisionCategories.filter((c) => !c.id_category),
    [divisionCategories],
  );
  const subCatsOf = (parentId: number) =>
    divisionCategories.filter((c) => Number(c.id_category) === parentId);

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
    return () => { cancelled = true; };
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
    return () => { cancelled = true; };
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

  // Eligible ingredients split by the role they play in the selected category.
  const principalEligible = useMemo(
    () => eligible.filter((e) => e.is_ingredient || !e.is_supplementaire),
    [eligible],
  );
  const addonEligible = useMemo(() => eligible.filter((e) => e.is_supplementaire), [eligible]);
  const attachedIds = useMemo(() => new Set(attached.map((a) => a.id_ingredient)), [attached]);

  const attach = (ing: EligibleIngredient, as: "principal" | "addon") => {
    if (attached.some((a) => a.id_ingredient === ing.id)) return;
    setAttached((prev) => [
      ...prev,
      {
        id_ingredient: ing.id,
        name: ing.name,
        image: ing.image,
        is_ingredient: as === "principal",
        is_supplementaire: as === "addon",
        is_removable: false,
        price_supplementaire: as === "addon" ? 0 : null,
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
        body: { id_ingredient: ingredientId, ...roleToFlags(quickRole) },
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
      maxWidth="max-w-5xl"
    >
      {err ? <DialogError message={err} /> : null}

      <div className="grid gap-0 md:grid-cols-[1fr_340px]">
        {/* ===== LEFT COLUMN ===== */}
        <div className="space-y-5 p-5">

          {/* Step 1 — Division */}
          <div>
            <StepLabel n={1} label="Division" />
            <div className="mt-2 flex flex-wrap gap-2">
              {divisions.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => pickDivision(Number(d.id))}
                  className={`rounded-xl border-2 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] transition-all ${
                    Number(divisionId) === Number(d.id)
                      ? "border-brand bg-brand text-cream-1 shadow"
                      : "border-border bg-cream-2 text-ink-secondary hover:border-brand/50"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Category (image cards) */}
          {divisionId !== "" && (
            <div>
              <StepLabel n={2} label="Category" />
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {topLevelCats.map((cat) => {
                  const subs = subCatsOf(cat.id);
                  const catSelected = Number(categoryId) === Number(cat.id);
                  return (
                    <div key={cat.id}>
                      <button
                        type="button"
                        onClick={() => setCategoryId(Number(cat.id))}
                        className={`group relative w-full overflow-hidden rounded-xl border-2 transition-all ${
                          catSelected
                            ? "border-brand shadow-md"
                            : "border-border hover:border-brand/40"
                        }`}
                      >
                        <img
                          src={cat.image ?? FALLBACK_CAT}
                          alt={cat.name}
                          className="h-16 w-full object-cover"
                        />
                        <div
                          className={`absolute inset-0 flex items-end p-1 ${
                            catSelected ? "bg-brand/50" : "bg-brown/40"
                          }`}
                        >
                          {catSelected && (
                            <Check className="absolute right-1 top-1 h-3.5 w-3.5 text-cream-1" />
                          )}
                          <span className="w-full truncate text-center text-[9px] font-extrabold uppercase tracking-[0.1em] text-cream-1">
                            {cat.name}
                          </span>
                        </div>
                      </button>
                      {/* Sub-categories */}
                      {subs.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {subs.map((sub) => {
                            const subSel = Number(categoryId) === Number(sub.id);
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => setCategoryId(Number(sub.id))}
                                className={`flex w-full items-center gap-1.5 overflow-hidden rounded-lg border-2 text-left transition-all ${
                                  subSel
                                    ? "border-brand bg-brand/10"
                                    : "border-border bg-cream-2 hover:border-brand/40"
                                }`}
                              >
                                <img
                                  src={sub.image ?? FALLBACK_CAT}
                                  alt={sub.name}
                                  className="h-8 w-8 shrink-0 object-cover"
                                />
                                <span className="truncate text-[9px] font-bold text-ink">
                                  {sub.name}
                                </span>
                                {subSel && <Check className="ml-auto mr-1 h-3 w-3 shrink-0 text-brand" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 — Dish details */}
          <div>
            <StepLabel n={3} label="Dish details" />
            <div className="mt-2 flex gap-3">
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
          </div>

          {/* Attached ingredients summary */}
          {attached.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                Attached ingredients
              </p>
              <ul className="grid gap-1.5">
                {attached.map((a) => {
                  const bad = categoryId !== "" && !eligibleIds.has(Number(a.id_ingredient));
                  return (
                    <li
                      key={a.id_ingredient}
                      className={`flex flex-wrap items-center gap-2 rounded-[4px] border px-3 py-1.5 text-sm ${
                        bad ? "border-brand bg-brand/10" : "border-border bg-cream-2/50"
                      }`}
                    >
                      {a.image ? (
                        <img src={a.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : null}
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
          )}
        </div>

        {/* ===== RIGHT COLUMN — ingredient picker ===== */}
        <div className="border-l border-border bg-cream-2/40 p-4">
          <StepLabel n={4} label="Pick ingredients" />

          {categoryId === "" ? (
            <p className="mt-3 text-[11px] text-ink-muted">
              Select a division and category first.
            </p>
          ) : (
            <>
              {loadingIngredients ? (
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </p>
              ) : (
                <>
                  {/* Eligible ingredients, split by their role in this category */}
                  <IngredientTileGrid
                    title="Principal ingredients"
                    hint="Make up the dish"
                    items={principalEligible}
                    attachedIds={attachedIds}
                    onPick={(ing) => attach(ing, "principal")}
                    emptyLabel="No principal ingredient for this category yet."
                  />
                  <IngredientTileGrid
                    title="Add-ons"
                    hint="Optional paid extras"
                    items={addonEligible}
                    attachedIds={attachedIds}
                    onPick={(ing) => attach(ing, "addon")}
                    emptyLabel="No add-on for this category yet."
                    tone="brand"
                  />
                  {eligible.length === 0 && (
                    <p className="mt-2 text-[11px] text-ink-muted">
                      Tip: associate ingredients to this category from the Ingredients tab (edit button).
                    </p>
                  )}

                  {/* Quick add */}
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
                      Quick add to this category
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void quickAdd()}
                        placeholder="Ingredient name"
                        aria-label="Quick add ingredient"
                        className="login-field !pl-3"
                      />
                      <button
                        onClick={() => void quickAdd()}
                        disabled={quickBusy || !quickName.trim()}
                        className="shrink-0 rounded-[4px] bg-brand px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cream-1 disabled:opacity-50"
                      >
                        {quickBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="mt-2">
                      <RolePicker value={quickRole} onChange={setQuickRole} />
                    </div>
                    <p className="mt-1.5 text-[10px] text-ink-muted">
                      Creates the ingredient + links it to this category with the chosen role, then click its tile above.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">
        {ineligible.length > 0 ? (
          <span className="mr-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-brand">
            <AlertTriangle className="h-3.5 w-3.5" />
            {ineligible.length} ingredient{ineligible.length > 1 ? "s are" : " is"} not eligible in this category
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

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-extrabold text-cream-1">
        {n}
      </span>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
        {label}
      </span>
    </div>
  );
}

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

function ToggleSwitch({
  on,
  onChange,
  labelOn,
  labelOff,
  offTone = "muted",
  disabled = false,
}: {
  on: boolean;
  onChange: () => void;
  labelOn: string;
  labelOff: string;
  /** Colour of the "off" state: neutral grey, or brand red when off is a real choice (e.g. Add-on). */
  offTone?: "muted" | "brand";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      disabled={disabled}
      className="inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
          on
            ? "border-success bg-success"
            : offTone === "brand"
              ? "border-brand bg-brand"
              : "border-border bg-cream-3"
        }`}
      >
        <span
          className={`absolute left-0.5 h-4 w-4 rounded-full bg-cream-1 shadow transition-transform ${
            on ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      <span
        className={`text-[11px] font-bold ${
          on ? "text-success" : offTone === "brand" ? "text-brand" : "text-ink-muted"
        }`}
      >
        {on ? labelOn : labelOff}
      </span>
    </button>
  );
}

/**
 * Per-category role control used in the ingredient dialog (create and modify):
 * a "Both" checkbox on the left, and the Principal / Add-on switch on the right.
 */
function RoleControl({ role, onChange }: { role: LinkRole; onChange: (role: LinkRole) => void }) {
  const both = role === "both";
  return (
    <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-border bg-cream-2 px-2 py-1">
      <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-bold text-ink-secondary">
        <input
          type="checkbox"
          checked={both}
          onChange={(e) => onChange(e.target.checked ? "both" : "principal")}
          aria-label="Both principal and add-on"
          className="h-3.5 w-3.5 accent-[#A80D25]"
        />
        Both
      </label>
      <ToggleSwitch
        on={role !== "addon"}
        onChange={() => onChange(role === "addon" ? "principal" : "addon")}
        labelOn={both ? "Principal + Add-on" : "Principal"}
        labelOff="Add-on"
        offTone="brand"
        disabled={both}
      />
    </div>
  );
}

function RoleBadge({ role, short = false }: { role: LinkRole; short?: boolean }) {
  const tone =
    role === "addon"
      ? "bg-brand/10 text-brand"
      : role === "both"
        ? "bg-ink/8 text-ink-secondary"
        : "bg-success/12 text-success";
  const label = short && role === "both" ? "Both" : ROLE_LABEL[role];
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] ${tone}`}
    >
      {label}
    </span>
  );
}

function RolePicker({ value, onChange }: { value: LinkRole; onChange: (role: LinkRole) => void }) {
  const activeTone: Record<LinkRole, string> = {
    principal: "bg-success text-cream-1 shadow-sm",
    addon: "bg-brand text-cream-1 shadow-sm",
    both: "bg-ink text-cream-1 shadow-sm",
  };
  return (
    <div
      role="radiogroup"
      aria-label="Role in this category"
      className="grid grid-cols-3 gap-0.5 rounded-lg border border-border bg-cream-2 p-0.5"
    >
      {ROLE_OPTIONS.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.key)}
            className={`rounded-md px-1 py-1 text-[9px] font-extrabold uppercase tracking-[0.06em] transition-colors ${
              active ? activeTone[o.key] : "text-ink-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function IngredientTileGrid({
  title,
  hint,
  items,
  attachedIds,
  onPick,
  emptyLabel,
  tone = "success",
}: {
  title: string;
  hint: string;
  items: EligibleIngredient[];
  attachedIds: Set<number>;
  onPick: (ing: EligibleIngredient) => void;
  emptyLabel: string;
  tone?: "success" | "brand";
}) {
  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p
          className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${
            tone === "brand" ? "text-brand" : "text-success"
          }`}
        >
          {title} <span className="text-ink-muted">({items.length})</span>
        </p>
        <span className="text-[10px] text-ink-muted">{hint}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((ing) => {
          const already = attachedIds.has(ing.id);
          return (
            <button
              key={ing.id}
              type="button"
              onClick={() => onPick(ing)}
              disabled={already}
              aria-label={already ? `${ing.name} attached` : `Attach ${ing.name}`}
              className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                already
                  ? "border-success/60 opacity-60"
                  : "border-border hover:border-brand/60 hover:shadow-sm"
              }`}
            >
              <img
                src={ing.image ?? FALLBACK_THUMB}
                alt={ing.name}
                className="h-16 w-full object-cover"
              />
              <div
                className={`absolute inset-0 flex items-end p-1 ${
                  already ? "bg-success/30" : "bg-brown/30 group-hover:bg-brand/30"
                }`}
              >
                {already && (
                  <Check className="absolute right-1 top-1 h-3.5 w-3.5 text-cream-1" />
                )}
                <span className="w-full truncate text-center text-[9px] font-extrabold uppercase tracking-[0.08em] text-cream-1">
                  {ing.name}
                </span>
              </div>
            </button>
          );
        })}
        {items.length === 0 && (
          <p className="col-span-3 text-[11px] text-ink-muted">{emptyLabel}</p>
        )}
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
