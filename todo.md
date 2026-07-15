# Trimilix MVP — Todo

## Fase 1: Fundamenten
- [x] Gebruikersauthenticatie (Manus OAuth)
- [x] Persoonlijk Dashboard™
- [x] Database-schema voor portefeuilles, ETF's, gebruikersdata
- [ ] Onboarding-flow

## Fase 2: Kernfuncties
- [x] ETF Check™ (ETF-analyse en screening)
- [x] Portfolio Checker™ (portefeuille-analyse)
- [x] Compounding Simulator™ (rendementsberekening)
- [x] Doelplanner™ (financiële doelen)

## Fase 3: Premium & Betalingen
- [ ] Stripe-integratie
- [ ] Premium-abonnement (checkout)

## Fase 4: Engineering Standaarden & Verfijning
- [x] **Fix:** `dotenv` module not found error in server logs.
- [x] **ETF Check™:** Gebruikt geseede ETF-data via tRPC + ETF-schema/API, inclusief loading/error/empty states en echte portefeuille-toevoeging (mocked).
- [x] **Verifieer ETF Seeding:** Controleer of de `etfs` tabel daadwerkelijk gevuld is met de geseede data via een tRPC-call of directe DB-query.
- [x] **ETF Check™ Empty State:** Voeg een expliciete empty state toe voor ETF-zoekresultaten wanneer geen ETFs gevonden worden of de catalogus leeg is.
- [ ] **Portfolio Checker™:** Bouw op basis van echte portefeuille- en holdingsdata, met berekende diversificatie/risico-analyse vanuit backendlogica en correcte state handling.
- [ ] **Compounding Simulator™:** Verplaats de compounding-berekening naar goed geteste kernlogica of voeg ten minste unit-tests en invoervalidatie/error handling toe.
- [ ] **Doelplanner™:** Koppel aan echte goals-data via tRPC + database (lijst, aanmaken, verwijderen/bijwerken) in plaats van `mockGoals` en lokale-only state.
- [ ] **Doelplanner™:** Voeg loading/error/empty states en invoervalidatie toe voor de Doelplanner™-flow, en gebruik de bestaande goals-tabel daadwerkelijk in procedures/queries.
- [x] **Database Seeding:** Vul de `etfs` tabel met een beperkte set populaire ETF's. (Geverifieerd: 5 ETF's geseed)
- [ ] **Beveiliging:** Implementeer inputvalidatie met Zod voor alle tRPC-procedures.
- [ ] **Code Kwaliteit:** Zorg voor unit tests voor alle kritieke bedrijfslogica (bijv. compounding berekeningen).
- [ ] **Architectuur:** Documenteer de architectuur in `/docs/architecture.md` (gebruik Mermaid of D2).
- [ ] **Observability:** Implementeer gestructureerde logging voor backend-acties.
- [ ] **Data Integriteit:** Zorg voor transacties en idempotentie voor financiële operaties.

## Fase 5: Verdere Ontwikkeling
- [ ] Academy-content
- [ ] Broker Match™
- [ ] Fiscale Module™

## Fase 6: Testen & Oplevering
- [ ] Uitgebreide integratie- en E2E-tests.
- [ ] Prestatie-optimalisatie en load testing.
- [ ] Documentatie finaliseren (API, Database, Deployment).
- [ ] Release checklist doorlopen.
