# Senior Software Architect Quality Audit

**Platform:** Trimilix  
**Auditdatum:** 16 juli 2026  
**Auteur:** Manus AI  
**Status:** Ter goedkeuring — verdere functionaliteitsbouw gepauzeerd

## Executive summary

Trimilix heeft een **bruikbaar en modern MVP-fundament**. De combinatie van React, tRPC, Zod, Drizzle en een stateless Express-runtime geeft end-to-end typeveiligheid, duidelijke API-procedures en een redelijke basis voor gecontroleerde groei. De huidige website is visueel rustig, responsief en functioneel. Autorisatie op gebruikersobjecten is aantoonbaar verbeterd en door regressietests beschermd. De productiebuild, typecontrole, tests, secret-scan en dependency-audit waren tijdens de nulmeting groen.[1](./audit-inventory.txt) [3](./audit-code-quality.txt)

Het platform is echter **nog niet gereed voor versnelde publieke SaaS-uitbouw of een brede productierelease**. De voornaamste redenen zijn ontbrekende HTTP-hardening en rate limiting, onvoldoende testdekking van financiële kernlogica, een niet-aangetoonde reproduceerbare migratie- en herstelketen, een te grote niet-gesplitste frontendbundel, ontbrekende operationele observability en een architectuur die nog te veel verantwoordelijkheden in pagina's, één router en één databasehelper concentreert.[4](./audit-architecture.txt) [5](./audit-security.txt) [6](./audit-performance.txt)

> **Architectuurbesluit:** behoud de huidige stack en evolueer naar een goed gestructureerde **modulaire monoliet**. Een herschrijving of microservicesmigratie is niet gerechtvaardigd. Voer na goedkeuring van dit rapport eerst een stabilisatiesprint uit; bouw pas daarna nieuwe productfunctionaliteit.

## Besluit en gereedheidsstatus

| Gebied | Status | Senior-architectoordeel |
|---|---:|---|
| Professionele website en UX | Voorwaardelijk voldoende | Rustig, leesbaar en bruikbaar, maar nog niet overal productwaardig door merk- en taalconsistentie, desktopnavigatie en zichtbare placeholder-/mockfunctionaliteit. |
| Codeonderhoudbaarheid | Matig | Typeveilig fundament, maar grote pagina's, centrale router/databasehelper en gemengde verantwoordelijkheden maken verdere groei onnodig kostbaar. |
| Architectuur en schaalbaarheid | Voorwaardelijk voldoende voor MVP | De stack kan meegroeien, maar paginering, batching, servicegrenzen, transacties, rate limiting en caching ontbreken. |
| Beveiliging en privacy | Onvoldoende voor brede publieke release | Objectautorisatie is goed verbeterd; HTTP-hardening, token-/PII-opslag, sessiebeleid, startupvalidatie en opslagautorisatie vereisen actie. |
| Database | Matig | Goede basis met foreign keys en centbedragen; constraints, fractionele aandelen, migratiereproduceerbaarheid, audittrail en herstelbewijs ontbreken. |
| Prestaties | Matig | Lokale respons is snel, maar de clientbundel is groot en cold-start-/databasekosten zijn zichtbaar. Productiemeting ontbreekt. |
| Tests en operaties | Onvoldoende | Zeven tests vormen geen betrouwbare releasepoort voor financiële software; CI, health/readiness, centrale foutregistratie en aantoonbare restore ontbreken. |
| Documentatie | Voorwaardelijk voldoende | Sterk engineeringhandboek en goede doelarchitectuur, maar geen root-README en meerdere verouderde of operationeel onbewezen documenten. |
| Verder bouwen | **Conditionele no-go** | Eerst P0/P1-stabilisatie, daarna gecontroleerde featurebouw. |

De huidige code hoeft niet te worden weggegooid. Het platform is **geschikt als intern MVP en als basis voor stabilisatie**, maar niet als onbeperkt uitbreidbare productiearchitectuur zonder de hieronder beschreven correcties.

