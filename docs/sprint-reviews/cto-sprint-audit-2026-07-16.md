# CTO-sprintaudit — Trimilix fundering en marktdata-architectuur

**Project:** The Trimilix System™  
**Sprint/periode:** Fundering en CTO-baseline tot en met 16 juli 2026  
**Rapportdatum:** 16 juli 2026  
**Auteur:** Manus AI, in de rol van CTO-advisor  
**Beslisser:** Business Owner / CTO  
**Checkpoint:** Nieuw oplevercheckpoint wordt na deze audit aangemaakt

> Deze audit maakt onderscheid tussen **geïmplementeerd en lokaal bewezen**, **gedocumenteerd maar operationeel onbewezen**, en **gepland**. Er zijn geen productie-SLO’s, securitygaranties of herstelclaims zonder meetbaar bewijs.

## 1. Managementsamenvatting

Deze sprint heeft de bestaande MVP uitgebreid met een CTO-baseline die architectuur, eigenaarsgebonden gegevensbescherming, adminautorisatie, reproduceerbare kwaliteitsgates, dependencysecurity en een provideronafhankelijk marktdataontwerp vastlegt. De belangrijkste securitybevinding — een portefeuille-IDOR-risico waarbij een ingelogde gebruiker via een gekende ID gegevens van een andere portefeuille had kunnen benaderen — is in de datalaag en routerlaag gecorrigeerd en met regressietests afgedekt.

De volledige lokale kwaliteitsketen is op 16 juli 2026 geslaagd: TypeScript-typecheck, vijf Vitest-tests, high-confidence secretscan, OSV-audit van 495 geïnstalleerde productiepackageversies en de productiebuild. De applicatie is daarmee beter beheersbaar, maar nog niet productierijp bewezen. Centrale monitoring, rate limiting, hersteltests, browserflowtests, uitgebreide toegankelijkeheidstests, providerlicenties en een werkende marktdata-integratie ontbreken nog.

| Dimensie | Status | Korte toelichting |
|---|---|---|
| Scope | Groen | De geplande CTO-, security-, marktdata- en kwaliteitsdocumentatie is opgeleverd |
| Security | Oranje | Kritieke eigendomscontrole is hersteld; rate limiting, bredere tests en operationele detectie ontbreken |
| Betrouwbaarheid | Oranje | Build en regressietests slagen; geen productie-SLI’s of hersteltest |
| Performance | Oranje | Productiebuild slaagt, maar de hoofd-JavaScriptbundle is 1.186,54 kB geminificeerd |
| Kosten | Oranje | Providerselectie en activeringsgates zijn ontworpen; contract- en verbruiksdata ontbreken |
| Releasegereedheid | Oranje | Goede lokale baseline; productie-, browser-, monitoring- en herstelbewijs ontbreken |

## 2. Opgeleverde veranderingen

| Verandering | Gebruikers- of bedrijfswaarde | Bewijs | Status |
|---|---|---|---|
| Eigenaarsgebonden portefeuillequeries | Voorkomt cross-user inzage en analyse | `server/db.ts`, `server/routers.ts`, `server/authorization.test.ts` | Geïmplementeerd en lokaal bewezen |
| Admin-only ETF-beheer | Beschermt catalogusintegriteit | Routerautorisatie en regressietest | Geïmplementeerd en lokaal bewezen |
| Uitgesplitste portfolioanalyse | Vermindert verantwoordelijkheid in `db.ts` en lost exportconflict op | `server/portfolioAnalysis.ts`, succesvolle build | Geïmplementeerd en lokaal bewezen |
| Reproduceerbare verify-keten | Eén commando voor typecheck, tests, securityscans en build | `package.json`, `scripts/`, geslaagde `pnpm verify` | Geïmplementeerd en lokaal bewezen |
| Dependencyremediatie | Verlaagt bekende productiepackagekwetsbaarheden | Lockfile, overrides/resolution hooks en geslaagde OSV-audit | Geïmplementeerd en lokaal bewezen |
| Architectuur- en ADR-baseline | Maakt grenzen, trust boundaries en beslissingen reviewbaar | `docs/architecture.md`, `docs/adr/` | Gedocumenteerd |
| Provideronafhankelijk marktdataontwerp | Maakt EOD-MVP en latere betaalde real-timefase verwisselbaar | `docs/market-data-architecture.md` | Gedocumenteerd; niet geïmplementeerd |
| Monitoring- en herstelstandaarden | Definieert vereiste SLI’s, alarmen, RPO/RTO-richting en restorebewijs | `docs/operations/` | Gedocumenteerd; niet operationeel bewezen |

## 3. Architectuur en beslissingen

