# Trimilix Fase A — Stabilisatie-her-audit

**Auditdatum:** 16 juli 2026  
**Auteur:** Manus AI  
**Scope:** uitsluitend de goedgekeurde Fase A-stabilisatie; geen nieuwe productfunctionaliteit  
**Beoordelingsvolgorde:** veiligheid, betrouwbaarheid, onderhoudbaarheid, schaalbaarheid, prestaties, functionaliteit en design  
**Eindoordeel:** **go voor gecontroleerde vervolgbouw; conditionele no-go voor een brede betalende productierelease**

## 1. Managementsamenvatting

De oorspronkelijke senior-architectaudit kwalificeerde Trimilix als een bruikbaar MVP-fundament, maar gaf een **conditionele no-go** voor verdere functionele groei en een brede productierelease. De releaseblokkades betroffen HTTP- en storagebeveiliging, requestgrenzen en rate limiting, sessie- en browserprivacy, runtimeconfiguratie, financiële kernlogica, database- en herstelbewijs, CI, observability, bundelomvang, onbegrensde querypatronen en een dubbel serverentrypoint.[1]

Fase A heeft alle geïdentificeerde **code- en repositorygebonden P0/P1-maatregelen** geïmplementeerd en met regressies, builds, migratiecontroles, een geïsoleerde rollback-/restore-rehearsal, read-only live-equivalentie en runtime-smokes bewezen. De finale kwaliteitsketen omvat 15 testbestanden en **98 geslaagde tests**, tegenover 7 tests in de nulmeting: een factor **14,00**. De initiële JavaScriptgrafiek daalde van 1.187.997 naar 647.652 raw bytes, een reductie van **45,48%**; gzip daalde indicatief met **41,34%**. De officiële migrator is geconvergeerd op `0000`–`0008`; negen CHECK-constraints en vier gerichte indexen zijn live aanwezig; de geïsoleerde restore leverde voor zes tabellen gelijke rijaantallen en SHA-256-checksums op.[2] [3]

De stabilisatiesprint rechtvaardigt daarom een **go voor gecontroleerde Fase B-vervolgbouw** binnen de bestaande modulaire monoliet, bij voorkeur eerst modularisering en verdere contract-/integratietests. Dit oordeel is uitdrukkelijk **geen onvoorwaardelijke productieverklaring**. Een brede betalende release blijft geblokkeerd totdat externe monitoring en alerts operationeel zijn, providerback-upretentie en meetbare RPO/RTO zijn bewezen, branch-/mergebescherming buiten de repository is ingesteld en productieachtige load-, cold-start- en Web Vitals-metingen groen zijn. Betalingen, marktdata en overige nieuwe productflows blijven buiten deze audit.

> **Besluit:** de oorspronkelijke bouwstop voor P0/P1-codehardening kan worden opgeheven. Vervolgontwikkeling mag gecontroleerd starten, maar productie-exposure, betalingen en schaalvergroting blijven onder de expliciete releasevoorwaarden uit hoofdstuk 9.

## 2. Auditmethode en bewijsgrenzen

De her-audit vergelijkt de oorspronkelijke bevindingen en acceptatiecriteria met de actuele code, tests, migratieketen, live read-only databasesignalen, runtimegedrag, buildartefacten en operationele documentatie.[1] [2] De finale verificatie is na de laatst gevonden Portfolio Checker-auth-UX-afwijking volledig opnieuw uitgevoerd; er wordt dus niet gesteund op een tussenstand.

| Bewijscategorie   | Uitgevoerde controle                                                                     |                         Bewijsstatus |
| ----------------- | ---------------------------------------------------------------------------------------- | -----------------------------------: |
| Codekwaliteit     | TypeScript, Vitest, statische architectuurcontracten                                     |                                Groen |
| Supply chain      | Secret-scan, OSV-productieaudit, ongebruikte-directe-dependencyaudit                     |                                Groen |
| Productiebouw     | Vite/Express-build, manifest, bundlebudgetten                                            |                                Groen |
| Database          | Officiële migrator, live schema-/journal-equivalentie, capability- en constraintcontrole |                                Groen |
| Herstel           | Geïsoleerde clean build, negatieve constraints, rollback, restorechecksums               |   Groen binnen repository-/testscope |
| Runtime           | Fail-closed database-startupgate, liveness, readiness, request-ID en veilige logs        |                                Groen |
| Lokale belasting  | Begrensde health/readiness-baseline                                                      | Groen; geen productiecapaciteitstest |
| Visueel           | Desktop en 390×844 voor home, ETF Checker en authgrens Portfolio Checker                 |   Groen binnen gecontroleerde routes |
| Externe operaties | Collector, dashboards, alerts, branch protection, provider-PITR/RPO/RTO                  |            Niet operationeel bewezen |