## Auditomvang en methode

De audit omvatte broncode, projectstructuur, afhankelijkheden, scripts, routering, database-access, financiële analysecode, authenticatie, OAuth, sessies, storageproxy, databaseschema, migratie-inventaris, tests, buildoutput, lokale runtimeheaders, recente logs, desktop- en mobiele kernschermen en de aanwezige architectuur- en operationele documentatie.[1](./audit-inventory.txt) [2](./audit-ux-source.txt) [5](./audit-security.txt) [6](./audit-performance.txt) [7](./audit-documentation.txt)

De kwaliteitsketen bestond uit TypeScript-controle, Vitest, secret-scanning, dependency-audit en productiebuild. Visuele controles omvatten de homepagina, registratie, login, dashboard, portfolio, ETF-checker, doelplanner en simulator op desktop en mobiel. De audit was **niet** gelijk aan een externe penetratietest, formele privacy-juridische beoordeling, productie-loadtest of een daadwerkelijk disaster-recovery-experiment. Waar operationeel bewijs ontbrak, is de controle als *niet aangetoond* geclassificeerd en niet als gerealiseerd.

## Wat is goed

### Technisch fundament

De tRPC-grens deelt types tussen client en server zonder runtime-import van servercode in de browser. Zod valideert procedure-inputs, Drizzle parameteriseert databasequery's en de server kan stateless worden uitgevoerd. Deze keuzes passen bij een vroege SaaS en ondersteunen een modulaire monoliet zonder onnodige infrastructuurcomplexiteit.[4](./audit-architecture.txt) [9](./server/routers.ts) [10](./server/db.ts)

De projectstandaarden leggen evidence-based oplevering, security-by-design, schaaltriggers, provideronafhankelijkheid en reversibele architectuurbeslissingen vast. Dat is een sterkere governancebasis dan bij veel MVP's aanwezig is.[18](./ENGINEERING_HANDBOOK.md) [19](./docs/architecture.md)

### Autorisatie en gegevensisolatie

Beschermde en adminprocedures zijn expliciet gescheiden. Portfolio-, doel- en abonnementsgegevens gebruiken beschermde procedures; ETF-mutaties vereisen een adminrol. Objectautorisatie van portefeuilles is in de data-accesslaag gekoppeld aan zowel object-ID als gebruiker-ID en wordt door regressietests bewaakt.[9](./server/routers.ts) [10](./server/db.ts) [12](./server/_core/trpc.ts)

De OAuth-callback bindt de flow aan een eenmalige nonce in een `__Host-`-cookie. Sessietokens worden met een expliciet algoritme gevalideerd en verlopen tokens worden geweigerd. De applicatiequery's gebruiken parameterbinding en de secret-scan vond geen gecommitteerde geheimen.[5](./audit-security.txt) [13](./server/_core/oauth.ts) [14](./server/_core/sdk.ts)

### Datamodel

Het schema heeft primaire sleutels, relevante unieke sleutels en foreign keys met cascaderende verwijdering voor portefeuille-afhankelijke records. Geldbedragen worden in gehele centen opgeslagen, waardoor binaire floating-pointafwijkingen worden vermeden.[8](./drizzle/schema.ts)

### Gebruikerservaring

De website is visueel rustig, leesbaar en financieel doelgericht. De zwarte, witte en gouden Trimilix-identiteit is consistent zichtbaar op de gecontroleerde schermen. De mobiele opbouw is in de kern bruikbaar en de formulieren zijn begrijpelijk. Het dashboard en de tools hebben een heldere taakindeling en tonen geen onnodig drukke interface.[2](./audit-ux-source.txt) [25](./audit-worknotes.md)

### Build- en documentatiebasis

