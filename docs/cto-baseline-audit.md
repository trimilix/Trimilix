# CTO-baselineaudit — The Trimilix System™

**Auditdatum:** 16 juli 2026  
**Scope:** repository, live API-oppervlak, datamodel, server-entrypoint, testconfiguratie, engineeringdocumentatie en marktdata-ontwerp.

> **Statuslegenda:** *Geïmplementeerd* betekent aantoonbaar aanwezig in de code. *Gedeeltelijk* betekent dat slechts een deel aantoonbaar aanwezig is. *Gepland* betekent dat het enkel als norm of ontwerp bestaat. *Platformafhankelijk* betekent dat de controle buiten deze repository beheerd wordt en afzonderlijk geverifieerd moet worden.

## Managementsamenvatting

De toepassing heeft een bruikbare full-stack MVP-basis met React, tRPC, Express, Drizzle, MySQL/TiDB, OAuth en Stripe-configuratie. De bestaande `ENGINEERING_HANDBOOK.md` bevat veel goede principes, maar presenteert meerdere doelarchitectuuronderdelen alsof ze reeds operationeel zijn. Dat is risicovol voor audits en besluitvorming. De grootste onmiddellijke codebevinding is een **broken object-level authorization-risico**: `portfolio.get` en `portfolio.analyze` ontvangen enkel een portefeuille-ID en controleren niet of die portefeuille aan de aangemelde gebruiker toebehoort. Daarnaast is ETF-creatie beschikbaar voor iedere aangemelde gebruiker in plaats van enkel voor een beheerder.

## Huidige architectuur

| Domein | Aantoonbare toestand | Status |
|---|---|---|
| Frontend | React 19, Vite, Tailwind 4, tRPC-client | Geïmplementeerd |
| Backend | Eén Express-proces met tRPC, OAuth en storage-proxy | Geïmplementeerd |
| Database | MySQL/TiDB via Drizzle; gebruikers, portefeuilles, holdings, doelen, abonnementen en ETF’s | Geïmplementeerd |
| Authenticatie | Manus OAuth en sessiecookies | Geïmplementeerd |
| Autorisatie | Beschermde procedures; geen consistente objecteigenaarschapscontrole; geen adminprocedure voor ETF-mutaties | Gedeeltelijk |
| Betalingen | Stripe-omgevingsvariabelen en abonnementstabel; volledige betaalflow niet aangetoond in deze audit | Gedeeltelijk |
| Marktdata | Geen provider-adapter, cache, streaming of licentiehandhaving in de code | Gepland |
| Cache | Geen Redis of andere gedeelde cache | Gepland |
| Workers/jobs | Geen aparte worker- of queue-architectuur | Gepland |
| Monitoring | Sandboxlogs beschikbaar; geen applicatiemetrics, traces, SLI-dashboard of alerts in code | Gedeeltelijk/platformafhankelijk |
| Back-ups | Geen repository-automatisering; databaseherstel is platformafhankelijk en niet aangetoond | Platformafhankelijk |
| CI/CD | Geen workflowbestanden gevonden; lokale scripts voor build, typecheck en tests | Gedeeltelijk |

## Prioritaire beveiligingsbevindingen

| ID | Bevinding | Impact | Prioriteit | Vereiste maatregel |
|---|---|---|---|---|
| SEC-001 | `portfolio.get` controleert de eigenaar niet | Inzage in financiële data van een andere gebruiker via IDOR/BOLA | Kritiek | Filter databasequery op `portfolioId` én `ctx.user.id`; geef een neutrale `NOT_FOUND` terug |
| SEC-002 | `portfolio.analyze` controleert de eigenaar niet | Afgeleide financiële data van een andere gebruiker kan uitlekken | Kritiek | Geef `userId` door aan de analysedienst en gebruik dezelfde eigenaarschapsfilter |
| SEC-003 | `etf.create` is bereikbaar voor elke aangemelde gebruiker | Ongeautoriseerde wijziging van gedeelde referentiedata | Hoog | Beperk tot `adminProcedure` en voeg een autorisatietest toe |
| SEC-004 | JSON- en form-bodylimiet staat op 50 MB voor de hele app | Onnodig hoog geheugen- en DoS-risico | Middel | Verlaag de algemene limiet; gebruik gerichte uploadroutes/S3 voor bestanden |
| SEC-005 | Geen aantoonbare rate limiting op de API | Brute force, scraping, misbruik van dure providers | Hoog vóór publieke lancering | Voeg limieten per IP/gebruiker/abonnementsplan toe op gateway- of applicatieniveau |
| SEC-006 | Handbook markeert controles als geïmplementeerd zonder bewijs | Valse assurance tijdens audits of releasebeslissingen | Hoog | Gebruik een evidence-based control matrix met eigenaar, bewijs en laatste verificatie |