De her-audit is geen externe penetratietest, juridische/privacybeoordeling, productie-loadtest of verificatie van de hostingproviderback-ups. Deze grenzen worden niet als groen gepresenteerd.

## 3. Nieuw gereedheidsoordeel

| Gebied                          |              Voor Fase A |                                             Na Fase A | Senior-architectoordeel                                                                                                                                    |
| ------------------------------- | -----------------------: | ----------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beveiliging en privacy          |              Onvoldoende |         Voldoende voor gecontroleerde MVP-vervolgbouw | De concrete P0/P1-codegaten zijn gesloten; externe pentest en operationele controls blijven releasevoorwaarden.                                            |
| Betrouwbaarheid financiële kern |      Onvoldoende bewezen |         Goed bewezen binnen vastgelegd domeincontract | Deterministische decimalen, centen, basispunten, half-up-afronding, bekende referentiecases en fail-closed risicodata zijn getest.[4]                      |
| Database en herstel             |       Matig/niet bewezen |                     Sterk binnen schema- en testscope | Clean build, live-equivalentie, officiële journalprefix, constraints, rollback en checksumrestore zijn bewezen; provider-PITR/RPO/RTO niet.                |
| CI en kwaliteit                 |              Onvoldoende |                              Goed op repositoryniveau | Least-privilege workflow en lokale `verify` bewaken typecheck, tests, scans, audits, migraties en build; externe branch protection is nog te configureren. |
| Observability                   |              Onvoldoende |           Technisch gereed, operationeel gedeeltelijk | Health/readiness, request-ID, JSON-logs, foutgrenzen en SLI-signalen bestaan; centrale collector, dashboards en alerts ontbreken.[5]                       |
| Prestaties                      |                    Matig |                                   Duidelijk verbeterd | Route-splitting, budgetten, cursorpaginering en batching zijn bewezen; productieachtige latency/Web Vitals/autoscaling ontbreken.                          |
| Architectuur                    | Voorwaardelijk voldoende | Voldoende voor gecontroleerde modulaire-monolietgroei | Canoniek entrypoint, adaptergrenzen en migratietriggers zijn vastgelegd; verdere featuredomeinmodularisering blijft Fase B-werk.                           |
| Brede betalende productie       |       Conditionele no-go |                                **Conditionele no-go** | Externe monitoring, back-up-SLA, productiebelasting, operationele ownership en payment-readiness moeten eerst groen zijn.                                  |
| Gecontroleerde vervolgbouw      |              Geblokkeerd |                                                **Go** | Nieuwe wijzigingen mogen starten onder dezelfde releasegates en architectuurtriggers.                                                                      |

## 4. P0/P1-sluitingsmatrix

### 4.1 Beveiliging en privacy

| Oorspronkelijk punt                          | Prioriteit | Geïmplementeerde maatregel                                                                                                | Bewijs                                        |                                            Status |
| -------------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------: |
| HTTP-hardening ontbreekt                     |         P0 | CSP, productie-HSTS, framebeperking, `X-Content-Type-Options`, Referrer- en Permissions-Policy; `X-Powered-By` verwijderd | Header- en requestgrensregressies             |                                          Gesloten |
| Publieke storageproxy is onbeperkt           |         P0 | Publieke allowlist; private namespace vereist authenticatie en eigenaarschapscontrole; neutrale fouten                    | Storagepolicy- en IDOR-regressies             |                                          Gesloten |
| Geen routeklasse-rate limits en 50 MB bodies |         P1 | Afzonderlijke OAuth-, tRPC- en storagepolicies; kleine standaardbodygrens; 413/429-contract; metrics/events               | Rate-limit- en HTTP-tests                     | Gesloten voor single-instance; schaaltrigger open |
| Lang sessiebeleid en zwakke claims           |         P1 | Maximaal zeven dagen; `iss`, `aud`, `sub`, app-binding, `jti`, `sessionVersion`; cookie/JWT één duurcontract              | Sessiebeveiliging- en logouttests             |                                          Gesloten |
| Bearertoken en profiel in webstorage         |         P1 | Productiebearerfallback verwijderd; geen volledig profiel in `localStorage`; legacydata gewist bij initialisatie/logout   | Clientauthopslagtests                         |                                          Gesloten |
| Kritieke configuratie kan leeg starten       |         P1 | Fail-fast validatie voor database, JWT, OAuth en storage met veilige foutclassificaties                                   | Negatieve configuratietests en schone startup |                                          Gesloten |