De bestaande kwaliteitscommando's werken en de gecontroleerde build was groen. Het engineeringhandboek, de architectuurbeschrijving, ADR's en operationele runbooks geven een bruikbaar normenkader. De runbooks zijn bovendien eerlijk over wat ontwerpdoel is en wat nog operationeel bewezen moet worden.[3](./audit-code-quality.txt) [18](./ENGINEERING_HANDBOOK.md) [20](./docs/operations/monitoring-sli.md) [21](./docs/operations/backup-recovery.md)

## Wat absoluut verbeterd moet worden

Onderstaande punten zijn release- of groeiblokkers. **P0** betekent direct beveiligen vóór publieke blootstelling; **P1** betekent oplossen in de eerste stabilisatiesprint vóór verdere functionele groei.

| Prioriteit | Verbetering | Waarom dit blokkeert | Acceptatiecriterium |
|---:|---|---|---|
| P0 | HTTP-hardening invoeren | CSP, HSTS, `X-Content-Type-Options`, framebeperking, Referrer-Policy en Permissions-Policy zijn niet aangetoond; Express identificeert zichzelf via `X-Powered-By`.[5](./audit-security.txt) | Geautomatiseerde headertest is groen; productie- en previewbeleid zijn expliciet gescheiden; CSP veroorzaakt geen functionele regressies. |
| P0 | Publieke storageproxy begrenzen | Iedere padwaarde kan met een server-side sleutel naar een presigned URL worden vertaald, zonder eigenaar- of namespacecontrole.[15](./server/_core/storageProxy.ts) | Alleen expliciete publieke assets zijn publiek; privéobjecten vereisen ingelogde gebruiker, metadata-eigenaarschap en niet-raadbare sleutels. |
| P1 | Rate limiting en requestlimieten invoeren | OAuth-, tRPC- en storageroutes hebben geen aantoonbaar misbruikbeleid; de centrale JSON/form-limiet is 50 MB.[4](./audit-architecture.txt) [5](./audit-security.txt) | Per routeklasse bestaan account/IP-limieten, kleine standaardbodylimieten, gecontroleerde uitzonderingen, metrics en tests. |
| P1 | Sessie- en tokenbeleid verharden | Normale sessies zijn zeer lang geldig; revocatie, rotatie en devicebeheer ontbreken. De previewfallback gebruikt JavaScript-toegankelijke opslag.[14](./server/_core/sdk.ts) [16](./client/src/main.tsx) | Kortere sessie, expliciete `iss`/`aud`/app-binding, revocatie- of rotatiestrategie en geen productie-bearertoken in webstorage. |
| P1 | PII-opslag in browser minimaliseren | De auth-hook schrijft het volledige gebruikersobject naar `localStorage` en verwijdert dit niet aantoonbaar bij logout.[17](./client/src/_core/hooks/useAuth.ts) | Alleen strikt noodzakelijke niet-gevoelige velden worden tijdelijk bewaard, of opslag vervalt volledig; logout wist alle lokale identiteit. |
| P1 | Fail-fast configuratievalidatie | Kritieke omgevingsvariabelen kunnen als lege string worden gelezen, waardoor een fout geconfigureerde runtime kan starten.[5](./audit-security.txt) | Startup stopt met een duidelijke fout bij ontbrekende/ongeldige JWT-, database-, OAuth- en storageconfiguratie; tests dekken negatieve gevallen. |
| P1 | Financiële kern volledig testen | Samengestelde interest, maandinleg, afronding, grenswaarden, risicoscore en ontbrekende ETF-data hebben geen aantoonbare unittests.[6](./audit-performance.txt) [11](./server/portfolioAnalysis.ts) | Deterministische domeintests dekken happy paths, randen, fouten, afronding en bekende referentiecases. |
| P1 | Database- en migratieketen bewijzen | De schema- en migratie-inventaris gaf tegenstrijdige signalen; een schone opbouw, rollback en restore zijn niet bewezen.[5](./audit-security.txt) [21](./docs/operations/backup-recovery.md) | Lege database migreert in CI naar huidig schema; rollback-/forwardstrategie is getest; geïsoleerde restore levert aantoonbaar consistente data. |
| P1 | CI als verplichte releasepoort | De lokale verify-opdracht is bruikbaar, maar een afgedwongen CI-workflow is niet zichtbaar.[6](./audit-performance.txt) | Iedere wijziging vereist typecheck, tests, secret-scan, dependency-audit, build en migratiecontrole voordat merge/release mogelijk is. |
| P1 | Observability en operationele basis realiseren | Health/readiness, request-ID's, centrale foutregistratie, p95/error-ratealerts en operationeel restorebewijs zijn niet aangetoond.[6](./audit-performance.txt) [20](./docs/operations/monitoring-sli.md) | Health/readiness, gestructureerde logs, foutregistratie, dashboards, alerts, eigenaarschap en periodiek herstelbewijs zijn operationeel. |
| P1 | Frontendbundel splitsen | De productiebuild bevat één hoofdchunk van circa 1,19 MB minified JavaScript; route-lazy-loading ontbreekt.[6](./audit-performance.txt) | Kernroutes laden afzonderlijk; ongebruikte modules zijn verwijderd; bundlebudget en mobiele Web Vitals worden in CI/monitoring bewaakt. |
| P1 | Schaalbare querypatronen invoeren | Lijsten zijn onbegrensd en portfolioanalyse gebruikt seriële ETF-detailopvragingen.[4](./audit-architecture.txt) | Cursorpaginering, batchquery's, querylimieten en meetbare p95-databasetijden zijn aanwezig. |

