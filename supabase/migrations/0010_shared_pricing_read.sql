-- ============================================================================
-- 0010 — Eine Preislogik: Kunden lesen die Herstellerkalkulationsdaten
-- ============================================================================
-- Die Kundenpreis-Schätzung basiert ab jetzt AUSSCHLIESSLICH auf der echten
-- Herstellerkalkulation (gleiche Engine, gleiche Daten). Dafür müssen eingeloggte
-- Nutzer die Preisparameter und aktiven Materialien der Hersteller LESEN dürfen.
--
-- Schreibzugriff bleibt unverändert strikt auf den Eigentümer beschränkt – nur
-- SELECT wird für authentifizierte Nutzer geöffnet. (MVP-Kompromiss: Für ein
-- späteres Produkt sollte die Berechnung serverseitig via RPC/Edge-Function
-- laufen und nur die Preisspanne zurückgeben, damit Marge/Stundensatz privat
-- bleiben. Die Berechnungslogik liegt bereits gekapselt in src/lib/pricing.ts +
-- src/lib/estimate.ts – nur die Datenquelle müsste getauscht werden.)
-- ============================================================================

drop policy if exists "manufacturer_pricing: authenticated read" on public.manufacturer_pricing;
create policy "manufacturer_pricing: authenticated read"
  on public.manufacturer_pricing for select
  using (auth.uid() is not null);

drop policy if exists "manufacturer_materials: authenticated read" on public.manufacturer_materials;
create policy "manufacturer_materials: authenticated read"
  on public.manufacturer_materials for select
  using (auth.uid() is not null);