| ADR of ontwerp | Beslissing | Positief gevolg | Kost of risico | Reviewtrigger |
|---|---|---|---|---|
| ADR 0001 | Start als modulaire monoliet | Lage operationele complexiteit en snelle wijzigbaarheid | Grenzen moeten actief bewaakt worden | Aantoonbare schaal- of teambelemmering |
| ADR 0002 | Marktdata achter een intern providercontract | Providerwissel zonder UI-contractwijziging | Adapter-, normalisatie- en testwerk | Nieuwe provider of premium real-timeactivatie |
| Marktdata-architectuur | EOD/delayed voor MVP; real-time alleen na business- en licentiegates | Beperkt vaste kosten en licentierisico | Geen real-timepropositie in MVP | Positieve unit economics en voldoende betalende vraag |
| Failoverbeleid | Transparante livefailover alleen met schriftelijk bewijs; anders expliciete degradatie | Voorkomt stille contract- en datakwaliteitsfouten | Minder “magische” beschikbaarheid | Contract- of providerwijziging |

De modulaire monoliet blijft proportioneel voor de huidige omvang. Er is geen bewijs dat microservices, Kubernetes of permanente infrastructuur nu bedrijfswaarde toevoegen. Splitsing wordt pas overwogen bij gemeten bottlenecks, releasefrictie of onafhankelijke eigendomsgrenzen.

## 4. Securityreview

| Controle | Resultaat | Bewijs | Resterend risico | Prioriteit |
|---|---|---|---|---|
| Authenticatie en sessies | Bestaande Manus OAuth-flow; logouttest slaagt | `server/auth.logout.test.ts` | Geen uitgebreide callback-, sessieverloop- of browserflowtest | P1 |
| Portefeuilleautorisatie | User-ID stroomt tot in de query; cross-user pad retourneert geen data | Vier autorisatieregressietests | Andere toekomstige entiteiten moeten hetzelfde patroon volgen | P0-regel behouden |
| ETF-beheer | Mutaties vereisen adminrol | Autorisatietest en routercode | Adminacties nog niet centraal geaudit | P1 |
| Inputvalidatie | tRPC-inputs gebruiken schema’s | Routercode en typecheck | Geen systematische grenswaardefuzzing | P2 |
| Secrets | Geen high-confidence hardcoded secrets gevonden | `scripts/scan-secrets.mjs`, geslaagde scan | Lokale scanner vervangt geen repository-/platformsecret scanning | P1 |
| Dependencies | OSV meldt geen kwetsbaarheden in 495 geïnstalleerde productiepackageversies | `scripts/audit-dependencies.mjs` | Nieuwe advisories na auditdatum blijven mogelijk; pnpm-hook is onderhoudslast | P1 |
| Rate limiting | Niet aanwezig | Baselineaudit | Misbruik, scraping, auth- en providerkostenrisico | P1 vóór publieke schaal |
| Securityheaders/CSP | Niet als gate bewezen | Baselineaudit | Browseraanvalsoppervlak onvoldoende gemeten | P1 |
| Logging/privacy | Norm vastgelegd; geen centrale logaudit | Handbook en monitoringdocument | Gevoelige data kan zonder redactietest lekken | P1 |
| Marktdata-abuse control | Ontworpen via entitlements, quota en kill switch | Marktdata-architectuur | Nog niet geïmplementeerd | P0 vóór providerproductie |

Het verholpen IDOR-risico was de belangrijkste bevinding van deze sprint. Het patroon “eerst ophalen op ID, daarna in applicatiecode eigenaar vergelijken” wordt niet gebruikt; eigenaarschap wordt in de queryvoorwaarde afgedwongen.

## 5. Test- en kwaliteitsrapport

De finale kwaliteitsrun op 16 juli 2026 is volledig geslaagd.

| Kwaliteitsgate | Methode | Resultaat |
|---|---|---|
| Typecheck | `tsc --noEmit` | Geslaagd |
| Unit- en regressietests | `vitest run` | 2 testbestanden; 5/5 tests geslaagd |
| Secretscan | Lokale high-confidence scanner | Geslaagd; geen bevindingen |
| Productiedependencyaudit | OSV batchaudit van geïnstalleerde productiegraph | Geslaagd; 495 packageversies gecontroleerd |
| Frontendproductiebuild | Vite | Geslaagd; 2.395 modules verwerkt |
| Serverproductiebuild | esbuild | Geslaagd; serverbundle 37,2 kB |
| Browserflows | Niet in deze sprint automatisch uitgevoerd | Onbewezen |
| Toegankelijkheid | Niet systematisch uitgevoerd | Onbewezen |
| Database-integratietests | Niet aanwezig | Onbewezen |

De huidige vijf tests zijn waardevol als regressiecontrole voor de grootste securitygrenzen, maar bieden geen brede functionele dekking. Volgende tests moeten portfolio-CRUD, holdings, abonnementsentitlements, foutpaden, adminaudit, database-integratie en marktdata-contracttests afdekken.

