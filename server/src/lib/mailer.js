import nodemailer from "nodemailer";

const money = (v) => `$${Number(v).toFixed(2)}`;
const METHOD_LABEL = { DINE_IN: "dine in", TAKE_AWAY: "take away", DELIVERY: "delivery" };
const STATUS_LABEL = {
  NEW: "received",
  CONFIRMED: "confirmed",
  PREPARING: "being prepared",
  READY: "ready",
  COMPLETED: "completed",
  CANCELED: "cancelled",
};

let transporter;
let warned = false;

/**
 * Gmail transport, configured from the environment (see server/.env.example):
 *  - GMAIL_USER + GMAIL_APP_PASSWORD                      (app password)
 *  - GMAIL_USER + GMAIL_CLIENT_ID/SECRET + REFRESH_TOKEN  (Google API OAuth2)
 * Nothing configured => emails are skipped and a single warning is logged, so
 * a dev machine without credentials still takes orders.
 */
function buildTransport() {
  const user = process.env.GMAIL_USER;
  if (!user) return null;
  if (process.env.GMAIL_REFRESH_TOKEN) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      },
    });
  }
  if (process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return null;
}

export async function sendMail({ to, subject, html, text }) {
  if (!to) return false;
  if (transporter === undefined) transporter = buildTransport();
  if (!transporter) {
    if (!warned) {
      console.warn("[mail] Gmail sender not configured (see server/.env.example); emails are skipped");
      warned = true;
    }
    return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM ?? `"Ember & Bun" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return true;
  } catch (err) {
    console.error("[mail] send failed:", err.message);
    return false;
  }
}

const escape = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function itemsRows(order) {
  return (order.items ?? [])
    .map((i) => {
      const ingredients = i.ingredients ?? [];
      const removed = ingredients.filter((x) => x.action === "REMOVED").map((x) => x.name);
      const extras = ingredients
        .filter((x) => x.action === "ADDED" || x.action === "SUPPLEMENT")
        .map((x) => x.name);
      const detail = [
        removed.length ? `no ${removed.join(", ")}` : "",
        extras.length ? `+ ${extras.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" \u00b7 ");
      return `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #eee">${i.quantity}\u00d7 ${escape(i.name)}${
          detail ? `<br><span style="color:#888;font-size:12px">${escape(detail)}</span>` : ""
        }</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${money(i.total_price)}</td>
      </tr>`;
    })
    .join("");
}

function whereLine(order) {
  if (order.method_of_sale === "DELIVERY") return `Delivery to: ${escape(order.delivery_address ?? "")}`;
  if (order.method_of_sale === "DINE_IN") {
    return order.table_number ? `Dine in \u00b7 table ${order.table_number}` : "Dine in";
  }
  return "Take away \u00b7 pick up at the counter";
}

function layout(title, intro, order, extra = "") {
  return `<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#171717">
    <div style="background:#a80d25;color:#fffdf8;padding:18px 22px;border-radius:8px 8px 0 0">
      <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;opacity:.8">Ember &amp; Bun</div>
      <h1 style="margin:6px 0 0;font-size:20px">${escape(title)}</h1>
    </div>
    <div style="border:1px solid #eadfd0;border-top:0;padding:20px 22px;border-radius:0 0 8px 8px;background:#fffdf8">
      <p style="margin:0 0 12px">${intro}</p>
      <p style="margin:0 0 12px;font-family:ui-monospace,monospace;font-size:12px;color:#8a7f74">#${escape(order.order_number)}</p>
      <p style="margin:0 0 16px;font-size:13px;color:#4a423b">${whereLine(order)}<br>Payment: ${escape(
        order.payment_method_name,
      )} \u00b7 ${escape(order.payment_status)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${itemsRows(order)}
        <tr>
          <td style="padding:10px 0;font-weight:800">Total</td>
          <td style="padding:10px 0;text-align:right;font-weight:800">${money(order.total)}</td>
        </tr>
      </table>
      ${extra}
      <p style="margin:18px 0 0;font-size:12px;color:#8a7f74">Follow your order live from "My orders" on the website.</p>
    </div>
  </div>`;
}

export function sendOrderPlacedEmail(order) {
  const hi = order.customer_name ? `Hi ${escape(order.customer_name)}, ` : "";
  return sendMail({
    to: order.customer_email,
    subject: `Order #${order.order_number} received \u00b7 ${money(order.total)}`,
    html: layout(
      "We've got your order!",
      `${hi}thanks for ordering. The kitchen has your ${METHOD_LABEL[order.method_of_sale] ?? ""} order and will confirm it in a moment.`,
      order,
    ),
    text: `Order #${order.order_number} received. Total ${money(order.total)}.`,
  });
}

export function sendOrderStatusEmail(order) {
  const label = STATUS_LABEL[order.order_status] ?? String(order.order_status).toLowerCase();
  return sendMail({
    to: order.customer_email,
    subject: `Order #${order.order_number} is ${label}`,
    html: layout(
      `Your order is ${label}`,
      `Good news: order <b>#${escape(order.order_number)}</b> is now <b>${label}</b>.`,
      order,
    ),
    text: `Order #${order.order_number} is now ${label}.`,
  });
}

export function sendOrderCanceledEmail(order) {
  const reason = order.cancel_reason
    ? `<p style="margin:14px 0 0;padding:10px 12px;border-radius:6px;background:#f6ecec;color:#a80d25;font-size:13px"><b>Reason:</b> ${escape(
        order.cancel_reason,
      )}</p>`
    : "";
  const refund =
    order.payment_status === "REFUNDED"
      ? `<p style="margin:10px 0 0;font-size:13px;color:#4a423b">The amount has been refunded to your account balance.</p>`
      : "";
  return sendMail({
    to: order.customer_email,
    subject: `Order #${order.order_number} was cancelled`,
    html: layout(
      "Your order was cancelled",
      `We're sorry, order <b>#${escape(order.order_number)}</b> has been cancelled.`,
      order,
      reason + refund,
    ),
    text: `Order #${order.order_number} was cancelled.${
      order.cancel_reason ? ` Reason: ${order.cancel_reason}` : ""
    }`,
  });
}