De limiterstore is bewust een lokale adapter. Dat is passend zolang één effectieve instance de quota bewaakt. Een gedeelde Redis- of edge-implementatie wordt verplicht bij meer dan één productie-instance, globale tenantquota, misbruik over instances, strengere SLA/compliance of multi-regionbediening.[6]

### 4.2 Financiële betrouwbaarheid

De financiële rekenregels zijn uit UI- en routerlogica naar een pure gedeelde domeinlaag verplaatst. Geldbedragen gebruiken eurocenten, rendementen basispunten en afronding gebeurt half-up op vastgelegde grenzen. Samengestelde interest gebruikt maandelijkse kapitalisatie met conservatieve einde-maandinleg. Portefeuillerisico is waardegewogen en wordt niet berekend wanneer ETF-risicodata ontbreekt of ongeldig is.[4]

| Contract      | Gedekte gevallen                                                                          | Faalgedrag                                            |
| ------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Compounding   | Referentiecase, nulwaarden, negatieve rente, maximale looptijd, maandinleg, invoergrenzen | Expliciete validatiefout                              |
| Decimalen     | Centen, basispunten, half-up-grenzen                                                      | Geen impliciete binaire afronding in domeinuitkomst   |
| Risicoscore   | Waardeweging, schaal 1–5, meerdere holdings                                               | Onvolledige status bij ontbrekende/ongeldige ETF-data |
| Aanbevelingen | Alleen op complete analyse-uitkomst                                                       | Geen gefabriceerde middenscore of aanbeveling         |

**Oordeel:** het oorspronkelijke P1-punt “financiële kern volledig testen” is gesloten voor de huidige functies. Nieuwe geldachtige flows activeren automatisch de vastgelegde transactie- en idempotency-architectuurpoort.

### 4.3 Database, migraties en herstel

TiDB CHECK-enforcement staat live aan. De runtime valideert vóór luisteren read-only de capability en exact negen benoemde constraints; timeout, database-uitval of constraintdrift stopt startup fail-closed. De officiële Drizzle-journalprefix bevat `0000`–`0008` met de lokale hashes en timestamps. De twee nullable ETF-constraints zijn bewust `CHECK (ter >= 0)` en `CHECK (riskScore BETWEEN 1 AND 5)`, zodat SQL-`UNKNOWN` en daarmee bestaande `NULL`-semantiek behouden blijven.[2] [3]

| Herstelbewijs                         |                     Resultaat |
| ------------------------------------- | ----------------------------: |
| Migraties vanaf lege database         |                 9/9 toegepast |
| Verwachte tabellen                    |                           6/6 |
| Benoemde CHECK-constraints            |                           9/9 |
| Gerichte indexen                      |                           4/4 |
| Ongeldige/negatieve waarden geweigerd |                      Geslaagd |
| Nullable ETF-data geaccepteerd        |                      Geslaagd |
| Atomische holding-upsert              |                      Geslaagd |
| Transactierollback                    |                      Geslaagd |
| Restorechecksums                      |     6/6 tabellen exact gelijk |
| Finale officiële generatie            |          Geen schemawijziging |
| Finale officiële migratie             | No-op op geconvergeerde keten |

De onverwacht gegenereerde `0008_sharp_wolverine.sql` is onderzocht, via de officiële migrator toegepast en behouden als snapshotnormalisatie. Een tweede generatie leverde geen `0009` op. De journalreconciliatie is idempotent en fail-closed gemaakt: zij accepteert uitsluitend een exact bewezen officiële prefix en wordt een veilige read-only no-op zodra de keten correct is.[3]

**Oordeel:** het repositorygebonden database-/migratiepunt is gesloten. Providerback-upretentie, PITR en formele productie-RPO/RTO blijven een afzonderlijke operationele releasevoorwaarde.

## 5. CI, observability en foutgrenzen

De workflow `.github/workflows/ci.yml` gebruikt least-privilege `contents: read`, immutable action-SHA’s, Node 22.13.0, pnpm 10.4.1 en een frozen lockfile. Zij bevat geen deploystap en gebruikt geen productiegeheimen. De gate voert typecheck, Vitest, secret-scan, OSV-audit, ongebruikte-dependencyaudit, geïsoleerde TiDB-herstelrehearsal en productiebuild uit.[2] [5]

