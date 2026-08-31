/** Build a partial UPDATE statement from a whitelist of updatable fields. */
export function buildUpdate(table, id, body, fields) {
  const sets = [];
  const values = [];
  for (const field of fields) {
    if (body[field] !== undefined) {
      values.push(body[field]);
      sets.push(`${field} = $${values.length}`);
    }
  }
  if (!sets.length) return null;
  values.push(id);
  return {
    text: `UPDATE ${table} SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values,
  };
}

/** Error carrying an HTTP status, honored by the global error handler. */
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
