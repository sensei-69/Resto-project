import "dotenv/config";
import express from "express";
import cors from "cors";
import { ensureSchema } from "./db.js";
import authRoutes from "./routes/auth.js";
import ticketRoutes from "./routes/tickets.js";
import catalogRoutes from "./routes/catalog.js";
import offerRoutes from "./routes/offers.js";
import orderRoutes from "./routes/orders.js";
import userRoutes from "./routes/users.js";
import analyticsRoutes from "./routes/analytics.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
// Dish images are sent as base64 data URLs; the 100kb default rejects them
// with "request entity too large".
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT ?? 3001);

// Apply additive schema patches before serving so an existing database keeps
// working after a pull without a manual migration step.
ensureSchema()
  .catch((err) => console.error("Schema check failed:", err.message))
  .finally(() => {
    app.listen(port, () => {
      console.log(`Ember & Bun API listening on http://localhost:${port}`);
    });
  });
