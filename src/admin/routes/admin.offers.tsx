import { useState } from "react";
import { Gift, Percent, Plus, Tag, Trash2 } from "lucide-react";
import { PageHeader, Panel, Pill } from "../components/dashboard/shell";
import { menuItems, offers as seedOffers, type Offer } from "../lib/dashboard-data";

export default function AdminOffers() {
  const [offers, setOffers] = useState<Offer[]>(seedOffers);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Offer["type"]>("Pack");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("15");
  const [window, setWindow] = useState("All week");
  const [picked, setPicked] = useState<string[]>([]);

  const togglePick = (name: string) =>
    setPicked((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  const create = () => {
    if (!title.trim()) return;
    setOffers((prev) => [
      {
        id: `o${Date.now()}`,
        title: title.trim(),
        type,
        price: Number(price) || 0,
        discount: Number(discount) || 0,
        items: picked.length ? picked : ["Whole menu"],
        active: true,
        window,
      },
      ...prev,
    ]);
    setTitle("");
    setPrice("");
    setPicked([]);
  };

  const toggleActive = (id: string) =>
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, active: !o.active } : o)));
  const remove = (id: string) => setOffers((prev) => prev.filter((o) => o.id !== id));

  return (
    <>
      <PageHeader
        eyebrow="Marketing"
        title="Offers & packs"
        description="Build new combos, seasonal packs and happy-hour discounts, then switch them live in one click."
      />

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
                {(["Pack", "Discount", "Happy Hour"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-[3px] px-2 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-colors ${
                      type === t ? "bg-brand text-cream-1" : "text-ink-muted hover:bg-cream-2"
                    }`}
                  >
                    {t}
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
                value={window}
                onChange={(e) => setWindow(e.target.value)}
                className="login-field !pl-3"
              />
            </Field>

            <Field label="Items included">
              <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-[4px] border border-border bg-cream-2/50 p-2">
                {menuItems.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-[3px] bg-cream-1 px-2.5 py-2 text-sm text-ink-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={picked.includes(m.name)}
                      onChange={() => togglePick(m.name)}
                      className="h-4 w-4 accent-[var(--brand)]"
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            </Field>

            <button onClick={create} className="login-cta">
              <span className="inline-flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" /> Create offer
              </span>
            </button>
          </div>
        </Panel>

        <div className="space-y-4 xl:col-span-3">
          {offers.map((o) => (
            <Panel key={o.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {o.type === "Pack" ? (
                      <Gift className="h-4 w-4 text-brand" />
                    ) : o.type === "Discount" ? (
                      <Percent className="h-4 w-4 text-brand" />
                    ) : (
                      <Tag className="h-4 w-4 text-brand" />
                    )}
                    <h3 className="text-base font-extrabold text-ink">{o.title}</h3>
                  </div>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                    {o.type} · {o.window}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={o.active ? "success" : "muted"}>{o.active ? "Live" : "Paused"}</Pill>
                  <button
                    onClick={() => toggleActive(o.id)}
                    className="rounded-[4px] border border-border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-secondary transition-colors hover:border-brand hover:text-brand"
                  >
                    {o.active ? "Pause" : "Activate"}
                  </button>
                  <button
                    onClick={() => remove(o.id)}
                    aria-label={`Delete ${o.title}`}
                    className="rounded-[4px] border border-border p-2 text-ink-muted transition-colors hover:border-brand hover:text-brand"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {o.items.map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-cream-3 px-3 py-1 text-[11px] font-semibold text-ink-secondary"
                  >
                    {i}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-6 border-t border-border pt-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
                    Price
                  </p>
                  <p className="text-lg font-extrabold text-ink">
                    {o.price ? `$${o.price.toFixed(2)}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
                    Discount
                  </p>
                  <p className="text-lg font-extrabold text-brand">-{o.discount}%</p>
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
