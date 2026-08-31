import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Gift, Loader2, Minus, Percent, Plus, Tag, Trash2 } from "lucide-react";
import { PageHeader, Panel, Pill } from "../components/dashboard/shell";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

type OfferType = "PACK" | "DISCOUNT" | "HAPPY_HOUR";

type OfferItem = {
  id_product: number;
  quantity: number;
  name: string;
  image: string | null;
};

type ApiOffer = {
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

type Product = {
  id: number;
  name: string;
  image: string | null;
  price: string | number;
  is_available: boolean;
  id_category: number;
};

const TYPE_LABEL: Record<OfferType, string> = {
  PACK: "Pack",
  DISCOUNT: "Discount",
  HAPPY_HOUR: "Happy Hour",
};

const THUMB_FALLBACK = "https://placehold.co/80x80/A80D25/FFFFFF?text=%3F";

export default function AdminOffers() {
  const { token } = useAuth();
  const [offers, setOffers] = useState<ApiOffer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [title, setTitle] = useState("");
  const [type, setType] = useState<OfferType>("PACK");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("15");
  const [availabilityWindow, setAvailabilityWindow] = useState("All week");
  const [wholeMenu, setWholeMenu] = useState(false);
  const [picked, setPicked] = useState<{ id_product: number; quantity: number }[]>([]);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [o, p] = await Promise.all([
        api<{ offers: ApiOffer[] }>("/api/offers"),
        api<{ products: Product[] }>("/api/catalog/products"),
      ]);
      setOffers(o.offers);
      setProducts(p.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load offers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pickedFor = (id: number) => picked.find((x) => x.id_product === id);

  const togglePick = (id: number) =>
    setPicked((prev) =>
      prev.some((x) => x.id_product === id)
        ? prev.filter((x) => x.id_product !== id)
        : [...prev, { id_product: id, quantity: 1 }],
    );

  const setQty = (id: number, quantity: number) =>
    setPicked((prev) =>
      prev.map((x) => (x.id_product === id ? { ...x, quantity: Math.max(1, quantity) } : x)),
    );

  const create = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      await api("/api/offers", {
        method: "POST",
        body: {
          title: title.trim(),
          type,
          price: Number(price) > 0 ? Number(price) : null,
          discount_percent: Number(discount) > 0 ? Number(discount) : null,
          availability_window: availabilityWindow.trim() || null,
          applies_to_whole_menu: wholeMenu,
          items: wholeMenu ? [] : picked,
        },
        token,
      });
      setTitle("");
      setPrice("");
      setPicked([]);
      setWholeMenu(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the offer");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (o: ApiOffer) => {
    const before = offers;
    setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, is_active: !x.is_active } : x)));
    try {
      await api(`/api/offers/${o.id}`, { method: "PATCH", body: { is_active: !o.is_active }, token });
    } catch (err) {
      setOffers(before);
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const remove = async (id: number) => {
    try {
      await api(`/api/offers/${id}`, { method: "DELETE", token });
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Marketing"
        title="Offers & packs"
        description="Build new combos, seasonal packs and happy-hour discounts, then switch them live in one click."
      />

      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-5">
        <Panel title="New offer" className="xl:col-span-2">
          <div className="space-y-3">
            <Field label="Offer name">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ember Family Pack"
                className="login-field !pl-3"
              />
            </Field>

            <Field label="Type">
              <div className="flex gap-1 rounded-[4px] border border-border bg-cream-1 p-1">
                {(Object.keys(TYPE_LABEL) as OfferType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-[3px] px-2 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-colors ${
                      type === t ? "bg-brand text-cream-1" : "text-ink-muted hover:bg-cream-2"
                    }`}
                  >
                    {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Pack price ($)">
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  inputMode="decimal"
                  placeholder="42.00"
                  className="login-field !pl-3"
                />
              </Field>
              <Field label="Discount (%)">
                <input
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  inputMode="numeric"
                  className="login-field !pl-3"
                />
              </Field>
            </div>

            <Field label="Availability window">
              <input
                value={availabilityWindow}
                onChange={(e) => setAvailabilityWindow(e.target.value)}
                className="login-field !pl-3"
              />
            </Field>

            <Field label="Applies to">
              <button
                type="button"
                onClick={() => setWholeMenu((v) => !v)}
                aria-pressed={wholeMenu}
                className={`w-full rounded-[4px] border px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] transition-colors ${
                  wholeMenu
                    ? "border-brand bg-brand text-cream-1"
                    : "border-border bg-cream-1 text-ink-muted hover:border-brand hover:text-brand"
                }`}
              >
                {wholeMenu ? "Whole menu \u2014 no specific items" : "Specific dishes (pick below)"}
              </button>
            </Field>

            {!wholeMenu ? (
              <Field label="Items included \u2014 pick by picture">
                <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-[4px] border border-border bg-cream-2/50 p-2">
                  {products.map((p) => {
                    const sel = pickedFor(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2.5 rounded-[3px] px-2 py-1.5 text-sm text-ink-secondary transition-colors ${
                          sel ? "bg-brand/10" : "bg-cream-1"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => togglePick(p.id)}
                          aria-pressed={Boolean(sel)}
                          aria-label={`${sel ? "Remove" : "Add"} ${p.name}`}
                          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                        >
                          <img
                            src={p.image ?? THUMB_FALLBACK}
                            alt=""
                            width={40}
                            height={40}
                            loading="lazy"
                            className="h-10 w-10 shrink-0 rounded-[4px] border border-border object-cover"
                          />
                          <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                          <span className="text-[10px] font-extrabold text-ink-muted">
                            ${Number(p.price).toFixed(2)}
                          </span>
                        </button>
                        {sel ? (
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              onClick={() => setQty(p.id, sel.quantity - 1)}
                              aria-label={`Decrease quantity of ${p.name}`}
                              className="rounded-[3px] border border-border p-1 text-ink-muted hover:border-brand hover:text-brand"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-extrabold text-ink">
                              {sel.quantity}x
                            </span>
                            <button
                              onClick={() => setQty(p.id, sel.quantity + 1)}
                              aria-label={`Increase quantity of ${p.name}`}
                              className="rounded-[3px] border border-border p-1 text-ink-muted hover:border-brand hover:text-brand"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {products.length === 0 ? (
                    <p className="px-2 py-1 text-[11px] text-ink-muted">
                      No dishes yet \u2014 create them in Menu first.
                    </p>
                  ) : null}
                </div>
              </Field>
            ) : null}

            <button onClick={() => void create()} disabled={creating || !title.trim()} className="login-cta disabled:opacity-50">
              <span className="inline-flex items-center gap-2">
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Create offer
              </span>
            </button>
          </div>
        </Panel>

        <div className="space-y-4 xl:col-span-3">
          {loading ? (
            <Panel>
              <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading offers\u2026
              </p>
            </Panel>
          ) : null}
          {!loading && offers.length === 0 ? (
            <Panel>
              <p className="text-sm text-ink-muted">No offers yet \u2014 create the first one.</p>
            </Panel>
          ) : null}
          {offers.map((o) => (
            <Panel key={o.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {o.type === "PACK" ? (
                      <Gift className="h-4 w-4 text-brand" />
                    ) : o.type === "DISCOUNT" ? (
                      <Percent className="h-4 w-4 text-brand" />
                    ) : (
                      <Tag className="h-4 w-4 text-brand" />
                    )}
                    <h3 className="text-base font-extrabold text-ink">{o.title}</h3>
                  </div>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                    {TYPE_LABEL[o.type]} \u00b7 {o.availability_window ?? "Anytime"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={o.is_active ? "success" : "muted"}>{o.is_active ? "Live" : "Paused"}</Pill>
                  <button
                    onClick={() => void toggleActive(o)}
                    className="rounded-[4px] border border-border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-secondary transition-colors hover:border-brand hover:text-brand"
                  >
                    {o.is_active ? "Pause" : "Activate"}
                  </button>
                  <button
                    onClick={() => void remove(o.id)}
                    aria-label={`Delete ${o.title}`}
                    className="rounded-[4px] border border-border p-2 text-ink-muted transition-colors hover:border-brand hover:text-brand"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {o.applies_to_whole_menu ? (
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-[11px] font-extrabold text-brand">
                    Whole menu
                  </span>
                ) : (
                  o.items.map((i) => (
                    <span
                      key={i.id_product}
                      className="inline-flex items-center gap-1.5 rounded-full bg-cream-3 py-1 pl-1 pr-3 text-[11px] font-semibold text-ink-secondary"
                    >
                      <img
                        src={i.image ?? THUMB_FALLBACK}
                        alt=""
                        width={22}
                        height={22}
                        loading="lazy"
                        className="h-[22px] w-[22px] rounded-full border border-border object-cover"
                      />
                      {i.quantity}x {i.name}
                    </span>
                  ))
                )}
              </div>

              <div className="mt-4 flex items-center gap-6 border-t border-border pt-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
                    Price
                  </p>
                  <p className="text-lg font-extrabold text-ink">
                    {o.price ? `$${Number(o.price).toFixed(2)}` : "\u2014"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
                    Discount
                  </p>
                  <p className="text-lg font-extrabold text-brand">
                    {o.discount_percent ? `-${Number(o.discount_percent)}%` : "\u2014"}
                  </p>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