## 6. Performance en schaalbaarheid

| Artefact of signaal | Gemeten waarde | Beoordeling | Actie |
|---|---:|---|---|
| `index.html` | 368,23 kB; 105,75 kB gzip | Ongewoon groot; runtime-injectie of inline inhoud onderzoeken | P1 bundle-analyse |
| Hoofd-CSS | 119,25 kB; 18,65 kB gzip | Aanvaardbaar als startbaseline, nog niet per route geanalyseerd | Trend volgen |
| Hoofd-JavaScript | 1.186,54 kB; 326,84 kB gzip | Boven Vite-waarschuwingsgrens; waarschijnlijk trage initiële laadervaring op mobiel | P1 route-level lazy loading en vendorchunking |
| Serverbundle | 37,2 kB | Geen onmiddellijk signaal van overgewicht | Trend volgen |
| API-latency p95 | Niet gemeten | Onbekend productierisico | Instrumentatie vóór SLO |
| Databasequery p95 | Niet gemeten | Index- en schaalrisico niet kwantificeerbaar | Querymetrics en explainplannen |
| Cache-hitratio | Niet van toepassing | Marktdata-cache bestaat nog niet | Voor providerproductie instrumenteren |

De eerste optimalisatie is code-splitting per route en zware component, gevolgd door bundle-analyse. De waarschuwing wordt niet onderdrukt door alleen de limiet te verhogen. Database- of infrastructuuroptimalisatie volgt pas na meting.

## 7. Monitoring en operationele gereedheid

| SLI of controle | Geïnstrumenteerd | Dashboard | Alarm | Runbook/standaard | Status |
|---|---|---|---|---|---|
| Uptime | Nee | Nee | Nee | `docs/operations/monitoring-sli.md` | Ontworpen |
| API-latency en fouten | Nee | Nee | Nee | Monitoringdocument | Ontworpen |
| Server- en databasebelasting | Platformafhankelijk/onbevestigd | Nee | Nee | Monitoringdocument | Onbewezen |
| Providerverbruik en kosten | Niet van toepassing | Nee | Nee | Marktdata-architectuur | Ontworpen |
| Cache-efficiëntie | Niet van toepassing | Nee | Nee | Marktdata-architectuur | Ontworpen |
| Betaalwebhooks en entitlements | Niet als SLI bewezen | Nee | Nee | Handbook | Open |
| Externe uptimeprobe | Nee | Nee | Nee | Monitoringdocument | Open |

Er zijn lokale ontwikkellogs en buildoutputs, maar die vormen geen centrale production observability. Uptime, latency, fouten, capaciteit en kosten hebben nog geen operationele tijdreeks of alarmering.

## 8. Kosten en marktdata-unit economics

De leveranciersanalyse beveelt **EODHD voor de MVP** aan wegens de betere bevestigde Europese dekking in het onderzoek, en **Twelve Data als latere kandidaat voor een betaalde real-timefase**. Dit is een technische en economische aanbeveling, geen koopbeslissing. Schriftelijke licentiebevestiging, exacte beursdekking, gebruikersrechten, redistributie en exchange fees moeten vóór contractering opnieuw worden bevestigd.

| Kostencategorie | Huidige bewezen kost | Forecaststatus | Gate |
|---|---:|---|---|
| Hosting | Niet in repositorybewijs beschikbaar | Onbekend | Verbruik en plan via beheerlaag opvolgen |
| Database | Niet in repositorybewijs beschikbaar | Onbekend | Groei, connecties en back-upopties meten |
| Marktdata | Geen provider geïntegreerd | Scenario’s gedocumenteerd | Contractbewijs en budgetgoedkeuring |
| Real-time exchange fees | Niet bevestigd | Expliciet open | Niet activeren zonder schriftelijke offerte |
| Betalingen | Stripeconfiguratie voorbereid | Productieflow niet bewezen | End-to-end checkout/webhook/entitlementtest |

Real-time wordt alleen geactiveerd wanneer een voldoende grote betalende cohort, positieve contributiemarge, licentierechten, operationele healthgates en een kill switch aantoonbaar aanwezig zijn.

## 9. Technische schuld en risico’s