## Wat later verbeterd kan worden

Deze punten zijn belangrijk, maar mogen na de P0/P1-stabilisatie gefaseerd worden uitgevoerd.

| Thema | Latere verbetering | Aanbevolen moment |
|---|---|---|
| Domeinarchitectuur | Splits router, databasehelpers en frontendpagina's per featuredomein: `portfolio`, `etf`, `goals`, `subscriptions` en later `billing`. | Direct na stabilisatie, vóór meerdere ontwikkelaars tegelijk aan dezelfde domeinen werken. |
| Servicelaag | Introduceer use-cases/services met expliciete domeinfouten, transacties en repositorygrenzen. | Wanneer mutaties meerdere tabellen of externe providers raken. |
| Datamodel | Ondersteun fractionele aandelen met vaste decimale precisie; leg eenheden voor TER en geldgrenzen vast. | Vóór echte broker-/portefeuille-import. |
| Constraints | Voeg database-enums/CHECKs en onderbouwde samengestelde indexen toe. | Samen met datamigratie en queryprofilering. |
| Audit en privacy | Voeg audit trail, retentie, export/verwijdering en dataclassificatie toe. | Vóór verwerking van echte klantportefeuilles op schaal. |
| UX | Harmoniseer Nederlandse terminologie, desktopnavigatie, lege toestanden, focusbeheer en zichtbare fout-/succesfeedback. | In de eerste product-UX-sprint na stabilisatie. |
| Branding | Verwijder oude template-/mocksporen en borg één Trimilix-designsysteem met tokens en componentrichtlijnen. | Wanneer kernflows functioneel en meetbaar stabiel zijn. |
| Caching | Voeg gericht cachingbeleid toe voor stabiele ETF- en marktmetadata, met invalidatie en providerlimieten. | Bij aansluiting van echte dataproviders of merkbare load. |
| Supply chain | Verwijder ongebruikte platformcomponenten en dependencies. | Tijdens modularisering en bundeloptimalisatie. |
| Betrouwbaarheid | Voeg beperkte loadtests, synthetic monitoring en foutbudgetten toe. | Vóór publieke groei en opnieuw bij iedere schaaltrigger. |

## Technische schuld

### Structurele schuld

