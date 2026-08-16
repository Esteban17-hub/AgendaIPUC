-- ====================================================================
-- ESQUEMA DEFINITIVO PARA DEBORITA GESTIÓN LOCAL (SUPABASE)
-- Ejecuta este script completo en el SQL Editor de tu Supabase
-- ====================================================================

-- 1. DESACTIVAR RLS (ROW LEVEL SECURITY) EN TODAS LAS TABLAS
-- Esto permite que la aplicación web (rol anon) pueda leer y escribir libremente
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.congregations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.committees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tithes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offerings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.votes DISABLE ROW LEVEL SECURITY;

-- 2. AGREGAR COLUMNAS FALTANTES A TABLAS EXISTENTES
ALTER TABLE IF EXISTS public.committees ADD COLUMN IF NOT EXISTS "isOfferingOnly" BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.committees ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT;
ALTER TABLE IF EXISTS public.movements ADD COLUMN IF NOT EXISTS "annulReason" TEXT;
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS "targetAmount" NUMERIC;
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS "totalRaised" NUMERIC DEFAULT 0;

-- 3. CREAR TABLAS SI NO EXISTEN CON ESTRUCTURA EXACTA
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  "congregationId" TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'TESORERO', 'VISITA')),
  pin TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL
);
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.congregations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT
);
ALTER TABLE public.congregations DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.committees (
  id TEXT PRIMARY KEY,
  "congregationId" TEXT NOT NULL,
  name TEXT NOT NULL,
  treasurer TEXT,
  balance NUMERIC DEFAULT 0,
  "isOfferingOnly" BOOLEAN DEFAULT false,
  "updatedAt" BIGINT
);
ALTER TABLE public.committees DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.movements (
  id TEXT PRIMARY KEY,
  "congregationId" TEXT NOT NULL,
  "committeeId" TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  annulled BOOLEAN DEFAULT false,
  "annulReason" TEXT,
  "createdAt" BIGINT NOT NULL
);
ALTER TABLE public.movements DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tithes (
  id TEXT PRIMARY KEY,
  "congregationId" TEXT NOT NULL,
  date TEXT,
  month TEXT,
  year INTEGER,
  "grossIncome" NUMERIC,
  "nationalPercentage" NUMERIC,
  "nationalShare" NUMERIC,
  "localShare" NUMERIC,
  "pastorTithe" NUMERIC,
  "pastorTithePercentage" NUMERIC,
  "netIncome" NUMERIC,
  "pastorAllocation" NUMERIC,
  "pastorAllocationPercentage" NUMERIC,
  "balanceGroup" TEXT,
  archived BOOLEAN DEFAULT false,
  "createdAt" BIGINT NOT NULL
);
ALTER TABLE public.tithes DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.offerings (
  id TEXT PRIMARY KEY,
  "congregationId" TEXT NOT NULL,
  "destinationCommitteeId" TEXT,
  type TEXT,
  amount NUMERIC NOT NULL,
  description TEXT,
  date TEXT,
  "createdAt" BIGINT NOT NULL
);
ALTER TABLE public.offerings DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  "congregationId" TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  "targetAmount" NUMERIC,
  "totalRaised" NUMERIC DEFAULT 0,
  status TEXT,
  "createdAt" BIGINT NOT NULL
);
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.votes (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "voterName" TEXT,
  amount NUMERIC NOT NULL,
  date TEXT,
  "createdAt" BIGINT NOT NULL
);
ALTER TABLE public.votes DISABLE ROW LEVEL SECURITY;

-- 4. HABILITAR PUBLICACIÓN REALTIME PARA CAMBIOS EN TIEMPO REAL
ALTER PUBLICATION supabase_realtime ADD TABLE public.congregations, public.users, public.committees, public.projects, public.tithes, public.offerings, public.movements, public.votes;