De runtime schrijft privacyveilige JSON-lines met canonieke velden, request-ID, routeklasse, status en duur. Headers, cookies, requestbodies, tokens, openID, volledig IP-adres en financiële payloads worden niet als logvelden geaccepteerd. Onverwachte Express- en tRPC-fouten worden centraal gecorreleerd; publieke details en productie-stacktraces worden begrensd. `/healthz` is dependencyvrij; `/readyz` gebruikt een read-only `SELECT 1` met deadline.[5]

| Finale gate                      |                                                      Resultaat |
| -------------------------------- | -------------------------------------------------------------: |
| TypeScript                       |                                                     Nul fouten |
| Vitest                           |                                      15 bestanden; 98/98 tests |
| Secret-scan                      |                                    Nul high-confidence secrets |
| OSV-productieaudit               | 466 geïnstalleerde packageversies; nul blokkerende bevindingen |
| Ongebruikte directe dependencies |                               81 gecontroleerd; nul ongebruikt |
| Productiebuild                   |                                        Geslaagd; 2.399 modules |
| Startupvolgorde                  |                        Integriteitspreflight vóór luisterpoort |
| Verse blokkerende runtimefouten  |                                                   Nul gevonden |

De technische observabilitybasis is daarmee geïmplementeerd. De oorspronkelijke acceptatieformulering omvatte echter ook operationele dashboards, alerts en eigenaarschap. Omdat een externe collector en alertservice niet in deze repository kunnen worden geactiveerd of aangetoond, blijft dit deel **operationeel open** en blokkeert het een brede betalende release.

## 6. Performance- en schaalbaarheidsbewijs

Alle niet-home routes zijn lazy geladen en de build bewaakt minimaal vijf dynamische routes. De initiële statische JavaScriptgrafiek en de grootste async chunk hebben harde raw- en gzipbudgetten. De chartlibrary bevindt zich niet meer in de initiële routegrafiek.[2]

| Metriek                      |           Nulmeting |    Eindmeting |                         Verschil / budget |
| ---------------------------- | ------------------: | ------------: | ----------------------------------------: |
| Initiële/raw hoofdgrafiek    |     1.187.997 bytes | 647.652 bytes |                   −45,48%; budget 716.800 |
| Initiële gzip                | circa 327.320 bytes | 192.007 bytes |                   −41,34%; budget 215.040 |
| Grootste async raw           |   Niet afzonderlijk | 398.561 bytes |                            budget 435.200 |
| Grootste async gzip          |   Niet afzonderlijk | 110.857 bytes |                            budget 124.928 |
| Dynamische routes            |        0 aangetoond |  5 aangetoond |                                 minimum 5 |
| Ongebruikte directe packages |        Niet bewaakt |      0 van 81 | 9 bewezen ongebruikte packages verwijderd |

`portfolio.list` en `etf.list` gebruiken oplopende cursorpaginering met standaard 25 en maximum 100 resultaten. Portfolioanalyse haalt ETF-details in één gededupliceerde batchquery in plaats van per holding. Live read-only TiDB-plannen tonen een begrensde `IndexLookUp → Limit(26) → IndexRangeScan` voor portefeuilles en `Batch_Point_Get` op de unieke ETF-symbolenindex voor analyse.[2]

De lokale begrensde baseline gaf 100% succes: `/healthz` p95 22,87 ms over 200 requests bij concurrency 20; `/readyz` p95 295,76 ms over 80 requests bij concurrency 8. Deze cijfers bewijzen regressievrij lokaal gedrag, niet de productiecapaciteit of autoscalingprestatie.[2]

Een resterend schaalrisico is ETF-substringzoeken met `%term%`, dat een begrensde `TableRangeScan` gebruikt. Dit is acceptabel voor de huidige kleine catalogus, maar activeert een zoekindex/full-text-/extern-zoekbesluit vóór sterke catalogusgroei.

## 7. Architectuur- en onderhoudbaarheidsoordeel

De stack blijft terecht een modulaire monoliet. `server/_core/index.ts` is nu het enige development- en productie-entrypoint; het verouderde `server/index.ts` is verwijderd en deze invariant is statisch getest. Rate limiting, sessierevocatie en opslagbeleid hebben expliciete vervangingsgrenzen. Database-integriteit en financiële rekenregels zijn geïsoleerd en testbaar.[4] [6]