De belangrijkste structurele schuld is de concentratie van verantwoordelijkheden. `server/routers.ts` en `server/db.ts` vormen centrale groeipunten; frontendlogica is hoofdzakelijk per grote pagina georganiseerd. Businessregels, persistentie, autorisatie en presentatie hebben nog onvoldoende expliciete domeingrenzen. Dit is geen reden voor een herschrijving, maar wel voor gecontroleerde extractie naar featuremodules en services.[3](./audit-code-quality.txt) [4](./audit-architecture.txt)

Een tweede verouderde serverentrypoint naast de werkelijk gebouwde runtime vergroot verwarring. Ongebruikte componenten zoals showcase-, chat-, kaart- en dashboardtemplateonderdelen vergroten cognitieve last, bundelrisico of supply-chainoppervlak als ze niet expliciet worden verwijderd of geïsoleerd.[4](./audit-architecture.txt)

### Kwaliteits- en testschuld

De testinfrastructuur werkt, maar de inhoudelijke dekking is zeer beperkt. Zeven tests controleren vooral logout, objectisolatie, rolbeveiliging en branding. Kritieke financiële berekeningen, databasegrenzen, foutpaden en end-to-endkernstromen blijven onbeschermd.[6](./audit-performance.txt)

### Data- en migratieschuld

Het datamodel laat geen fractionele ETF-aandelen toe. Meerdere domeinvelden missen databaseconstraints en de eenheid van `ter` is niet als formeel contract vastgelegd. Audittrail, soft-delete-/retentiebeleid, privacy-export en herstelbewijs ontbreken. De migratieketen moet vanaf een lege database reproduceerbaar worden gemaakt en als CI-controle worden vastgelegd.[8](./drizzle/schema.ts) [5](./audit-security.txt)

### Documentatieschuld

Er is geen root-README. Het engineeringhandboek is een sterk beleidsdocument, maar geen uitvoerbare onboarding. De oude CTO-baseline bevat claims die niet meer met de actuele code overeenkomen, de videodocumentatie noemt een logoasset nog als ontbrekend en een templateverwijzing gebruikt een andere bestandsnaam dan het aanwezige bestand.[7](./audit-documentation.txt) [22](./docs/cto-baseline-audit.md) [23](./docs/sprint-reviews/cto-sprint-audit-2026-07-16.md) [24](./docs/media/trimilix-video-series.md)

## Risicoregister

| Risico | Kans | Impact | Niveau | Beheersmaatregel |
|---|---:|---:|---:|---|
| Ongeautoriseerde toegang tot opslagobjecten via een gelekte of raadbare sleutel | Middel | Hoog | Kritiek | Publieke/private namespaces, metadata-eigenaarschap, authcontrole en korte presigned URL's. |
| XSS leidt tot uitlezen van bearer-token of lokaal gebruikersprofiel | Middel | Hoog | Hoog | CSP, geen productietoken in webstorage, minimale lokale data en securitytests. |
| Misbruik of kosten-/beschikbaarheidsincident door ontbrekende rate limits | Hoog | Hoog | Kritiek | Per route/account/IP-limieten, quotas, caching, metrics en alerts. |
| Financiële berekening geeft fout resultaat zonder testdetectie | Middel | Hoog | Hoog | Volledige domeintests, referentiecases, versiebeheer van rekenregels en review door domeinexpert. |
| Niet-herstelbare databasefout of mislukte migratie | Laag tot middel | Zeer hoog | Kritiek | Reproduceerbare migraties, geautomatiseerde back-up, geïsoleerde restoretests en gemeten RPO/RTO. |
| Cold starts en N+1-query's veroorzaken onvoorspelbare analysevertraging | Hoog bij groei | Middel tot hoog | Hoog | Batchqueries, paginering, auth-write verwijderen, caching en cold/warm-p95meting. |
| Grote clientbundel verlaagt conversie en mobiele bruikbaarheid | Hoog | Middel | Hoog | Route-splitting, bundlebudget, dependencyreductie en Web Vitals-monitoring. |
| Centrale router/databasehelper wordt ontwikkelknelpunt | Hoog | Middel | Hoog | Featuremodules, services, repositories, eigenaarschap en gerichte contracttests. |
| Conflicterende documentatie stuurt releasebeslissingen verkeerd | Middel | Middel | Middel | Documentindex, status/owner/verified-at, archivering en linkvalidatie. |
| Operationele runbooks worden ten onrechte als gerealiseerde controle beschouwd | Middel | Hoog | Hoog | Evidence-register, periodieke oefeningen, dashboards en expliciete controleeigenaren. |

