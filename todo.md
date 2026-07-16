# Trimilix MVP — Todo

> **Statuslegenda:** `[x]` betekent aantoonbaar voltooid. Regels met `[ ]` en **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD** zijn bewust buiten Fase A gehouden en blijven open in [`PRODUCT_BACKLOG.md`](PRODUCT_BACKLOG.md); zij zijn nadrukkelijk niet feature-complete.

## Fase 1: Fundamenten

- [x] Gebruikersauthenticatie (Manus OAuth)
- [x] Persoonlijk Dashboard™
- [x] Database-schema voor portefeuilles, ETF's, gebruikersdata
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Onboarding-flow. Zie `PRODUCT_BACKLOG.md`.

## Fase 2: Kernfuncties

- [x] ETF Check™ (ETF-analyse en screening)
- [x] Portfolio Checker™ (portefeuille-analyse)
- [x] Compounding Simulator™ (rendementsberekening)
- [x] Doelplanner™ (financiële doelen)

## Fase 3: Premium & Betalingen

- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Stripe-integratie. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Premium-abonnement (checkout). Zie `PRODUCT_BACKLOG.md`.

## Fase 4: Engineering Standaarden & Verfijning

- [x] **Fix:** `dotenv` module not found error in server logs.
- [x] **ETF Check™:** Gebruikt geseede ETF-data via tRPC + ETF-schema/API, inclusief loading/error/empty states en echte portefeuille-toevoeging (mocked).
- [x] **Verifieer ETF Seeding:** Controleer of de `etfs` tabel daadwerkelijk gevuld is met de geseede data via een tRPC-call of directe DB-query.
- [x] **ETF Check™ Empty State:** Voeg een expliciete empty state toe voor ETF-zoekresultaten wanneer geen ETFs gevonden worden of de catalogus leeg is.
- [x] **Portfolio Checker™:** Gebruikt echte portefeuille- en holdingsdata via tRPC.
- [ ] **OVERGEDRAGEN — RESTANT NIET GEÏMPLEMENTEERD:** Portfolio Checker™ risico en spreiding zijn data-gedreven afgerond; dynamische aanbevelingsregels blijven open in `PRODUCT_BACKLOG.md` en worden niet gefabriceerd.
- [x] **Portfolio Checker™ Frontend State:** Voeg loading-, error- en empty-state handling toe voor het laden van een geselecteerde portefeuille (`selectedPortfolio`).
- [x] **Portfolio Checker™ Backend Logica:** Vervang mock `riskProfile` door echte backend-berekening op basis van holdings/ETF-kenmerken (afgerond in Fase A met waardegewogen holdingsdata en fail-closed ETF-risicoscores).
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Valideer/vervang geseede ETF-risicoscores en documenteer de methodiek per ETF. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Documenteer per geseede ETF schaal, criteria, voorbeelden en herbeoordeling van `riskScore`. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Onderbouw/valideer geseede `riskScore`-waarden met een goedgekeurde bron en methodiek. Zie `PRODUCT_BACKLOG.md`.
- [x] **Portfolio Checker™ Backend Logica:** Vervang de placeholder `|| 3`-fallback door een echte, data-gedreven risicobepaling of expliciete validatiefout wanneer risicodata ontbreekt.
- [x] **Portfolio Checker™ Backend Logica:** Los de huidige dev-server fout met dubbele export van `analyzePortfolio` in `server/db.ts` op voordat verdere portfolio-logica als afgerond wordt gemarkeerd.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Dynamische portefeuilleaanbevelingen na methodiek-, claim- en productgoedkeuring. Zie `PRODUCT_BACKLOG.md`.
- [x] **Portfolio Checker™ Backend Logica:** Voeg tests toe voor `analyzePortfolio` zodat risico-, spreidings- en het expliciet ontbreken van mockaanbevelingen verifieerbaar zijn.
- [x] **Portfolio Checker™ Dynamische UI:** Verwijder hardcoded analyseblokken en vervang deze door dynamische, data-gedreven output uit tRPC/backendlogica.
- [x] **Compounding Simulator™:** Verplaats de compounding-berekening naar goed geteste deterministische kernlogica met invoervalidatie en expliciete foutafhandeling.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Doelplanner koppelen aan echte goals-data en CRUD-procedures. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Doelplanner loading/error/empty states, validatie en goals-tabelgebruik. Zie `PRODUCT_BACKLOG.md`.
- [x] **Database Seeding:** Vul de `etfs` tabel met een beperkte set populaire ETF's. (Geverifieerd: 5 ETF's geseed)
- [x] **Beveiliging:** Implementeer inputvalidatie met Zod voor alle tRPC-procedures (voor procedures met input). Procedures zonder input vereisen geen Zod-validatie. (Geverifieerd)
- [x] **Code Kwaliteit:** Zorg voor unit tests voor de huidige kritieke bedrijfslogica, inclusief compounding en portefeuilleanalyse.
- [x] **Architectuur:** Documenteer de architectuur in `/docs/architecture.md` (gebruik Mermaid of D2).
- [x] **Observability:** Implementeer privacyveilige gestructureerde logging voor backend-acties, request-ID-correlatie en foutgrenzen.
- [ ] **OVERGEDRAGEN — RESTANT NIET GEÏMPLEMENTEERD:** Transactiewrapper en atomische writes zijn afgerond; generieke request-idempotency blijft verplicht bij toekomstige betalingen/webhooks. Zie `PRODUCT_BACKLOG.md`.

