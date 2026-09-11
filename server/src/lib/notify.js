import { query } from "../db.js";

/**
 * Store an in-app notification. `audience` USER targets one user (idUser),
 * ADMIN goes to the shared Owner / Super Admin feed (idUser stays null).
 */
export async function notify({ idUser = null, audience = "USER", type, title, body = null, idOrder = null }) {
  const { rows } = await query(
    `INSERT INTO notification (id_user, audience, type, title, body, id_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [idUser, audience, type, title, body, idOrder],
  );
  return rows[0];
}

export const notifyAdmins = (n) => notify({ ...n, idUser: null, audience: "ADMIN" });

/** No-op for guest orders (no customer id). */
export const notifyUser = (idUser, n) =>
  idUser ? notify({ ...n, idUser, audience: "USER" }) : Promise.resolve(null);
