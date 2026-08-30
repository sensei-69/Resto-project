import { useRef, useState } from "react";
import {
  Check,
  CupSoda,
  GripVertical,
  ImagePlus,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { PageHeader, Panel, Pill } from "../components/dashboard/shell";
import {
  ingredientLibrary,
  menuItems,
  type AddOn,
  type Ingredient,
  type MenuItem,
} from "../lib/dashboard-data";

const categories = ["All", "Burgers", "Sides", "Drinks", "Desserts"] as const;
const dishCategories = ["Burgers", "Sides", "Drinks", "Desserts"] as const;

const categoryImage: Record<MenuItem["category"], string> = {
  Burgers: "https://placehold.co/400x300/A80D25/FFFFFF?text=Burgers",
  Sides: "https://placehold.co/400x300/6F9E3E/FFFFFF?text=Sides",
  Drinks: "https://placehold.co/400x300/F5C542/171717?text=Drinks",
  Desserts: "https://placehold.co/400x300/402015/FFFFFF?text=Desserts",
};

const imageOf = (item: MenuItem) => item.image ?? categoryImage[item.category];
const isOn = (v?: boolean) => v !== false;

function reorder<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return list;
  next.splice(to, 0, moved);
  return next;
}

const emptyDish = (): MenuItem => ({
  id: `m${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  category: "Burgers",
  price: 0,
  inStock: true,
  principal: [],
  addons: [],
});

export default function AdminMenu() {
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; dish: MenuItem } | null>(null);
  const [rename, setRename] = useState<{
    id: string;
    kind: "principal" | "addons";
    index: number;
    value: string;
  } | null>(null);
  const drag = useRef<{ id: string; kind: "principal" | "addons"; index: number } | null>(null);

  const visible = items.filter(
    (i) =>
      (category === "All" || i.category === category) &&
      i.name.toLowerCase().includes(query.toLowerCase()),
  );

  const patch = (id: string, fn: (i: MenuItem) => MenuItem) =>
    setItems((prev) => prev.map((i) => (i.id === id ? fn(i) : i)));

  const setPrice = (id: string, value: number) =>
    patch(id, (i) => ({ ...i, price: Math.max(0, Math.round(value * 100) / 100) }));

  const toggleStock = (id: string) => patch(id, (i) => ({ ...i, inStock: !i.inStock }));

  const removeIngredient = (id: string, kind: "principal" | "addons", index: number) =>
    patch(id, (i) => ({ ...i, [kind]: i[kind].filter((_, n) => n !== index) }) as MenuItem);

  const toggleIngredient = (id: string, kind: "principal" | "addons", index: number) =>
    patch(id, (i) => ({
      ...i,
      [kind]: (i[kind] as (Ingredient | AddOn)[]).map((x, n) =>
        n === index ? { ...x, available: !isOn(x.available) } : x,
      ),
    }) as MenuItem);

  const renameIngredient = (
    id: string,
    kind: "principal" | "addons",
    index: number,
    name: string,
  ) =>
    patch(id, (i) => ({
      ...i,
      [kind]: (i[kind] as (Ingredient | AddOn)[]).map((x, n) => (n === index ? { ...x, name } : x)),
    }) as MenuItem);

  const setAddonPrice = (id: string, index: number, value: number) =>
    patch(id, (i) => ({
      ...i,
      addons: i.addons.map((a, n) =>
        n === index ? { ...a, price: Math.max(0, Math.round(value * 100) / 100) } : a,
      ),
    }));

  const onDrop = (id: string, kind: "principal" | "addons", index: number) => {
    const d = drag.current;
    if (!d || d.id !== id || d.kind !== kind || d.index === index) return;
    patch(id, (i) => ({ ...i, [kind]: reorder(i[kind] as unknown[], d.index, index) }) as MenuItem);
    drag.current = null;
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const saveDish = (dish: MenuItem, mode: "create" | "edit") => {
    setItems((prev) =>
      mode === "create" ? [dish, ...prev] : prev.map((i) => (i.id === dish.id ? dish : i)),
    );
    setEditing(null);
  };

  const renameRow = (kind: "principal" | "addons", item: MenuItem, index: number) =>
    rename && rename.id === item.id && rename.kind === kind && rename.index === index;

  const commitRename = () => {
    if (rename && rename.value.trim()) {
      renameIngredient(rename.id, rename.kind, rename.index, rename.value.trim());
    }
    setRename(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Kitchen setup"
        title="Menu & stock control"
        description="Set the food, the price, availability and the ingredients customers can remove or add on."
        action={
          <button
            className="login-cta !w-auto px-5"
            onClick={() => setEditing({ mode: "create", dish: emptyDish() })}
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" /> New item
            </span>
          </button>
        }
      />

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
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-[3px] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] transition-colors ${category === c ? "bg-brand text-cream-1" : "text-ink-muted hover:bg-cream-2 hover:text-ink"
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((item) => (
          <Panel key={item.id} className="overflow-hidden p-0">
            {/* HEAD — picture behind everything, text above */}
            <div className="relative isolate min-h-[160px]">
              <img
                src={imageOf(item)}
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
                      {item.category === "Drinks" ? (
                        <CupSoda className="h-4 w-4 shrink-0 text-cream-1" />
                      ) : (
                        <UtensilsCrossed className="h-4 w-4 shrink-0 text-cream-1" />
                      )}
                      <h3 className="truncate text-lg font-extrabold text-cream-1 drop-shadow">
                        {item.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cream-2">
                      {item.category}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Pill tone={item.inStock ? "success" : "brand"}>
                      {item.inStock ? "Available" : "Out of stock"}
                    </Pill>
                    <button
                      onClick={() => remove(item.id)}
                      aria-label={`Delete ${item.name}`}
                      className="rounded-[4px] border border-cream-3/40 bg-brown/60 p-2 text-cream-2 backdrop-blur-sm transition-colors hover:border-brand hover:text-cream-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditing({ mode: "edit", dish: item })}
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
                      onClick={() => setPrice(item.id, item.price - 0.5)}
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
                        value={item.price}
                        onChange={(e) => setPrice(item.id, Number(e.target.value))}
                        aria-label={`Price of ${item.name}`}
                        className="w-16 bg-transparent px-1 py-1.5 text-sm font-extrabold text-cream-1 outline-none"
                      />
                    </div>
                    <button
                      onClick={() => setPrice(item.id, item.price + 0.5)}
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
              {/* STOCK TOGGLE */}
              <button
                onClick={() => toggleStock(item.id)}
                aria-pressed={item.inStock}
                className={`mt-4 w-full rounded-[6px] px-3 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cream-1 transition-colors ${item.inStock ? "bg-success hover:brightness-95" : "bg-brand hover:brightness-95"
                  }`}
              >
                {item.inStock ? "Available" : "Out of stock"}
              </button>

              {/* PRINCIPAL INGREDIENTS */}
              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                Principal ingredients — drag to reorder, remove if not used
              </p>
              <ul className="mt-2 grid gap-2">
                {item.principal.map((ing, index) => (
                  <li
                    key={`${ing.name}-${index}`}
                    draggable={!renameRow("principal", item, index)}
                    onDragStart={() => (drag.current = { id: item.id, kind: "principal", index })}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(item.id, "principal", index)}
                    className={`flex cursor-grab flex-wrap items-center gap-2 rounded-[4px] border border-border bg-cream-1 px-3 py-2 text-sm text-ink-secondary active:cursor-grabbing ${isOn(ing.available) ? "" : "opacity-60"
                      }`}
                  >
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                    {renameRow("principal", item, index) ? (
                      <input
                        autoFocus
                        value={rename?.value ?? ""}
                        onChange={(e) => setRename((r) => (r ? { ...r, value: e.target.value } : r))}
                        onBlur={commitRename}
                        onKeyDown={(e) => e.key === "Enter" && commitRename()}
                        aria-label={`Rename ${ing.name}`}
                        className="min-w-0 flex-1 rounded-[3px] border border-brand bg-cream-2/60 px-2 py-1 text-sm outline-none"
                      />
                    ) : (
                      <span
                        className={`min-w-0 flex-1 truncate ${isOn(ing.available) ? "" : "line-through"}`}
                      >
                        {ing.name}
                      </span>
                    )}
                    <button
                      onClick={() => toggleIngredient(item.id, "principal", index)}
                      className={`rounded-[3px] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] transition-colors ${isOn(ing.available)
                        ? "bg-success/12 text-success hover:bg-success/20"
                        : "bg-brand/10 text-brand hover:bg-brand/20"
                        }`}
                    >
                      {isOn(ing.available) ? "Available" : "Not available"}
                    </button>
                    <button
                      onClick={() =>
                        setRename({ id: item.id, kind: "principal", index, value: ing.name })
                      }
                      aria-label={`Modify ${ing.name}`}
                      className="text-ink-muted transition-colors hover:text-brand"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeIngredient(item.id, "principal", index)}
                      aria-label={`Remove ${ing.name}`}
                      className="text-ink-muted transition-colors hover:text-brand"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>

              {/* ADD-ONS */}
              <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                Add-on ingredients — drag to reorder, set the extra price
              </p>
              <ul className="mt-2 grid gap-2">
                {item.addons.map((add, index) => (
                  <li
                    key={`${add.name}-${index}`}
                    draggable={!renameRow("addons", item, index)}
                    onDragStart={() => (drag.current = { id: item.id, kind: "addons", index })}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(item.id, "addons", index)}
                    className={`flex cursor-grab flex-wrap items-center gap-2 rounded-[4px] border border-border bg-cream-1 px-3 py-2 text-sm text-ink-secondary active:cursor-grabbing ${isOn(add.available) ? "" : "opacity-60"
                      }`}
                  >
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                    {renameRow("addons", item, index) ? (
                      <input
                        autoFocus
                        value={rename?.value ?? ""}
                        onChange={(e) => setRename((r) => (r ? { ...r, value: e.target.value } : r))}
                        onBlur={commitRename}
                        onKeyDown={(e) => e.key === "Enter" && commitRename()}
                        aria-label={`Rename ${add.name}`}
                        className="min-w-0 flex-1 rounded-[3px] border border-brand bg-cream-2/60 px-2 py-1 text-sm outline-none"
                      />
                    ) : (
                      <span
                        className={`min-w-0 flex-1 truncate ${isOn(add.available) ? "" : "line-through"}`}
                      >
                        {add.name}
                      </span>
                    )}
                    <div className="flex items-center rounded-[4px] border border-border bg-cream-2/60 px-2">
                      <span className="text-xs font-extrabold text-ink-muted">+$</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={add.price}
                        onChange={(e) => setAddonPrice(item.id, index, Number(e.target.value))}
                        aria-label={`Price of add-on ${add.name}`}
                        className="w-14 bg-transparent px-1 py-1 text-xs font-extrabold text-ink outline-none"
                      />
                    </div>
                    <button
                      onClick={() => toggleIngredient(item.id, "addons", index)}
                      className={`rounded-[3px] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] transition-colors ${isOn(add.available)
                        ? "bg-success/12 text-success hover:bg-success/20"
                        : "bg-brand/10 text-brand hover:bg-brand/20"
                        }`}
                    >
                      {isOn(add.available) ? "Available" : "Not available"}
                    </button>
                    <button
                      onClick={() =>
                        setRename({ id: item.id, kind: "addons", index, value: add.name })
                      }
                      aria-label={`Modify add-on ${add.name}`}
                      className="text-ink-muted transition-colors hover:text-brand"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeIngredient(item.id, "addons", index)}
                      aria-label={`Remove add-on ${add.name}`}
                      className="text-ink-muted transition-colors hover:text-brand"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
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
          initial={editing.dish}
          onClose={() => setEditing(null)}
          onSave={saveDish}
        />
      ) : null}
    </>
  );
}

function DishDialog({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initial: MenuItem;
  onClose: () => void;
  onSave: (dish: MenuItem, mode: "create" | "edit") => void;
}) {
  const [dish, setDish] = useState<MenuItem>(initial);
  const [principalDraft, setPrincipalDraft] = useState("");
  const [addonDraft, setAddonDraft] = useState("");
  const [addonPriceDraft, setAddonPriceDraft] = useState("1");

  const preview = dish.image ?? categoryImage[dish.category];

  const addPrincipal = (name: string) => {
    if (!name.trim()) return;
    setDish((d) => ({ ...d, principal: [...d.principal, { name: name.trim(), available: true }] }));
    setPrincipalDraft("");
  };

  const addAddon = (name: string, price: number) => {
    if (!name.trim()) return;
    setDish((d) => ({
      ...d,
      addons: [...d.addons, { name: name.trim(), price: Math.max(0, price), available: true }],
    }));
    setAddonDraft("");
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDish((d) => ({ ...d, image: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brown/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Create a new dish" : `Modify ${initial.name}`}
    >
      <div className="my-6 w-full max-w-4xl rounded-[10px] border border-border bg-cream-1 shadow-xl">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-ink">
            {mode === "create" ? "New menu item" : `Modify ${initial.name || "dish"}`}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-brand">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-5 p-5 md:grid-cols-[1.4fr_1fr]">
          {/* LEFT — dish fields */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[6px] border border-border">
                <img src={preview} alt="" className="h-full w-full object-cover" />
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
                  value={dish.name}
                  onChange={(e) => setDish((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Dish name"
                  aria-label="Dish name"
                  className="login-field !pl-3"
                />
                <div className="flex gap-2">
                  <select
                    value={dish.category}
                    onChange={(e) =>
                      setDish((d) => ({ ...d, category: e.target.value as MenuItem["category"] }))
                    }
                    aria-label="Category"
                    className="login-field !pl-3"
                  >
                    {dishCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center rounded-[4px] border border-border bg-cream-1 px-2">
                    <span className="text-sm font-extrabold text-ink-muted">$</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={dish.price}
                      onChange={(e) => setDish((d) => ({ ...d, price: Number(e.target.value) }))}
                      aria-label="Dish price"
                      className="w-20 bg-transparent px-1 py-2 text-sm font-extrabold text-ink outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* principal */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                Principal ingredients
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  value={principalDraft}
                  onChange={(e) => setPrincipalDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPrincipal(principalDraft)}
                  placeholder="Write an ingredient"
                  aria-label="New principal ingredient"
                  className="login-field !pl-3"
                />
                <button
                  onClick={() => addPrincipal(principalDraft)}
                  className="shrink-0 rounded-[4px] bg-brand px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cream-1"
                >
                  Add
                </button>
              </div>
              <ul className="mt-2 grid gap-1.5">
                {dish.principal.map((ing, i) => (
                  <li
                    key={`${ing.name}-${i}`}
                    className="flex items-center gap-2 rounded-[4px] border border-border bg-cream-2/50 px-3 py-1.5 text-sm"
                  >
                    <span className="flex-1 truncate">{ing.name}</span>
                    <button
                      onClick={() =>
                        setDish((d) => ({
                          ...d,
                          principal: d.principal.filter((_, n) => n !== i),
                        }))
                      }
                      aria-label={`Remove ${ing.name}`}
                      className="text-ink-muted hover:text-brand"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* addons */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                Add-on ingredients
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  value={addonDraft}
                  onChange={(e) => setAddonDraft(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && addAddon(addonDraft, Number(addonPriceDraft))
                  }
                  placeholder="Write an add-on"
                  aria-label="New add-on ingredient"
                  className="login-field !pl-3"
                />
                <div className="flex shrink-0 items-center rounded-[4px] border border-border bg-cream-1 px-2">
                  <span className="text-xs font-extrabold text-ink-muted">+$</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={addonPriceDraft}
                    onChange={(e) => setAddonPriceDraft(e.target.value)}
                    aria-label="Add-on price"
                    className="w-16 bg-transparent px-1 py-2 text-xs font-extrabold text-ink outline-none"
                  />
                </div>
                <button
                  onClick={() => addAddon(addonDraft, Number(addonPriceDraft))}
                  className="shrink-0 rounded-[4px] bg-brand px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cream-1"
                >
                  Add
                </button>
              </div>
              <ul className="mt-2 grid gap-1.5">
                {dish.addons.map((add, i) => (
                  <li
                    key={`${add.name}-${i}`}
                    className="flex items-center gap-2 rounded-[4px] border border-border bg-cream-2/50 px-3 py-1.5 text-sm"
                  >
                    <span className="flex-1 truncate">{add.name}</span>
                    <div className="flex items-center rounded-[4px] border border-border bg-cream-1 px-2">
                      <span className="text-xs font-extrabold text-ink-muted">+$</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={add.price}
                        onChange={(e) =>
                          setDish((d) => ({
                            ...d,
                            addons: d.addons.map((a, n) =>
                              n === i ? { ...a, price: Number(e.target.value) } : a,
                            ),
                          }))
                        }
                        aria-label={`Price of ${add.name}`}
                        className="w-14 bg-transparent px-1 py-1 text-xs font-extrabold text-ink outline-none"
                      />
                    </div>
                    <button
                      onClick={() =>
                        setDish((d) => ({ ...d, addons: d.addons.filter((_, n) => n !== i) }))
                      }
                      aria-label={`Remove ${add.name}`}
                      className="text-ink-muted hover:text-brand"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT — ingredient library */}
          <div className="rounded-[8px] border border-border bg-cream-2/50 p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
              Kitchen ingredients
            </p>
            <p className="mt-1 text-[11px] text-ink-muted">
              Add straight to principal or to add-ons with its price.
            </p>
            <ul className="mt-3 grid max-h-[420px] gap-1.5 overflow-y-auto pr-1">
              {ingredientLibrary.map((lib) => (
                <li
                  key={lib.name}
                  className="flex items-center gap-2 rounded-[4px] border border-border bg-cream-1 px-2.5 py-1.5 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">{lib.name}</span>
                  <span className="text-[10px] font-extrabold text-ink-muted">+${lib.price}</span>
                  <button
                    onClick={() => addPrincipal(lib.name)}
                    aria-label={`Add ${lib.name} to principal ingredients`}
                    className="rounded-[3px] bg-ink/8 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-ink-secondary hover:bg-ink/15"
                  >
                    Principal
                  </button>
                  <button
                    onClick={() => addAddon(lib.name, lib.price)}
                    aria-label={`Add ${lib.name} to add-ons`}
                    className="rounded-[3px] bg-brand/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-brand hover:bg-brand/20"
                  >
                    Add-on
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-[4px] border border-border px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-secondary hover:border-brand hover:text-brand"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...dish, name: dish.name.trim() || "Untitled dish" }, mode)}
            className="inline-flex items-center gap-2 rounded-[4px] bg-brand px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cream-1 hover:brightness-95"
          >
            <Check className="h-3.5 w-3.5" />
            {mode === "create" ? "Create item" : "Save changes"}
          </button>
        </footer>
      </div>
    </div>
  );
}