## Aanbevolen doelarchitectuur

De passende doelarchitectuur is een **modulaire monoliet** met behoud van React, tRPC, Zod en Drizzle. Iedere featuremodule krijgt een eigen router, inputschema's, servicelaag, repository/data-access en tests. De router blijft verantwoordelijk voor transport, authenticatie en inputvalidatie; services bevatten use-cases, transacties en domeinbeleid; repositories isoleren querydetails. Externe marktdata, betalingen en notificaties worden achter providerinterfaces geplaatst.[18](./ENGINEERING_HANDBOOK.md) [19](./docs/architecture.md)

| Laag | Verantwoordelijkheid | Verboden verantwoordelijkheid |
|---|---|---|
| React route/component | Presentatie, lokale interactie, toegankelijke states | Financiële domeinregels of directe databasekennis |
| tRPC-router | Transport, auth, inputvalidatie, mapping van domeinfouten | Lange businessflows of losse queryorkestratie |
| Service/use-case | Businessregels, transacties, autorisatiebeleid dat domeincontext vereist | HTTP- of UI-details |
| Repository | Efficiënte, gepagineerde en geïndexeerde data-access | Presentatielogica of provider-UI |
| Provideradapter | Externe API-contracten, retry/circuitbeleid, normalisatie | Productdomeinbeslissingen |
| Platformlaag | Auth, logging, rate limiting, opslag, configuratie | Feature-specifieke businesslogica |

Microservices worden pas overwogen wanneer meetbare schaaltriggers, onafhankelijk releasebeheer, compliance-isolatie of teamgrenzen dit rechtvaardigen. Tot die tijd zou opsplitsing vooral operationele complexiteit en foutoppervlak toevoegen.

## Aanbevolen verbeterplan

### Fase A — Stabilisatie en releaseblokkades

Deze fase start uitsluitend na goedkeuring van dit rapport en bevat geen nieuwe productfunctionaliteit. De focus ligt op HTTP-hardening, storageautorisatie, rate limiting, veilige configuratie, sessie-/browseropslag, financiële tests, migratiebewijs, CI, health/readiness, foutregistratie en eerste bundle-splitting.

**Exitcriterium:** alle P0/P1-punten hebben code, tests en operationeel bewijs; de volledige kwaliteitsketen is verplicht groen; een schone migratie en geïsoleerde restore zijn aangetoond.

### Fase B — Modularisering zonder gedragswijziging

Splits de router, database-access en grote pagina's per featuredomein. Introduceer services, repositories, domeinfouten, transacties, paginering en batchquery's. Verwijder het verouderde serverentrypoint en ongebruikte templatecode.

**Exitcriterium:** gebruikersgedrag blijft gelijk, contract- en integratietests zijn groen, afhankelijkheden lopen in één richting en geen featuremodule leest direct de interne tabellen van een ander domein.

### Fase C — Productkwaliteit en meetbare prestaties

Verbeter desktopnavigatie, terminologie, toegankelijkheid, foutfeedback en design-systemconsistentie. Voer productieachtige cold/warmmetingen, Web Vitals, bundlebudgetten en beperkte loadtests uit. Activeer observability en incident-/herstelprocessen.

**Exitcriterium:** afgesproken p95-, foutpercentage-, beschikbaarheids- en Web Vitals-doelen zijn meetbaar en hebben eigenaarschap.

### Fase D — Nieuwe functionaliteit

Pas na de bovenstaande gates worden nieuwe productfeatures toegevoegd. Iedere feature krijgt vooraf een domeincontract, privacy-/securityanalyse, datamigratieplan, teststrategie en meetbare acceptatiecriteria.

