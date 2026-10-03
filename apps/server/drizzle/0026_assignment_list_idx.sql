-- Hot-path index for GET /homework: the list always filters tenantId + status and
-- sorts createdAt DESC, so a composite lets Postgres walk the index in order rather
-- than seq-scanning and heap-sorting. Un-journaled like 0022-0025: apply directly.
CREATE INDEX IF NOT EXISTS "Assignment_tenantId_status_createdAt_idx"
  ON "Assignment" USING btree ("tenantId","status","createdAt");
