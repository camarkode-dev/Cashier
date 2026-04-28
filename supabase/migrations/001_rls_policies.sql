-- ============================================================
-- Kasher POS — Row Level Security Policies
-- Run this in Supabase SQL editor ONCE after first migration.
-- ============================================================
--
-- Architecture note:
--   • Prisma (API routes) connects via DATABASE_URL using the
--     postgres superuser → bypasses RLS → this is intentional.
--     Our API routes ARE the security boundary.
--   • These policies block anyone who accesses Supabase tables
--     directly (REST/realtime) using the anon or authenticated key.
-- ============================================================

-- ─── Enable RLS on every table ──────────────────────────────

ALTER TABLE "User"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Branch"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventory"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SaleItem"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockTransfer"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockTransferItem"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier"           ENABLE ROW LEVEL SECURITY;

-- ─── User table ─────────────────────────────────────────────
-- Each user can only read/update their own row via direct client access.
-- API routes (service role) bypass this entirely.

CREATE POLICY "user_read_own"
  ON "User" FOR SELECT
  USING (id = auth.uid()::text);

CREATE POLICY "user_update_own"
  ON "User" FOR UPDATE
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- Block direct inserts/deletes from client (only API can do this)
CREATE POLICY "user_no_client_insert"
  ON "User" FOR INSERT
  WITH CHECK (false);

CREATE POLICY "user_no_client_delete"
  ON "User" FOR DELETE
  USING (false);

-- ─── Notifications: user sees own + global ───────────────────

CREATE POLICY "notification_read"
  ON "Notification" FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND ("userId" IS NULL OR "userId" = auth.uid()::text)
  );

-- Block direct writes to notifications from browser
CREATE POLICY "notification_no_client_write"
  ON "Notification" FOR INSERT
  WITH CHECK (false);

CREATE POLICY "notification_no_client_update"
  ON "Notification" FOR UPDATE
  USING (false);

CREATE POLICY "notification_no_client_delete"
  ON "Notification" FOR DELETE
  USING (false);

-- ─── All other tables: read-only for authenticated users ────
-- Mutations blocked — all writes go through API routes (service role).

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'Branch', 'Category', 'Product', 'Inventory',
    'Customer', 'Sale', 'SaleItem',
    'StockTransfer', 'StockTransferItem',
    'Expense', 'Supplier'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY "auth_read_%s" ON "%s" FOR SELECT USING (auth.uid() IS NOT NULL)',
      lower(tbl), tbl
    );
    EXECUTE format(
      'CREATE POLICY "no_client_insert_%s" ON "%s" FOR INSERT WITH CHECK (false)',
      lower(tbl), tbl
    );
    EXECUTE format(
      'CREATE POLICY "no_client_update_%s" ON "%s" FOR UPDATE USING (false)',
      lower(tbl), tbl
    );
    EXECUTE format(
      'CREATE POLICY "no_client_delete_%s" ON "%s" FOR DELETE USING (false)',
      lower(tbl), tbl
    );
  END LOOP;
END;
$$;

-- ─── AuditLog: no direct client access at all ───────────────
-- Audit logs are sensitive — only readable via service role.

CREATE POLICY "auditlog_deny_all"
  ON "AuditLog" FOR ALL
  USING (false);

-- ============================================================
-- Verify: run this to see all policies
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies WHERE schemaname = 'public';
-- ============================================================