## Kwaliteit en testen

Er is momenteel één Vitest-bestand dat de logoutcookie controleert. Er zijn geen aantoonbare tests voor objecteigenaarschap, portefeuille-analyse, ETF-beheer, database-interacties of frontendflows. Er zijn ook geen ingestelde coverage-drempels of E2E-tests. De scripts `pnpm check`, `pnpm test` en `pnpm build` zijn aanwezig; linting, dependency audit en secret-scanning zijn nog niet als uniforme kwaliteitsgate gedefinieerd.

## Performance en schaalbaarheid

Het huidige één-procesmodel is passend voor een MVP op autoscaling hosting. Het is niet nodig om nu Redis, microservices of aparte workers te introduceren. Wel moeten interfaces en datastromen zo ontworpen worden dat latere horizontale schaal mogelijk blijft. Voor marktdata is een server-side provider-adapter met cache, requestcoalescing, time-outs, circuit breakers en quota-/kostenmeting vereist vóór real-time data wordt geactiveerd. Zonder die laag zou elke gebruiker providerrequests kunnen vermenigvuldigen.

## Observability en kosten

De volgende minimale SLI’s moeten vóór een betalende publieke lancering meetbaar zijn: beschikbaarheid, requestvolume, p50/p95/p99-responstijd, 4xx/5xx-percentage, databasequeryduur, actieve databaseconnecties, externe API-latency en foutpercentage, cache hit ratio, providerrequests per gebruiker/plan, en geraamde providerkosten per actieve gebruiker. Logs mogen geen e-mailadressen, tokens, Stripe-identifiers of volledige financiële payloads bevatten.

## Back-up en herstel

Broncode en documentatie horen via checkpoints en een externe Git-repository herstelbaar te zijn. Databaseback-ups, retentie en point-in-time recovery moeten in de hostinglaag geverifieerd worden; deze repository kan dat niet garanderen. Secrets mogen niet in broncode of back-upbestanden voorkomen en moeten via de beveiligde projectinstellingen beheerd worden. Een hersteltest moet bewijs opleveren; alleen een beschreven procedure is onvoldoende.

## Handboekcorrecties

Het handbook moet onderscheid maken tussen **huidige architectuur**, **doelarchitectuur** en **releasegates**. Voorbeelden met Redis, Prometheus, OpenTelemetry, Terraform, Route53, Cloudflare, SendGrid, multi-AZ en aparte workers zijn patronen, geen bewijs dat die componenten bestaan. Absolute of niet-onderbouwde uitspraken moeten vervangen worden door verifieerbare eisen en statussen.

## Uitvoeringsvolgorde

1. Herstel objecteigenaarschap en adminautorisatie met unit-/routertests.
2. Maak het handbook evidence-based en voeg `docs/architecture.md` toe.
3. Definieer een provider-onafhankelijk marktdata-contract en premium feature gate.
4. Voeg reproduceerbare kwaliteitsscripts toe voor typecheck, tests, build, dependency audit en secret-scan.
5. Leg SLI’s, kostenbewaking, back-upverantwoordelijkheden en sprintreviewformat vast.
6. Introduceer pas Redis, workers, uitgebreide tracing of multi-regioncomponenten wanneer gemeten belasting of bedrijfsvereisten dat rechtvaardigen.

## Bekende platformbeperkingen

De huidige configuratiesessie werd als **niet-projectgebonden** gerapporteerd. Daardoor konden de richtlijnen niet automatisch als globale projectinstructies worden opgeslagen. Ze worden daarom als versiebeheerbare bron van waarheid vastgelegd in `ENGINEERING_HANDBOOK.md`, `docs/architecture.md` en de CTO-auditdocumenten.
