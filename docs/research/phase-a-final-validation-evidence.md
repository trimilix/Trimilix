# Fase A — finale validatiebewijzen

**Datum:** 16 juli 2026  
**Scope:** lokale releasegate, live read-only schema/journal, geïsoleerde herstelrehearsal, schone runtime, begrensde lokale healthbaseline en desktop/mobiele visuele regressie.

## Samengestelde releasegate

Na de tijdens de visuele smoke gevonden Portfolio Checker-authgrensfix is `pnpm verify` volledig opnieuw uitgevoerd. De gate eindigde groen.

| Gate | Resultaat |
|---|---:|
| TypeScript | Geslaagd, nul typefouten |
| Vitest | 15 testbestanden, 96 tests geslaagd |
| Secret-scan | Nul high-confidence hardcoded secrets |
| OSV-productieaudit | 466 geïnstalleerde productiepackageversies gecontroleerd, nul blokkerende bevindingen |
| Ongebruikte directe dependencies | 81 directe packages gecontroleerd, nul ongebruikte packages |
| Productiebuild | Geslaagd; 2.399 modules getransformeerd |
| Initiële JavaScriptgrafiek | 647.652 raw bytes; 192.020 gzip bytes |
| Grootste async JavaScriptchunk | 398.561 raw bytes; 110.857 gzip bytes |
| Bundlebudget | Geslaagd; nul overtredingen; vijf dynamische routes |

## Migratie- en live databasebewijs

De officiële Drizzle-run eindigde geconvergeerd: `generate` produceerde geen nieuwe migratie en `migrate` was een no-op op de bestaande officiële keten `0000`–`0008`.

De finale read-only live equivalentiecontrole eindigde met `passed: true`. `tidb_enable_check_constraint` stond op `1`; de exacte negen verwachte benoemde CHECK-constraints en vier verwachte indexen waren aanwezig; er waren geen ontbrekende of onverwachte constraints en nul dataviolaties in ETF-, doel-, holding-, portefeuille- en gebruikersdata. Ook waren er nul dubbele holdings.

De afzonderlijke read-only journalcontrole bevestigde negen officiële hash-/timestamprecords voor `0000`–`0008`. De uiteindelijke ETF-contracten zijn `riskScore BETWEEN 1 AND 5` en `ter >= 0`. Omdat beide kolommen nullable blijven en SQL CHECK een `UNKNOWN`-uitkomst accepteert, is de bestaande `NULL`-semantiek niet gewijzigd.

## Geïsoleerde rollback-/restore-rehearsal

De rehearsal draaide tegen geïsoleerde TiDB-databases en raakte geen productiegegevens. Alle negen migraties zijn vanaf een lege database toegepast.

| Bewijs | Resultaat |
|---|---:|
| Verwachte tabellen | 6/6 aanwezig |
| Benoemde CHECK-constraints | 9/9 aanwezig |
| Vereiste indexen | 4/4 aanwezig |
| Ongeldige holding geweigerd | Ja |
| Dubbele holding geweigerd | Ja |
| Nullable ETF-data geaccepteerd | Ja |
| Negatieve TER geweigerd | Ja |
| Ongeldige risicoscore geweigerd | Ja |
| Atomische holding-upsert | Geslaagd |
| Transactierollback | Geslaagd |
| Restorechecksums | 6/6 tabellen exact gelijk |

De herstelde tabellen `users`, `etfs`, `portfolios`, `holdings`, `goals` en `subscriptions` hadden na restore dezelfde rijaantallen en SHA-256-checksums als de bron.

## Schone runtime en begrensde lokale baseline

Na een schone serverstart rapporteerde de database-startupgate eerst een groene capability-/constraintsetcontrole en opende de runtime daarna de luisterpoort. `/healthz` en warme `/readyz` retourneerden HTTP 200 en ieder een unieke `x-request-id`.

De lokale baseline is bewust begrensd en is **geen productiecapaciteitstest**.

| Route | Requests | Concurrency | Succes | p50 | p95 | p99 | Budget |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/healthz` | 200 | 20 | 100% | 12,68 ms | 22,87 ms | 24,65 ms | 100% succes; p95 < 100 ms |
| `/readyz` | 80 | 8 | 100% | 6,28 ms | 295,76 ms | 323,27 ms | 100% succes; p95 < 750 ms |

## Visuele regressie

Desktop- en vertraagde 390×844-captures bevestigden dat home/auth en ETF Checker volledig renderen zonder horizontale overflow. De lazy-routefallback verscheen alleen in de onmiddellijke capture en werd na laadtijd correct vervangen door de uiteindelijke route.

De eerste ongeauthenticeerde Portfolio Checker-capture bracht een UX-afwijking aan het licht: de query was terecht uitgeschakeld, maar de pagina toonde daardoor een misleidende portefeuille-empty-state. Dit is hersteld. De finale mobiele recapture toont uitsluitend de expliciete login-grens met user-triggered OAuth; beschermde portefeuille-inhoud wordt niet getoond. Na de fix zijn de gerichte tests, typecheck, schone runtime-smoke en de volledige `pnpm verify`-gate opnieuw groen uitgevoerd.

## Bewijsbronnen

De visuele bevindingen staan in `docs/research/phase-a-final-visual-smoke.md`. De blijvende herstelprocedure en beperkingen staan in `TECHNICAL_HANDOVER.md`; de operationele logging-, health- en incidentcontracten staan in `OBSERVABILITY_RUNBOOK.md`.

## Aanvullend convergentie- en startupbewijs

De gearchiveerde finale `pnpm db:push`-uitvoer meldt expliciet **“No schema changes, nothing to migrate”** tijdens generatie en vervolgens **“migrations applied successfully”**. In combinatie met de afzonderlijk geverifieerde officiële negen-recordjournalprefix bewijst dit dat de officiële migrator op `0000`–`0008` is geconvergeerd en geen `0009` of andere schema-afwijking produceerde.

In het verse logvenster na de laatste herstart staat om `12:02:58.277Z` eerst `database_integrity_preflight_passed` met negen constraints en pas om `12:02:58.324Z` `server_started`. De gerichte scan op capability-/integriteitsfouten, startup failures, uncaught/unhandled errors, verbindingsweigeringen, timeouts en fatale events rapporteerde **geen** bevindingen.
