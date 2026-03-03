-- ============================================================
-- SECURITY FIX: Enable RLS on all Prisma-managed tables
-- ============================================================
-- Fecha: 2026-03-03
-- Problema: 8 tablas expuestas via PostgREST sin RLS
-- Solucion: Habilitar RLS sin politicas publicas.
--           Prisma (usuario postgres) bypasea RLS automaticamente.
--           PostgREST (anon/authenticated) queda bloqueado.
-- ============================================================

-- 1. User (CRITICAL: expone columna password)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- 2. Project
ALTER TABLE public."Project" ENABLE ROW LEVEL SECURITY;

-- 3. BrandIdentity
ALTER TABLE public."BrandIdentity" ENABLE ROW LEVEL SECURITY;

-- 4. Lead
ALTER TABLE public."Lead" ENABLE ROW LEVEL SECURITY;

-- 5. Membership
ALTER TABLE public."Membership" ENABLE ROW LEVEL SECURITY;

-- 6. StrategyHistory
ALTER TABLE public."StrategyHistory" ENABLE ROW LEVEL SECURITY;

-- 7. Plan
ALTER TABLE public."Plan" ENABLE ROW LEVEL SECURITY;

-- 8. License
ALTER TABLE public."License" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Politica: Solo service_role puede acceder (para admin tools)
-- El backend Prisma usa conexion directa como postgres (bypasea RLS)
-- Esta politica es un safety net para operaciones via Supabase client
-- ============================================================

-- User: solo service_role
CREATE POLICY "service_role_full_access_user"
  ON public."User"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Project: solo service_role
CREATE POLICY "service_role_full_access_project"
  ON public."Project"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- BrandIdentity: solo service_role
CREATE POLICY "service_role_full_access_brand_identity"
  ON public."BrandIdentity"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Lead: solo service_role
CREATE POLICY "service_role_full_access_lead"
  ON public."Lead"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Membership: solo service_role
CREATE POLICY "service_role_full_access_membership"
  ON public."Membership"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- StrategyHistory: solo service_role
CREATE POLICY "service_role_full_access_strategy_history"
  ON public."StrategyHistory"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Plan: solo service_role
CREATE POLICY "service_role_full_access_plan"
  ON public."Plan"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- License: solo service_role
CREATE POLICY "service_role_full_access_license"
  ON public."License"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- VERIFICACION: Ejecuta esto despues para confirmar que RLS esta activo
-- ============================================================
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('User','Project','BrandIdentity','Lead','Membership','StrategyHistory','Plan','License');
