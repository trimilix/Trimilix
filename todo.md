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
- [x] **Portfolio Checker™:** Gebruikt echte portefeuille- en holdingsdata via tRPC.
- [ ] **Portfolio Checker™ Backend Logica:** Verplaats risico-, spreidings- en aanbevelingsberekeningen naar backendprocedures op basis van echte holdings/ETF-data (gedeeltelijk geïmplementeerd met mock data, `analyzePortfolio` duplicaatfout).
- [x] **Portfolio Checker™ Frontend State:** Voeg loading-, error- en empty-state handling toe voor het laden van een geselecteerde portefeuille (`selectedPortfolio`).
- [ ] **Portfolio Checker™ Backend Logica:** Vervang mock `riskProfile` door echte backend-berekening op basis van holdings/ETF-kenmerken (nog steeds met placeholder `riskScore` en vereenvoudigde berekening).
- [ ] **Portfolio Checker™ Backend Logica:** Vul de `etfs` seed-data met echte `riskScore`-waarden en documenteer de risicomethodiek per ETF (documentatie ontbreekt).
- [ ] **Portfolio Checker™ Backend Logica:** Documenteer in `ENGINEERING_HANDBOOK.md` of aparte docs hoe `riskScore` per ETF wordt bepaald, inclusief schaal, criteria en voorbeelden voor de geseede ETF’s.
- [ ] **Portfolio Checker™ Backend Logica:** Onderbouw of valideer de geseede `riskScore`-waarden met een expliciete bron/methodiek in seed-data comments of documentatie.
- [ ] **Portfolio Checker™ Backend Logica:** Vervang de placeholder `|| 3`-fallback door een echte, data-gedreven risicobepaling of expliciete validatiefout wanneer risicodata ontbreekt.
- [x] **Portfolio Checker™ Backend Logica:** Los de huidige dev-server fout met dubbele export van `analyzePortfolio` in `server/db.ts` op voordat verdere portfolio-logica als afgerond wordt gemarkeerd.
- [ ] **Portfolio Checker™ Backend Logica:** Genereer aanbevelingen dynamisch vanuit analysemethoden en echte portefeuilledata in plaats van hardcoded teksten.
- [ ] **Portfolio Checker™ Backend Logica:** Voeg tests toe voor `analyzePortfolio` zodat risico-, spreidings- en aanbevelingsuitkomsten verifieerbaar zijn.
- [ ] **Portfolio Checker™ Dynamische UI:** Verwijder hardcoded analyseblokken en vervang deze door dynamische, data-gedreven output uit tRPC/backendlogica.
- [ ] **Compounding Simulator™:** Verplaats de compounding-berekening naar goed geteste kernlogica of voeg ten minste unit-tests en invoervalidatie/error handling toe.
- [ ] **Doelplanner™:** Koppel aan echte goals-data via tRPC + database (lijst, aanmaken, verwijderen/bijwerken) in plaats van `mockGoals` en lokale-only state.
- [ ] **Doelplanner™:** Voeg loading/error/empty states en invoervalidatie toe voor de Doelplanner™-flow, en gebruik de bestaande goals-tabel daadwerkelijk in procedures/queries.
- [x] **Database Seeding:** Vul de `etfs` tabel met een beperkte set populaire ETF's. (Geverifieerd: 5 ETF's geseed)
- [x] **Beveiliging:** Implementeer inputvalidatie met Zod voor alle tRPC-procedures (voor procedures met input). Procedures zonder input vereisen geen Zod-validatie. (Geverifieerd)
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

- [x] **Portfolio Checker™ Backend Logica:** Herstart de dev-server na de laatste `server/db.ts`-wijzigingen en verifieer expliciet dat `analyzePortfolio` correct uit `./db` wordt geëxporteerd zonder runtime import/export-fouten.
- [x] **Portfolio Checker™ Backend Logica:** Run een schone typecheck/start-validatie voor portfolio-routes en leg vast dat de `portfolio.analyze` procedure zonder serverfouten laadt.
- [x] Vergelijk alternatieve marktdata-aanbieders voor actuele en real-time aandelen- en ETF-koersen, inclusief Europese dekking, WebSockets, limieten, commerciële weergaverechten en prijs.
- [x] Formuleer een MVP-aanbeveling en groeipad waarbij real-time koersen later enkel voor betalende gebruikers worden geactiveerd.
