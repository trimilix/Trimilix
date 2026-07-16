# Trimilix Fase A — Stabilisatiebaseline

**Datum:** 16 juli 2026  
**Status:** Nulmeting vóór implementatie  
**Beslisvolgorde:** veiligheid, betrouwbaarheid, onderhoudbaarheid, schaalbaarheid, prestaties, functionaliteit, design

## Scope

Fase A lost uitsluitend de goedgekeurde P0- en P1-bevindingen uit `QUALITY_AUDIT_2026-07-16.md` op. Nieuwe productfunctionaliteit valt buiten scope. De beoogde doelvorm blijft een modulaire monoliet; een herschrijving of microservicesmigratie is alleen bespreekbaar wanneer objectieve schaal-, compliance- of teamgrenzen dat vereisen.

## Reproduceerbare nulmeting

De nulmeting is uitgevoerd met `pnpm verify`. De keten omvat TypeScript-controle, Vitest, secret-scanning, een OSV-audit van geïnstalleerde productiepackages en een productiebuild.

| Controle | Nulmeting |
|---|---:|
| TypeScript | Geslaagd |
| Testbestanden | 3 geslaagd |
| Tests | 7 geslaagd |
| Secret-scan | Geslaagd; geen high-confidence hardcoded secrets |
| Dependency-audit | Geslaagd; 495 geïnstalleerde productiepackageversies gecontroleerd |
| Productiebuild | Geslaagd |
| Getransformeerde frontendmodules | 2.395 |
| Hoofd-JavaScriptchunk | 1.187.997 bytes minified; 327,32 kB gzip |
| Hoofd-CSSchunk | 121.047 bytes minified; 19,12 kB gzip |
| Gegenereerde `index.html` | 368.453 bytes; 105,80 kB gzip |
| Serverbundle | 37,2 kB |

## Bevestigde stabilisatiegaten

| Prioriteit | Nulmeting |
|---:|---|
| P0 | De actieve Express-runtime heeft geen expliciete securityheaderbaseline en laat `X-Powered-By` standaard toe. |
| P0 | De storageproxy zet iedere aangeleverde sleutel om in een presigned download zonder zichtbaarheid-, namespace- of eigenaarscontrole. |
| P1 | JSON- en formulierbodies staan centraal tot 50 MB toe. |
| P1 | Kritieke runtimeconfiguratie valt terug op lege strings in plaats van fail-fast te stoppen. |
| P1 | OAuth-, tRPC- en storageroutes hebben geen expliciete routeklasse-rate limits. |
| P1 | Sessies kunnen één jaar geldig zijn; productieclaims en een expliciete rotatie-/revocatiestrategie zijn onvoldoende. |
| P1 | De browser kan een sessietoken en volledig gebruikersprofiel in JavaScript-toegankelijke opslag bewaren. |
| P1 | Financiële kernberekeningen missen inhoudelijke domeintests. |
| P1 | Migratieopbouw, geïsoleerde restore en operationeel herstelbewijs zijn niet geautomatiseerd aangetoond. |
| P1 | Er is geen zichtbare afgedwongen CI-workflow voor de volledige verify-keten. |
| P1 | Health/readiness, request-ID's, gestructureerde logging en testbare SLI-signalen zijn niet operationeel aangetoond. |
| P1 | De frontend bouwt één hoofd-JavaScriptchunk van circa 1,19 MB minified. |
| P1 | Onbegrensde lijsten en seriële ETF-detailopvragingen zijn niet schaalbaar. |
| P1 | Een verouderd tweede serverentrypoint vergroot ambiguïteit. |

## Architectuurpoort

Wanneer uitvoering een fundamentele wijziging aan authenticatie, opslagmodel, databaseschema, deploymenttopologie of domeingrenzen vereist die buiten de goedgekeurde stabilisatiestrategie valt, wordt de implementatie gepauzeerd en eerst als expliciet CTO-besluit aan de gebruiker voorgelegd. Lokale hardening, tests, route-splitting, querybatching en het verwijderen van aantoonbaar verouderde code vallen binnen de goedgekeurde Fase A.
