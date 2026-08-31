import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const adminOnly = [requireAuth, requireRole("OWNER", "SUPER_ADMIN")];

/**
 * GET /api/analytics?range=day|month|year
 *
 * Returns:
 *   series   – [{label, orders, revenue}]  (7 days / 12 months / 5 years)
 *   topFoods – [{name, orders, revenue, share}]  top 5 products
 *   feedback – [{name, rating, text, time}]  last 6 tickets with a rating
 *              (we use support_ticket.subject as a proxy; real ratings TBD)
 *   totals   – {orders, revenue, profit, avgBasket}
 */
router.get("/", ...adminOnly, async (req, res, next) => {
  try {
    const range = ["day", "month", "year"].includes(req.query.range)
      ? req.query.range
      : "month";

    // ── Series ────────────────────────────────────────────────────────────
    let seriesRows;
    if (range === "day") {
      // Last 7 days
      const { rows } = await query(`
        SELECT
          TO_CHAR(DATE_TRUNC('day', created_at), 'Dy') AS label,
          COUNT(*)::int                                  AS orders,
          COALESCE(SUM(total), 0)::float                AS revenue
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '7 days'
          AND order_status NOT IN ('CANCELED')
        GROUP BY DATE_TRUNC('day', created_at), label
        ORDER BY DATE_TRUNC('day', created_at)
      `);
      seriesRows = rows;
    } else if (range === "month") {
      // Last 12 months
      const { rows } = await query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS label,
          COUNT(*)::int                                     AS orders,
          COALESCE(SUM(total), 0)::float                   AS revenue
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '12 months'
          AND order_status NOT IN ('CANCELED')
        GROUP BY DATE_TRUNC('month', created_at), label
        ORDER BY DATE_TRUNC('month', created_at)
      `);
      seriesRows = rows;
    } else {
      // Last 5 years
      const { rows } = await query(`
        SELECT
          TO_CHAR(DATE_TRUNC('year', created_at), 'YYYY') AS label,
          COUNT(*)::int                                     AS orders,
          COALESCE(SUM(total), 0)::float                   AS revenue
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '5 years'
          AND order_status NOT IN ('CANCELED')
        GROUP BY DATE_TRUNC('year', created_at), label
        ORDER BY DATE_TRUNC('year', created_at)
      `);
      seriesRows = rows;
    }

    // ── Top foods ─────────────────────────────────────────────────────────
    const { rows: foodRows } = await query(`
      SELECT
        p.name,
        SUM(oi.quantity)::int          AS orders,
        COALESCE(SUM(oi.total_price), 0)::float AS revenue
      FROM order_item oi
      JOIN product p ON p.id = oi.id_product
      JOIN orders o  ON o.id = oi.id_order
      WHERE o.order_status NOT IN ('CANCELED')
      GROUP BY p.id, p.name
      ORDER BY orders DESC
      LIMIT 5
    `);
    const maxOrders = foodRows[0]?.orders ?? 1;
    const topFoods = foodRows.map((r) => ({
      ...r,
      share: Math.round((r.orders / maxOrders) * 100),
    }));

    // ── Recent feedback (support tickets as proxy) ─────────────────────
    const { rows: ticketRows } = await query(`
      SELECT
        u.name,
        t.subject,
        t.message AS text,
        t.created_at
      FROM support_ticket t
      JOIN users u ON u.id = t.id_user
      ORDER BY t.created_at DESC
      LIMIT 6
    `);
    const feedback = ticketRows.map((r) => ({
      name: r.name,
      rating: 4, // placeholder until a ratings table exists
      text: r.text,
      time: timeAgo(r.created_at),
    }));

    // ── Totals ────────────────────────────────────────────────────────────
    const totalOrders = seriesRows.reduce((a, b) => a + b.orders, 0);
    const totalRevenue = seriesRows.reduce((a, b) => a + b.revenue, 0);

    return res.json({
      series: seriesRows,
      topFoods,
      feedback,
      totals: {
        orders: totalOrders,
        revenue: totalRevenue,
        profit: totalRevenue * 0.31,
        avgBasket: totalOrders ? totalRevenue / totalOrders : 0,
      },
    });
  } catch (err) {
    return next(err);
  }
});

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default router;