Fase A heeft enkele Fase B-quick wins meegenomen—paginering, batching, canonical entrypoint en adaptergrenzen—maar heeft de router, database-access en grote pagina’s niet volledig per featuredomein opgesplitst. Dat is bewust: een brede refactor tijdens security- en migratiehardening zou het wijzigingsrisico onnodig hebben vergroot.

**Aanbevolen eerstvolgende technische fase:** modulariseer `portfolio`, `etf`, `goals` en later `billing` zonder gedragswijziging. Houd tRPC-contracten stabiel, verplaats use-cases en repositories per domein en voeg contract-/integratietests toe voordat nieuwe complexe functionaliteit wordt gebouwd.

## 8. Visuele en functionele regressie

Desktop- en 390×844-controles bevestigden een volledige home/authweergave en ETF Checker zonder horizontale overflow. Een onmiddellijke mobiele capture toonde de verwachte lazy fallback; na laadtijd verscheen de volledige route. De eerste ongeauthenticeerde Portfolio Checker-capture vond een misleidende lege portefeuilletoestand. Dit is hersteld naar een expliciete, responsieve login-grens met uitsluitend user-triggered OAuth; beschermde inhoud wordt niet getoond. Na de fix zijn gerichte tests, typecheck, schone runtime en de volledige releasegate herhaald.[2] [7]

Dit bewijs is voldoende voor de gewijzigde routes, maar is geen volledige end-to-endtest van alle productfeatures, betalingen of authenticated gebruikersreizen.

## 9. Resterende risico’s en verplichte releasevoorwaarden

| ID          | Resterend risico                                                                                    | Impact                                                           | Verplicht vóór                                            | Maatregel / trigger                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| OPS-001     | Geen externe log-/metriccollector, dashboard of actieve alerts aangetoond                           | Incidenten kunnen te laat worden ontdekt                         | Brede betalende productie                                 | Collector aansluiten, retentie vastleggen, SLI-dashboard en geteste alertkanalen met eigenaar/runbook activeren        |
| DR-001      | Providerback-upretentie, PITR, restorebevoegdheid en meetbare RPO/RTO niet bewezen                  | Onbekend werkelijk gegevensverlies/hersteltijd                   | Betalende productie                                       | Providerinstellingen verifiëren, RPO/RTO vaststellen en periodieke restoreoefening met tijdmeting uitvoeren            |
| CI-001      | Branch protection/required checks is buiten repository niet bewezen                                 | Groene workflow kan organisatorisch worden omzeild               | Teammerge en productie                                    | Workflow als required check instellen; directe pushes naar releasebranch blokkeren                                     |
| PERF-001    | Geen productieachtige load-, cold-start-, Web Vitals- of autoscalingmeting                          | Capaciteit en gebruikerslatency onbekend                         | Brede publieke release                                    | Stagingtest met representatief volume, p95/p99, foutpercentage, DB-pool en Web Vitals; budgetten als releasegate       |
| SEC-001     | Geen onafhankelijke pentest of formele privacy-juridische beoordeling                               | Restrisico in auth, opslag en financiële gegevensverwerking      | Publieke financiële SaaS-lancering                        | Externe securityreview en privacy-/verwerkingsregister uitvoeren                                                       |
| SCALE-001   | In-memory limiter is niet globaal                                                                   | Quota verschillen over meerdere instances                        | >1 effectieve productie-instance of globale quota         | Redis-/edge-adapter activeren volgens bestaand contract                                                                |
| SEARCH-001  | `%term%` ETF-zoeken gebruikt een begrensde tablescan                                                | Latency groeit met catalogusvolume                               | Grote ETF-catalogus                                       | Zoekindex, full-text of extern zoekregister na volume-/latencymeting                                                   |
| SESSION-001 | Revocatie is user-wide, niet per apparaat                                                           | Eén logout trekt alle sessies in; geen deviceaudittrail          | Devicebeheer-/enterprise-eis                              | Adapter vervangen door hashed-`jti` sessierepository met retentie/privacycontract                                      |
| TEST-001    | Geen volledige geauthenticeerde browser-E2E-suite voor alle productflows                            | Cross-layer regressies kunnen buiten de 98 huidige tests blijven | Voor brede publieke release en complexe featuregroei      | Kernreizen voor login, portfolio, ETF, simulatie en foutpaden automatiseren met geïsoleerde testdata                   |
| MAINT-001   | Router, database-access en enkele pagina’s zijn nog niet volledig per featuredomein gemodulariseerd | Parallelle featurebouw verhoogt wijzigings- en mergekosten       | Vóór meerdere ontwikkelaars of complexe goals/billingbouw | Fase B uitvoeren met stabiele tRPC-contracten, services/repositories en contracttests                                  |
| DOC-001     | Root-documentindex/API-overzicht is nog niet als één instappunt geconvergeerd                       | Nieuwe engineers kunnen bewijs en runbooks moeilijker vinden     | Vóór teamuitbreiding                                      | Root-README/documentindex toevoegen die naar architectuur, handover, audit, financiële contracten en runbooks verwijst |
| PRODUCT-001 | Stripe-/betaalflow en marktdata zijn niet in Fase A gevalideerd                                     | Geen verantwoorde betaalde productflow                           | Betalingen of real-time premiumdata                       | Afzonderlijke domein-, idempotency-, webhook-, licentie-, security- en herstelgate uitvoeren                           |