## Fase 5: Verdere Ontwikkeling

- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Academy-content. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Broker Match™. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Fiscale Module™. Zie `PRODUCT_BACKLOG.md`.

## Fase 6: Testen & Oplevering

- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Volledige geauthenticeerde browser-E2E-suite; Fase A heeft wel 98 regressies en runtime-/visuele smokes. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — RESTANT NIET GEÏMPLEMENTEERD:** Productieachtige load/cold-start/Web Vitals-metingen; Fase A heeft bundlebudgetten, queryplannen en een lokale health/readinessbaseline. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — RESTANT NIET GEÏMPLEMENTEERD:** Centrale API-/database-/deploymentdocumentindex vóór teamuitbreiding; Fase A-runbooks, audit en handover zijn afgerond. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Brede productiereleasechecklist na externe monitoring, back-upretentie, RPO/RTO en branchbescherming. Zie `PRODUCT_BACKLOG.md`.

- [x] **Portfolio Checker™ Backend Logica:** Herstart de dev-server na de laatste `server/db.ts`-wijzigingen en verifieer expliciet dat `analyzePortfolio` correct uit `./db` wordt geëxporteerd zonder runtime import/export-fouten.
- [x] **Portfolio Checker™ Backend Logica:** Run een schone typecheck/start-validatie voor portfolio-routes en leg vast dat de `portfolio.analyze` procedure zonder serverfouten laadt.
- [x] Vergelijk alternatieve marktdata-aanbieders voor actuele en real-time aandelen- en ETF-koersen, inclusief Europese dekking, WebSockets, limieten, commerciële weergaverechten en prijs.
- [x] Formuleer een MVP-aanbeveling en groeipad waarbij real-time koersen later enkel voor betalende gebruikers worden geactiveerd.
- [x] Audit de huidige code, documentatie, scripts en configuratie tegenover de nieuwe CTO-, security-, performance-, monitoring- en schaalbaarheidsrichtlijnen.
- [x] Breid `ENGINEERING_HANDBOOK.md` uit met blijvende standaarden voor architectuur, OWASP-security, secrets, performance, observability, kostenbeheer, omgevingen, back-ups, documentatie en sprintreviews.
- [x] Maak of actualiseer `docs/architecture.md` met systeemcontext, componenten, datastromen, trust boundaries, schaalstrategie en deploymentomgevingen.
- [x] Leg een provider-onafhankelijk marktdata-contract, cachingstrategie, failoverbeleid en premium real-time activeringsmodel vast.
- [x] Voeg reproduceerbare kwaliteitscontroles toe voor tests, typecheck, dependency audit en secret-scanning zonder productiegegevens bloot te stellen.
- [x] Documenteer monitoring-SLI’s voor uptime, responstijd, fouten, server- en databasebelasting, API-gebruik, cache-efficiëntie en providerkosten.
- [x] Leg back-up- en herstelprincipes vast voor database, broncode, configuratie, documentatie en secrets, met duidelijke platformbeperkingen.
- [x] Maak een herbruikbaar CTO-sprintevaluatiesjabloon en lever een eerste sprintaudit met risico’s, technische schuld, tests en aanbevelingen.

- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Inventariseer merkstijl, assets en videotoepassingen. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Definieer het wekelijkse videoformat. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Schrijf script, storyboard, voice-over en schermteksten voor een pilotvideo. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Produceer en controleer de geanimeerde pilotvideo en varianten. Zie `PRODUCT_BACKLOG.md`.
- [ ] **OVERGEDRAGEN — NIET GEÏMPLEMENTEERD:** Documenteer videoproductiewerkwijze, publicatiecopy en vervangbare inhoud. Zie `PRODUCT_BACKLOG.md`.

- [x] Analyseer het aangeleverde Trimilix-referentielogo op behoudenswaardige elementen, schaalbaarheid, leesbaarheid en motiongeschiktheid.
- [x] Ontwerp drie onderscheidende Trimilix-logo-richtingen in standaardkwaliteit met gouden T, groeigrafiek en zwart-goud-witte merkbasis.
- [x] Laat de gebruiker één logorichting kiezen en verwerk gerichte feedback zonder de pilotvideo verder te produceren. Gekozen: A — Refined Legacy; app/favicon gebruikt alleen het beeldmerk.
- [x] Produceer de gekozen richting als hoofdlogo, beeldmerk, gestapelde toepassing, lichte en donkere variant, SVG, transparante PNG, PDF en faviconformaten. Richting A is als hoofdlogo vastgelegd; app/favicon gebruikt alleen het beeldmerk.
- [x] Verwerk het definitieve Trimilix-logo in de website en hervat daarna pas de standaardkwaliteits-preview van de pilotvideo.

## Fase 7: Kwaliteitsstop vóór verdere bouw

- [x] Huidige Trimilix-defaultpilot volledig afwerken, controleren en aan de gebruiker opleveren.
- [x] Professionele opbouw, visuele consistentie, responsiviteit en toegankelijkheid van de huidige website auditen.
- [x] Codekwaliteit, onderhoudbaarheid, modulariteit, duplicatie en conventies auditen.
- [x] Architectuur, domeinscheiding, afhankelijkheden en schaalbaarheid auditen.
- [x] Authenticatie, autorisatie, invoervalidatie, secrets, headers, misbruikscenario's en overige beveiligingsrisico's auditen.
- [x] Databaseschema, migraties, relaties, indexen, integriteit en operationele risico's auditen.
- [x] Frontend-, backend-, netwerk- en buildprestaties meten en beoordelen.
- [x] Testdekking, foutafhandeling, logging, monitoring en operationele gereedheid auditen.
- [x] README, architectuurdocumentatie, configuratie en ontwikkelaarsdocumentatie auditen.
- [x] Beoordelen of het platform veilig en verantwoord verder kan worden uitgebouwd.
- [x] Senior Software Architect-rapport opleveren met sterke punten, absolute verbeterpunten, latere verbeteringen, technische schuld, risico's en aanbevelingen.
- [x] Alle nieuwe functionaliteitsbouw blokkeren totdat de gebruiker het auditrapport expliciet heeft goedgekeurd.

## Fase 8: Goedgekeurde Fase A-stabilisatiesprint