| Item | Impact | Kans | Prioriteit | Acceptatiecriterium |
|---|---|---|---|---|
| Grote initiële frontendbundle | Hoge laadtijd en conversierisico | Hoog | P1 | Routechunks; hoofdentry aantoonbaar lager; geen onverklaarde HTML-bloat |
| Geen centrale observability | Incidenten en degradatie laat zichtbaar | Hoog | P1 | Kern-SLI’s, dashboard, alarmen en runbooks actief |
| Geen rate limiting | Misbruik en providerkosten | Midden/Hoog | P1 | Gedifferentieerde limieten met tests en metrics |
| Geen database-restoretest | Dataverlies en lange uitval | Midden | P1 | Geïsoleerde restore met integriteits- en authchecks geslaagd |
| Slechts vijf tests | Regressies buiten autorisatie blijven mogelijk | Hoog | P1 | Testmatrix voor kritieke procedures en integratiepaden |
| Pnpm-resolutiehook voor transitive fixes | Onzichtbare onderhoudscomplexiteit | Midden | P2 | Verwijderen zodra upstream veilige versies resolveert |
| Grote router en datalaag | Toenemende coupling | Midden | P2 | Featuremodules met stabiele contracten bij volgende uitbreidingen |
| Geen marktdata-contracttests | Providerwissel kan semantiek breken | Hoog vóór integratie | P0 bij providerfase | Gedeelde adaptercontractsuite voor fixtures en foutgevallen |
| Providerlicenties onbevestigd | Juridisch en commercieel risico | Hoog | P0 vóór contract | Schriftelijk bewijs voor gebruik, cache en weergave |
| Geen productie-browser/a11ybewijs | UX- en toegankelijkheidsregressie | Midden | P1 | Kritieke flows getest op mobiel/desktop en keyboard |

## 10. Back-up, herstel en continuïteit

| Controle | Resultaat | Bewijs | Volgende actie |
|---|---|---|---|
| Projectcheckpoint | Vorige bekende checkpoint beschikbaar; nieuw checkpoint volgt | Projectversiegeschiedenis | Deze sprint na finale review vastleggen |
| Databaseback-upstatus | Niet geverifieerd | Geen platformbewijs in repository | Retentie en PITR in beheerlaag bevestigen |
| Geïsoleerde database-restore | Niet uitgevoerd | Geen herstelverslag | Kwartaaltest plannen vóór productieafhankelijkheid |
| Objectrestore | Niet van toepassing of onbewezen | Geen testverslag | Test zodra gebruikersbestanden actief zijn |
| Secretherstel en rotatie | Geen oefenbewijs | Alleen secretbeheerprincipes | Break-glass- en rotatieoefening documenteren |

Het beleid staat in `docs/operations/backup-recovery.md`. De voorgestelde RPO/RTO-waarden zijn doelrichtingen en geen bewezen garanties.

## 11. Incidenten en bijna-incidenten

| Incident of bevinding | Potentiële impact | Oorzaak | Detectie | Herstel | Preventieve actie |
|---|---|---|---|---|---|
| Portefeuille-IDOR | Cross-user financiële inzage | Query op portfolio-ID zonder user-ID | Handmatige CTO-audit | Eigenaarsfilter in query en regressietests | Ownership-by-construction voor alle user-data |
| Dubbele/stale analyse-export | Serverstartfout | Functie-extractie met tijdelijk inconsistente import/export | Devserverlog en build | Analyse naar eigen module; import gecorrigeerd | Verify-keten en kleinere modules |
| Kwetsbare transitive dependencies | Supply-chainrisico | Verouderde resoluties in dependencygraph | OSV-audit | Directe upgrades, overrides en resolutiehook | Audit in iedere verify-run |

De recente devserverlog bevat historische importfouten, maar latere serverstarts en de finale productiebuild zijn geslaagd. Centrale productiealarmering bestaat nog niet.

## 12. Beslissingen en volgende sprint

| Prioriteit | Beslissing of actie | Reden | Eigenaar | Acceptatiecriterium |
|---:|---|---|---|---|
| 1 | Frontendbundle analyseren en per route splitsen | Grootste gemeten performanceprobleem | Engineering | Kleinere hoofdentry, stabiele flows en groene verify |
| 2 | Kernmonitoring en externe uptimeprobe ontwerpen/implementeren | Nodig voor productiebewijs en incidentdetectie | CTO / Engineering | Uptime, fouten en p95-latency meetbaar |
| 3 | Rate limiting en auditlogging voor kritieke mutaties | Security en kostenbeheersing | Engineering | Tests, metrics en geen gevoelige logs |
| 4 | Databaseback-upmogelijkheden en restorepad verifiëren | Continuïteit is nog onbewezen | CTO / Platform | Geslaagde geïsoleerde restoretest |
| 5 | Beslissen of eerst EODHD-integratie of subscriptionflow wordt gebouwd | Bepaalt volgende waarde- en kostestroom | Business Owner | Gekozen scope met contract- en testcriteria |
| 6 | Provideradaptercontracttests voorbereiden | Houdt wisselbaarheid echt afdwingbaar | Engineering | Gedeelde testsuite zonder providercredentials |

De aanbevolen volgorde is eerst de zichtbare performance- en operationele baseline versterken, vervolgens de commerciële prioriteit kiezen tussen **EOD-marktdata** en **betalings-/entitlementflows**. Een providerintegratie wordt niet rechtstreeks aan UI of analysecode gekoppeld; alle toegang loopt via het vastgelegde interne contract.