## 10. Go/no-go-besluit

### 10.1 Go

Trimilix krijgt een **go voor gecontroleerde vervolgbouw** in development en staging. De oorspronkelijke P0/P1-codeblokkades zijn gesloten, de kwaliteitsketen is reproduceerbaar groen en de architectuur kan als modulaire monoliet verantwoord verder evolueren. Security-, database- en financiële kerninvarianten mogen niet worden verzwakt om nieuwe functionaliteit sneller te leveren.

### 10.2 Conditionele no-go

Trimilix houdt een **conditionele no-go voor een brede betalende productierelease**. Dit oordeel verandert pas wanneer minimaal `OPS-001`, `DR-001`, `CI-001` en `PERF-001` met operationeel bewijs zijn gesloten. Voor betalingen moet tevens `PRODUCT-001` worden gesloten. Een onafhankelijke security-/privacyreview is vereist vóór publieke positionering als financiële SaaS.

### 10.3 Vrijgavevoorwaarden voor de volgende fase

Vervolgwerk mag starten onder de volgende voorwaarden:

1. Iedere wijziging doorloopt de bestaande `pnpm verify`- en CI-gates.
2. Databasewijzigingen volgen schema-first, beoordeelde SQL, officiële migrator en geïsoleerde rehearsal.
3. Nieuwe geldachtige, webhook- of retrybare flows activeren het idempotencycontract vóór implementatie.
4. Horizontale schaal activeert een gedeelde limiterstore; grote ETF-catalogi activeren een zoekarchitectuurbesluit.
5. Nieuwe productfunctionaliteit krijgt vooraf domeincontract, privacy-/securityanalyse, migratieplan, tests en meetbare acceptatiecriteria.
6. Brede productiepublicatie vereist een afzonderlijke release review waarin de open operationele risico’s als groen bewijs worden getoond.

## 11. Formele afsluiting Fase A

| Exitcriterium                     |                   Resultaat |
| --------------------------------- | --------------------------: |
| P0-codepunten met code en tests   |                    Gesloten |
| P1-codepunten met code en tests   |                    Gesloten |
| Volledige kwaliteitsketen         |                       Groen |
| Schone migratie                   |                     Bewezen |
| Rollback-/restore-rehearsal       | Bewezen in geïsoleerde TiDB |
| Live schema-/journal-equivalentie |           Bewezen read-only |
| Runtime-startupintegriteit        |         Bewezen fail-closed |
| Operationele dashboards/alerts    |      Open buiten repository |
| Provider-RPO/RTO/PITR             |      Open buiten repository |
| Productiebelasting/Web Vitals     |                        Open |

Fase A is hiermee **technisch afgerond binnen de goedgekeurde repositoryscope**. De oude algemene bouwstop wordt vervangen door een gerichte releasepoort: gecontroleerde vervolgbouw is toegestaan, brede betalende productie niet.

## Referenties

1. [Oorspronkelijke senior-architectaudit](./QUALITY_AUDIT_2026-07-16.md)
2. [Finale Fase A-validatiebewijzen](./docs/research/phase-a-final-validation-evidence.md)
3. [Technical Handover en databaseherstelrunbook](./TECHNICAL_HANDOVER.md)
4. [Financieel rekencontract](./docs/financial-calculation-contract.md)
5. [Observability- en incidentrunbook](./OBSERVABILITY_RUNBOOK.md)
6. [Engineering Handbook en architectuurtriggers](./ENGINEERING_HANDBOOK.md)
7. [Finale desktop-/mobiele visuele smoke](./docs/research/phase-a-final-visual-smoke.md)
8. [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
9. [Kubernetes — Configure Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
10. [GitHub Docs — Building and testing Node.js](https://docs.github.com/actions/guides/building-and-testing-nodejs)