- [x] **Security — HTTP-baseline:** Voeg CSP, HSTS in productie, framebeperking, `X-Content-Type-Options`, Referrer-Policy en Permissions-Policy toe; verwijder `X-Powered-By`; dek headers af met Vitest.
- [x] **Security — Requestgrenzen:** Verlaag de standaard JSON/form-bodylimiet van 50 MB naar een onderbouwde kleine limiet en test oversized requests.
- [x] **Security — Runtimeconfiguratie:** Valideer kritieke database-, JWT-, OAuth- en storageconfiguratie fail-fast met negatieve tests.
- [x] **Security — Storageautorisatie:** Beperk de storageproxy tot expliciet toegestane publieke assets en bescherm private objecten met authenticatie, eigenaar-/namespacecontrole en tests.
- [x] **Security — Rate limiting:** Implementeer routeklasse-specifieke limieten voor OAuth, tRPC en storage, inclusief relevante headers, foutresponsen, metrics/logging en tests.
- [x] **Security — Sessies:** Verkort en documenteer sessieduur, valideer `iss`/`aud`/app-binding waar compatibel, en voeg een expliciete revocatie-/rotatiestrategie en regressietests toe.
- [x] **Privacy — Browseropslag:** Verwijder productie-bearertokens en volledige gebruikersprofielen uit JavaScript-toegankelijke webstorage; wis resterende authdata bij logout; voeg tests toe.
- [x] **Betrouwbaarheid — Financiële kern:** Isoleer en test samengestelde interest, maandinleg, afronding, grenswaarden, risicoscore, ontbrekende ETF-data en bekende referentiecases.
- [x] **Database — Migratiereproduceerbaarheid:** Bewijs dat een lege database via de gecommitteerde migraties naar het actuele schema kan worden opgebouwd en leg de verificatie vast.
- [x] **Database — Integriteit en transacties:** Voeg benodigde constraints en transacties toe voor financiële mutaties zonder bestaande data te beschadigen; genereer, beoordeel en pas migraties gecontroleerd toe.
- [x] **Database — Herstelbewijs:** Voer een veilige, geïsoleerde restore-/hersteltest uit voor zover het platform dit toelaat en documenteer RPO/RTO, bewijs en resterende platformbeperkingen.
- [x] **Operational readiness — CI-gate:** Voeg een afgedwongen workflow toe voor typecheck, tests, secret-scan, dependency-audit, build en migratiecontrole.
- [x] **Operational readiness — Observability:** Implementeer health/readiness, request-ID's, gestructureerde logging, centrale foutregistratiegrenzen en testbare SLI-signalen zonder gevoelige data te loggen.
- [x] **Performance — Frontendbundel:** Implementeer route-lazy-loading en een bundlebudget; verwijder aantoonbaar ongebruikte runtime-imports en bewijs de verbetering met buildmetingen.
- [x] **Performance — Querypatronen:** Voeg cursor-/limietpaginering en batchqueries toe aan onbegrensde of N+1-gevoelige portfolio-/ETF-flows; voeg tests en querymetingen toe.
- [x] **Architectuur — Verouderde runtime:** Verwijder of archiveer het ongebruikte `server/index.ts` en borg één ondubbelzinnig productie-entrypoint.
- [x] **Verificatie:** Voer de volledige kwaliteitsketen, securityregressies, productiebuild, runtimechecks en relevante desktop-/mobielcontroles uit en leg bewijs vast.
- [x] **Rapportage:** Lever `PHASE_A_STABILIZATION_AUDIT_2026-07-16.md` op met opgeloste P0/P1-punten, testbewijs, securitybewijs, performancebewijs, resterende risico's en een nieuw go/no-go-oordeel.
- [x] **Architectuur — Rate-limitadapter:** Isoleer de lokale limiterstore achter een expliciete adapter/factory, documenteer Optie A in `ENGINEERING_HANDBOOK.md` en leg harde Redis/edge-migratietriggers vast (meer dan één productie-instance, significante publieke groei, limietmisbruik over instances, strengere compliance/SLA of behoefte aan globale user-/tenantquota).
- [x] **Architectuur — Sessierevocatieadapter:** Implementeer een expliciet sessierevocatiecontract met user-level `sessionVersion`, zodat 7-daagse JWT-validatie nu werkt en later een apparaatgebonden sessierepository kan worden aangesloten zonder routers of authenticatiegrenzen te herschrijven.
- [x] **Documentatie — Sessiebesluit:** Documenteer de 7-daagse HttpOnly-JWT, claimset, revocatiebeperking en migratietriggers naar apparaatgebonden sessies in `ENGINEERING_HANDBOOK.md` en `TECHNICAL_HANDOVER.md`.
- [x] **Financiële kern — Decimal contract:** Implementeer een pure gedeelde domeinmodule met decimale rekenkunde, eurocenten voor bedragen, basispunten voor rendement en expliciete half-up-afronding uitsluitend op vastgelegde grenzen.
- [x] **Financiële kern — Compounding:** Implementeer maandelijkse samengestelde interest met conservatieve einde-maandinleg, documenteer formule en aannames, en voeg bekende referentie-, nul-, negatieve-rente-, maximale-looptijd- en invoergrenstests toe.
- [x] **Financiële kern — Portefeuillerisico:** Implementeer waardegewogen risicoscore op positieomvang, valideer de 1–5-schaal en blokkeer risicoscore/recommendations bij ontbrekende of ongeldige ETF-risicodata zonder middenscorefallback.
- [x] **Financiële kern — Analyse-integratie:** Laat de Compounding Simulator en Portfolio Checker uitsluitend de nieuwe deterministische domeinuitkomsten gebruiken en toon een expliciete onvolledige-datastatus zonder cijfers te fabriceren.
- [x] **Documentatie — Financiële formules:** Maak `docs/financial-calculation-contract.md` met alle formules, motivaties/bronnen, eenheden, timing, afrondingsregels, validatiegrenzen en gekoppelde referentiecases.
- [x] **Database — Constraints en indexen:** Voeg dataveilige CHECK-constraints en gerichte FK-/query-indexen toe voor sessieversie, niet-negatieve bedragen, positieve aandelen, ETF-risicoschaal en één holding per portefeuille/ticker; valideer bestaande data vóór migratie.
- [x] **Database — Atomische writes:** Vervang de racegevoelige subscription `select → insert/update` door één atomische upsert en voeg een geteste herbruikbare transactiewrapper toe voor toekomstige samengestelde financiële writes.
- [x] **Architectuur — Idempotency-trigger:** Leg in `ENGINEERING_HANDBOOK.md` en `TECHNICAL_HANDOVER.md` vast dat Stripe, webhooks, betalingen, geldachtige mutaties of andere samengestelde kritieke transacties automatisch een generieke request-level idempotency-oplossing met payloadhash, opslagretentie en replaycontract verplicht maken.
- [x] **Database — Fail-closed capabilitypreflight:** Schakel TiDB CHECK-enforcement aantoonbaar in, registreer de negen financiële/integriteitsconstraints opnieuw en laat runtime, migratieverificatie en CI duidelijk stoppen wanneer de capability of verwachte constraintset ontbreekt; documenteer oorzaak en herstelpad.
- [x] **Database — Migratiejournalreconciliatie:** Bewijs read-only dat live schema-effecten van `0004`–`0006` exact aanwezig zijn; vul alleen daarna de ontbrekende officiële Drizzle-hash-/timestamprecords aan; laat `0007` via de migrator lopen en bewijs de volledige keten opnieuw. Documenteer oorzaak, besluit, controles en herstelprocedure in `ENGINEERING_HANDBOOK.md` en `TECHNICAL_HANDOVER.md`.
- [x] **Database — Nullable CHECK-compatibiliteit:** Vervang uitsluitend de twee nullable ETF-constraints door `CHECK (ter >= 0)` en `CHECK (riskScore BETWEEN 1 AND 5)`, behoud SQL-`UNKNOWN`/`NULL`-semantiek, bewijs de volledige geïsoleerde migratie-, rollback- en restoreketen en laat daarna de officiële migrator gecontroleerd convergeren.
- [x] Onderzoek en herstel de onverwacht gegenereerde migratie `0008_sharp_wolverine.sql`; bewijs of zij no-op, dubbelop of live toegepast is voordat Fase 6 wordt afgesloten.
- [x] Verwijder de resterende runtime-import van `ONE_YEAR_MS` uit `@shared/const`, vervang door het juiste sessiecontract en bewijs een schone serverstart.
- [x] Laat `verify-live-schema-equivalence.mjs` na een volledig rapport zelfstandig en deterministisch afsluiten zonder handmatige kill.
- [x] Voeg een least-privilege GitHub Actions-workflow toe met Node 22, pnpm 10, frozen lockfile, typecheck, Vitest, secret-scan, dependency-audit, migratieketen-/herstelcontrole en productiebuild zonder productiegeheimen.
- [x] Voeg een centrale JSON-lines logger toe met veilige veldnormalisatie, request-ID-propagatie, requestduur/status en expliciete uitsluiting van headers, cookies, bodies, tokens en PII.
- [x] Voeg afzonderlijke `/healthz`- en `/readyz`-routes toe; liveness is dependencyvrij, readiness voert een timeout-begrensde read-only databaseprobe uit en retourneert minimaal 503 bij uitval.
- [x] Voeg centrale Express- en tRPC-foutregistratiegrenzen toe die request-ID correleren, publieke foutdetails beperken en geen gevoelige data loggen.
- [x] Voeg Vitest-regressies toe voor loggerredactie, request-ID, health/readiness, foutgrenzen en testbare SLI-tellers; documenteer alertdrempels en externe collectorbeperking.
- [x] Laat de centrale Express-foutgrens fouten met reeds verzonden headers doorgeven aan de standaardhandler in plaats van de responseketen stil te beëindigen; voeg een regressietest toe.
- [x] Maak alle niet-home routes lazy met een toegankelijke `Suspense`-fallback en bewijs dat chartlibraries niet langer in de initiële routechunk zitten.
- [x] Voeg een deterministische bundlebudgetscript en CI-/`verify`-gate toe voor initiële en grootste JavaScriptchunks, met gemeten baseline en beperkte onderhoudsmarge.
- [x] Vervang onbegrensde portfolio-/ETF-lijsten door begrensde cursorpagina’s en vervang portfolioanalyse-N+1 door één batchquery; behoud eigenaarsfiltering en expliciete ontbrekende-risicodata.
- [x] Verwijder het ongebruikte `server/index.ts`, verifieer dat `server/_core/index.ts` het enige dev-, build- en productie-entrypoint is en borg dit met een statische test.
- [x] Voer `pnpm verify` als één samengestelde finale releasegate uit en archiveer aantallen, auditresultaten en bundlemetingen voor de eindaudit.
- [x] Herhaal de officiële migratorconvergentie, geïsoleerde clean-database/rollback/restore-rehearsal en finale read-only live schema-/journal-equivalentie op de 0000–0008-keten.
- [x] Voer schone runtime-smokes uit voor startupintegriteit, `/healthz`, warme `/readyz`, request-ID, foutvrije logs en privacyveilige observabilityevents.
- [x] Voeg een begrensde lokale loadbaseline toe voor dependencyvrije liveness en database-readiness, meet succesratio/p50/p95/p99 en documenteer dat dit geen productiecapaciteitstest vervangt.
- [x] Controleer home, ETF Checker en afgeschermde portfolioroute op desktop en mobiel na lazy-loading/cursorrefactor; leg eventuele authenticatiebeperkingen expliciet vast.
- [x] Herstel de afgeschermde Portfolio Checker-route zodat een niet-ingelogde gebruiker geen misleidende lege portefeuilletoestand ziet maar een expliciete, responsieve authenticatiegrens; behoud backendautorisatie en voeg regressiebewijs toe.
- [x] Borg statisch dat Portfolio Checker-risico en geografische analyse uit `portfolioAnalysis` komen, allocatie/holdings uit tRPC-data komen en geen mock-/hardcoded analysedatasets aanwezig zijn.
- [x] Borg de Compounding Simulator end-to-end op de gedeelde financiële kern, begrensde invoer en een zichtbare fail-safe fouttoestand; voeg gerichte regressietests toe.
- [x] Maak de actuele Trimilix-runtime tijdelijk publiek bereikbaar met een browser-testbare preview-URL.
- [x] Beoordeel de huidige homepage op Trimilix-merkidentiteit, kernpropositie, productspecifieke navigatie en afwezigheid van generieke bedrijfswebsitecopy; beoordeling geslaagd op browserweergave én broncode.
- [x] Vervang de homepage alleen indien de beoordeling faalt; niet uitgevoerd omdat de bestaande homepage aantoonbaar al de echte Trimilix-authgrens en financiële cockpit is en geen generieke bedrijfswebsite.
- [x] Valideer de uiteindelijke homepage en kernroutes op desktop en mobiel; 98 tests, typecheck, security-/dependency-audits, productiebuild, bundlebudgetten en runtime-smokes zijn groen en de tijdelijke demo-URL is gereed.

