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
- [x] **Architectuur:** Documenteer de architectuur in `/docs/architecture.md` (gebruik Mermaid of D2).
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
- [x] Audit de huidige code, documentatie, scripts en configuratie tegenover de nieuwe CTO-, security-, performance-, monitoring- en schaalbaarheidsrichtlijnen.
- [x] Breid `ENGINEERING_HANDBOOK.md` uit met blijvende standaarden voor architectuur, OWASP-security, secrets, performance, observability, kostenbeheer, omgevingen, back-ups, documentatie en sprintreviews.
- [x] Maak of actualiseer `docs/architecture.md` met systeemcontext, componenten, datastromen, trust boundaries, schaalstrategie en deploymentomgevingen.
- [x] Leg een provider-onafhankelijk marktdata-contract, cachingstrategie, failoverbeleid en premium real-time activeringsmodel vast.
- [x] Voeg reproduceerbare kwaliteitscontroles toe voor tests, typecheck, dependency audit en secret-scanning zonder productiegegevens bloot te stellen.
- [x] Documenteer monitoring-SLI’s voor uptime, responstijd, fouten, server- en databasebelasting, API-gebruik, cache-efficiëntie en providerkosten.
- [x] Leg back-up- en herstelprincipes vast voor database, broncode, configuratie, documentatie en secrets, met duidelijke platformbeperkingen.
- [x] Maak een herbruikbaar CTO-sprintevaluatiesjabloon en lever een eerste sprintaudit met risico’s, technische schuld, tests en aanbevelingen.

- [ ] Inventariseer de bestaande Trimilix-merkstijl, beschikbare logo-assets en geschikte videotoepassingen voor website en social media.
- [ ] Definieer een herbruikbaar weekformat met vaste intro/outro, motiontaal, afleveringsstructuur, platformverhoudingen en topicbibliotheek.
- [ ] Schrijf het script, storyboard, voice-over en schermteksten voor een eerste Trimilix-pilotvideo.
- [ ] Produceer en controleer een professionele geanimeerde pilotvideo met minimaal één social-mediaformaat en één websitegeschikte variant.
- [ ] Documenteer de wekelijkse productiewerkwijze, publicatiecopy en vervangbare inhoudsblokken voor toekomstige afleveringen.

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
- [ ] **Database — Migratiereproduceerbaarheid:** Bewijs dat een lege database via de gecommitteerde migraties naar het actuele schema kan worden opgebouwd en leg de verificatie vast.
- [ ] **Database — Integriteit en transacties:** Voeg benodigde constraints en transacties toe voor financiële mutaties zonder bestaande data te beschadigen; genereer, beoordeel en pas migraties gecontroleerd toe.
- [ ] **Database — Herstelbewijs:** Voer een veilige, geïsoleerde restore-/hersteltest uit voor zover het platform dit toelaat en documenteer RPO/RTO, bewijs en resterende platformbeperkingen.
- [ ] **Operational readiness — CI-gate:** Voeg een afgedwongen workflow toe voor typecheck, tests, secret-scan, dependency-audit, build en migratiecontrole.
- [ ] **Operational readiness — Observability:** Implementeer health/readiness, request-ID's, gestructureerde logging, centrale foutregistratiegrenzen en testbare SLI-signalen zonder gevoelige data te loggen.
- [ ] **Performance — Frontendbundel:** Implementeer route-lazy-loading en een bundlebudget; verwijder aantoonbaar ongebruikte runtime-imports en bewijs de verbetering met buildmetingen.
- [ ] **Performance — Querypatronen:** Voeg cursor-/limietpaginering en batchqueries toe aan onbegrensde of N+1-gevoelige portfolio-/ETF-flows; voeg tests en querymetingen toe.
- [ ] **Architectuur — Verouderde runtime:** Verwijder of archiveer het ongebruikte `server/index.ts` en borg één ondubbelzinnig productie-entrypoint.
- [ ] **Verificatie:** Voer de volledige kwaliteitsketen, securityregressies, productiebuild, runtimechecks en relevante desktop-/mobielcontroles uit en leg bewijs vast.
- [ ] **Rapportage:** Lever `PHASE_A_STABILIZATION_AUDIT_2026-07-16.md` op met opgeloste P0/P1-punten, testbewijs, securitybewijs, performancebewijs, resterende risico's en een nieuw go/no-go-oordeel.
- [x] **Architectuur — Rate-limitadapter:** Isoleer de lokale limiterstore achter een expliciete adapter/factory, documenteer Optie A in `ENGINEERING_HANDBOOK.md` en leg harde Redis/edge-migratietriggers vast (meer dan één productie-instance, significante publieke groei, limietmisbruik over instances, strengere compliance/SLA of behoefte aan globale user-/tenantquota).
- [x] **Architectuur — Sessierevocatieadapter:** Implementeer een expliciet sessierevocatiecontract met user-level `sessionVersion`, zodat 7-daagse JWT-validatie nu werkt en later een apparaatgebonden sessierepository kan worden aangesloten zonder routers of authenticatiegrenzen te herschrijven.
- [x] **Documentatie — Sessiebesluit:** Documenteer de 7-daagse HttpOnly-JWT, claimset, revocatiebeperking en migratietriggers naar apparaatgebonden sessies in `ENGINEERING_HANDBOOK.md` en `TECHNICAL_HANDOVER.md`.
- [x] **Financiële kern — Decimal contract:** Implementeer een pure gedeelde domeinmodule met decimale rekenkunde, eurocenten voor bedragen, basispunten voor rendement en expliciete half-up-afronding uitsluitend op vastgelegde grenzen.
- [x] **Financiële kern — Compounding:** Implementeer maandelijkse samengestelde interest met conservatieve einde-maandinleg, documenteer formule en aannames, en voeg bekende referentie-, nul-, negatieve-rente-, maximale-looptijd- en invoergrenstests toe.
- [x] **Financiële kern — Portefeuillerisico:** Implementeer waardegewogen risicoscore op positieomvang, valideer de 1–5-schaal en blokkeer risicoscore/recommendations bij ontbrekende of ongeldige ETF-risicodata zonder middenscorefallback.
- [x] **Financiële kern — Analyse-integratie:** Laat de Compounding Simulator en Portfolio Checker uitsluitend de nieuwe deterministische domeinuitkomsten gebruiken en toon een expliciete onvolledige-datastatus zonder cijfers te fabriceren.
- [x] **Documentatie — Financiële formules:** Maak `docs/financial-calculation-contract.md` met alle formules, motivaties/bronnen, eenheden, timing, afrondingsregels, validatiegrenzen en gekoppelde referentiecases.
