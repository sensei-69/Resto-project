/** Shared order types and helpers used by the cart, the customer dashboard and the admin board. */

export type OrderStatus = "NEW" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type IngredientAction = "NORMAL" | "REMOVED" | "ADDED" | "SUPPLEMENT";
export type SaleMethod = "DINE_IN" | "TAKE_AWAY" | "DELIVERY";
export type Tone = "brand" | "success" | "neutral" | "muted";

export type OrderItemIngredient = {
  id_ingredient: number;
  name: string;
  action: IngredientAction;
  price: string | number;
};

export type OrderItem = {
  id: number;
  id_product: number | null;
  id_offer: number | null;
  name: string;
  image: string | null;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
  ingredients: OrderItemIngredient[];
};

export type Order = {
  id: number;
  order_number: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  total: string | number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  id_customer: number | null;
  id_table: number | null;
  id_delivery_person: number | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  delivery_person_name: string | null;
  table_number: number | null;
  method_of_sale: SaleMethod;
  method_of_sale_name: string;
  payment_method: string;
  payment_method_name: string;
  items: OrderItem[];
};

export type CheckoutOptions = {
  methods_of_sale: { id: number; code: SaleMethod; name: string; description: string | null }[];
  payment_methods: { id: number; code: string; name: string; description: string | null }[];
  rules: { method_of_sale: SaleMethod; payment_method: string }[];
  riders: { id: number; name: string }[];
  tables: { id: number; table_number: number; capacity: number }[];
};

export const ORDER_STATUSES: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELED",
];
export const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

/** The happy path an order walks through (CANCELED is off-path). */
export const ORDER_STEPS: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING", "READY", "COMPLETED"];
export const ACTIVE_STATUSES: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING", "READY"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "Received",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELED: "Cancelled",
};

export const STATUS_TONE: Record<OrderStatus, Tone> = {
  NEW: "brand",
  CONFIRMED: "neutral",
  PREPARING: "neutral",
  READY: "success",
  COMPLETED: "success",
  CANCELED: "muted",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const PAYMENT_TONE: Record<PaymentStatus, Tone> = {
  PENDING: "neutral",
  PAID: "success",
  FAILED: "brand",
  REFUNDED: "muted",
};

export const METHOD_LABEL: Record<SaleMethod, string> = {
  DINE_IN: "Dine in",
  TAKE_AWAY: "Take away",
  DELIVERY: "Delivery",
};

export const isActiveOrder = (order: Pick<Order, "order_status">) =>
  ACTIVE_STATUSES.includes(order.order_status);

export const money = (value: string | number) => `$${Number(value).toFixed(2)}`;

/** Next step on the happy path, or null when the order is finished / cancelled. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = ORDER_STEPS.indexOf(status);
  if (i < 0 || i >= ORDER_STEPS.length - 1) return null;
  return ORDER_STEPS[i + 1] ?? null;
}

/** Channel-aware wording: "On the way" for delivery, "Picked up" for take away, etc. */
export function stepLabel(order: Pick<Order, "method_of_sale">, step: OrderStatus): string {
  if (step === "READY") {
    if (order.method_of_sale === "DELIVERY") return "On the way";
    if (order.method_of_sale === "TAKE_AWAY") return "Ready";
    return "Ready";
  }
  if (step === "COMPLETED") {
    if (order.method_of_sale === "DELIVERY") return "Delivered";
    if (order.method_of_sale === "TAKE_AWAY") return "Picked up";
    return "Served";
  }
  return STATUS_LABEL[step];
}

export const statusLabel = (order: Pick<Order, "method_of_sale" | "order_status">) =>
  stepLabel(order, order.order_status);

/** One-line explanation of where the order is, shown to the customer. */
export function statusHint(order: Order): string {
  const m = order.method_of_sale;
  switch (order.order_status) {
    case "NEW":
      return "We've received your order. The kitchen will confirm it in a moment.";
    case "CONFIRMED":
      return "Confirmed! Your order is queued in the kitchen.";
    case "PREPARING":
      return "The kitchen is cooking your order right now.";
    case "READY":
      if (m === "DELIVERY") {
        return order.delivery_person_name
          ? `${order.delivery_person_name} is on the way with your order.`
          : "Your order is packed and waiting for a rider.";
      }
      if (m === "TAKE_AWAY") return "Your order is ready. Come pick it up at the counter.";
      return order.table_number
        ? `Your order is ready and heading to table ${order.table_number}.`
        : "Your order is ready and heading to your table.";
    case "COMPLETED":
      return m === "DELIVERY" ? "Delivered. Enjoy your meal!" : "Done. Enjoy your meal!";
    case "CANCELED":
      return "This order was cancelled.";
    default:
      return "";
  }
}

export const itemsSummary = (order: Order) =>
  order.items.map((i) => `${i.quantity}\u00d7 ${i.name}`).join(", ");
