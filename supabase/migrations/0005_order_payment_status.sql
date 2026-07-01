-- ============================================================================
-- Migration 0005 — Bestellprozess: Platzhalter payment_status
-- ============================================================================
-- Phase 3 (Bestellprozess): Aufträge erhalten ein Zahlungs-Statusfeld als
-- Platzhalter. Es wird für den MVP NICHT für echte Zahlungen genutzt – die
-- Bestellung wird nur angefragt (Default 'unpaid'). Ermöglicht späteren Checkout.
--
-- Idempotent: kann gefahrlos mehrfach ausgeführt werden.
-- ============================================================================

alter table public.orders
  add column if not exists payment_status text not null default 'unpaid';

alter table public.orders
  drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('unpaid', 'pending', 'paid'));

-- ============================================================================
-- Ende der Migration 0005
-- ============================================================================