## Professionele publieke beta — nieuwe opdracht

- [x] Maak vóór externe GitHub-writes een veilige lokale baseline: gitstatus/remotes, GitHub-auth, grootbestanden, secrets en volledige kwaliteitsgate gecontroleerd; checksum-gevalideerde git-bundle, bronarchief en werkboompatch buiten de projectmap vastgelegd.
- [x] Maak of koppel een veilige GitHub-repository, push de volledige gescande codebase, borg duidelijke mappenstructuur, README, LICENSE en `.gitignore`, en maak tag/release `v0.1-beta` zonder secrets of runtimeartefacten.
- [x] Verwijder de dubbele pnpm-versiebron uit GitHub Actions, verifieer de volledige publieke CI-keten groen en laat `v0.1-beta` naar de herstelde releasecommit wijzen.
- [ ] Voer een volledige audit uit op bugs, security, performance, responsive design, accessibility, SEO, foutafhandeling, type safety, duplicatie en onderhoudbaarheid; rangschik bevindingen op P0/P1/P2/P3.
- [ ] Herstel alle concrete auditbevindingen binnen de bestaande Trimilix-functies en voeg voor iedere codefix passende regressietests toe.
- [ ] Valideer Homepage, Registratie/Login, Dashboard, Portfolio's, ETF Checker, Portfolio Checker, Compounding Simulator en Doelplanner end-to-end; documenteer eventuele auth- of databeperkingen zonder demo-inhoud te fabriceren.
- [ ] Test de publieke beta op desktop, tablet en mobiel, inclusief keyboardbediening, focus, contrast, semantiek, responsive overflow en kern-SEOmetadata.
- [ ] Maak `ROADMAP.md` met Fase 2 (Academy, Brokervergelijker, BE/NL-fiscaliteit, ETF-gids, educatie), Fase 3 (geavanceerde Portfolio Checker, Detri ETF Check, AI Coach, watchlists, alerts, nieuws) en Fase 4 (premium, betalingen, mobiele app, API-koppelingen).
- [ ] Maak of converteer `TODO.md` naar één professionele, afvinkbare backlog met prioriteit, fase, status, afhankelijkheden en duidelijke scheiding tussen beta-blockers en latere productontwikkeling.
- [ ] Finaliseer productiedocumentatie voor schaalbare architectuur, veilige authenticatie, back-ups/herstel, logging, monitoring, deployment, secrets en operationele incidentrespons.
- [ ] Voer de volledige finale kwaliteitsketen, migratie-/herstelvalidatie, runtime-smokes en cross-device controles uit en archiveer bewijs.
- [ ] Synchroniseer alle finale wijzigingen naar GitHub en lever een publiek-beta go/no-go-oordeel met resterende risico's en vervolgstappen.