## Voorgestelde eerste stabilisatiebacklog

| Volgorde | Werkpakket | Resultaat |
|---:|---|---|
| 1 | Security baseline | Headers, requestlimieten, rate limits, storagepolicy, configuratievalidatie en sessiebeleid. |
| 2 | Test baseline | Financiële unit tests, autorisatie-/negatieve tests, database-integratietests en kern-e2e. |
| 3 | Database assurance | Reproduceerbare migraties, constraintsbesluit, back-up- en restorebewijs. |
| 4 | CI en operationele basis | Verplichte verify-gate, health/readiness, request-ID, foutregistratie, SLI's en alerts. |
| 5 | Performance quick wins | Route-splitting, dependencyreductie, paginering, batchqueries en auth-writeoptimalisatie. |
| 6 | Modulaire monoliet | Featuremodules, services, repositories, transacties en expliciete foutcontracten. |
| 7 | Documentatiebron van waarheid | Root-README, documentindex, archivering, eigenaars en verificatiedata. |
| 8 | UX/productpolish | Navigatie, taal, toegankelijkheid, feedback en componentconsistentie. |

## Goedkeuringspoort

**Er worden geen nieuwe functionaliteiten gebouwd totdat de gebruiker dit rapport expliciet heeft goedgekeurd.** Goedkeuring van het rapport betekent niet dat de huidige website productierijp wordt verklaard; het betekent dat de voorgestelde prioriteiten en doelarchitectuur als basis voor de stabilisatiesprint mogen worden gebruikt.

Na goedkeuring is de aanbevolen eerstvolgende opdracht:

> Voer uitsluitend Fase A uit als stabilisatiesprint. Lever per P0/P1-punt bewijs via tests, meetresultaten, migratie-/restoreverslagen en bijgewerkte documentatie. Start geen nieuwe productfeatures voordat de exitcriteria van Fase A zijn behaald.

## Referenties en auditbewijs

1. [Projectinventaris en kwaliteitsnulmeting](./audit-inventory.txt)
2. [Frontend- en UX-broncodescan](./audit-ux-source.txt)
3. [Codekwaliteitsmeting](./audit-code-quality.txt)
4. [Architectuurmeting](./audit-architecture.txt)
5. [Beveiligingsmeting](./audit-security.txt)
6. [Prestatie-, test- en operationele meting](./audit-performance.txt)
7. [Documentatie-inventaris](./audit-documentation.txt)
8. [Drizzle-databaseschema](./drizzle/schema.ts)
9. [tRPC-applicatierouter](./server/routers.ts)
10. [Database-accesslaag](./server/db.ts)
11. [Portefeuille-analysemodule](./server/portfolioAnalysis.ts)
12. [tRPC-authgrenzen](./server/_core/trpc.ts)
13. [OAuth-callback](./server/_core/oauth.ts)
14. [Sessie- en identity-SDK](./server/_core/sdk.ts)
15. [Storageproxy](./server/_core/storageProxy.ts)
16. [Frontend-APIbootstrap](./client/src/main.tsx)
17. [Authenticatiehook](./client/src/_core/hooks/useAuth.ts)
18. [Engineering Handbook](./ENGINEERING_HANDBOOK.md)
19. [Architectuurdocument](./docs/architecture.md)
20. [Monitoring- en SLI-runbook](./docs/operations/monitoring-sli.md)
21. [Back-up- en herstelrunbook](./docs/operations/backup-recovery.md)
22. [Eerdere CTO-baselineaudit](./docs/cto-baseline-audit.md)
23. [CTO-sprintreview van 16 juli 2026](./docs/sprint-reviews/cto-sprint-audit-2026-07-16.md)
24. [Video- en mediaplan](./docs/media/trimilix-video-series.md)
25. [Geconsolideerde interne auditnotities](./audit-worknotes.md)
