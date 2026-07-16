# Trimilix SaaS-kwaliteitsaudit — werkdossier

**Status:** interne auditnotities; nog geen definitief rapport.  
**Auditdatum:** 16 juli 2026  
**Auditor:** Manus AI, handelend als Senior Software Architect

## Auditkader

De audit beoordeelt de huidige codebasis zonder nieuwe functionaliteit toe te voegen. De beoordelingsassen zijn professionele frontendkwaliteit, onderhoudbaarheid, schaalbaarheid, beveiliging en privacy, databasekwaliteit, prestaties, tests en operationele gereedheid, documentatie en verantwoord verder bouwen. Bevindingen worden geclassificeerd als **sterk**, **absoluut verbeteren vóór verdere productbouw**, **later verbeteren**, **technische schuld** of **risico**.

## Projectinventaris en nulmeting

| Onderdeel | Waarneming | Voorlopige duiding |
|---|---|---|
| Stack | React 19, Tailwind CSS 4, Express 4, tRPC 11, Drizzle ORM, MySQL/TiDB, Manus OAuth | Moderne typed full-stackbasis met een duidelijke API-contractlaag |
| Broncode | 39 TypeScript- en 70 TSX-bestanden, naast 15 Markdowndocumenten en 4 SQL-migraties | Beheersbare MVP-omvang, maar enkele schermmodules zijn groot |
| Grootste eigen frontendmodules | `PortfolioChecker.tsx` circa 14 KB, `GoalPlanner.tsx` circa 10 KB, `ETFCheck.tsx` circa 10 KB, `Home.tsx` circa 8 KB | Vereist gerichte controle op verantwoordelijkheden, duplicatie en testbaarheid |
| Kwaliteitscommando | `pnpm verify` voert typecheck, Vitest, secret-scan, OSV-audit en productiebuild uit | Goede basis voor een releasepoort, mits dekking en scripts inhoudelijk sterk genoeg zijn |
| Tests | 3 testbestanden, 7 tests, alle geslaagd | Technische keten werkt, maar dekking is zeer beperkt voor financiële kernlogica en gebruikersstromen |
| Dependency-audit | 495 geïnstalleerde productiepackageversies gecontroleerd; bestaande script rapporteert geen bekende kwetsbaarheden | Positief signaal, maar scriptimplementatie en foutgedrag moeten nog worden beoordeeld |
| Productiebundel | Hoofd-JavaScriptbundle 1.188,00 KB geminificeerd en 327,32 KB gzip; CSS 121,05 KB en 19,12 KB gzip | Build slaagt, maar er is een expliciete chunkwaarschuwing en geen route-code-splitting zichtbaar in de nulmeting |
| Migraties | Vier Drizzle-migraties en snapshots aanwezig | Positief, maar schema, indexen, constraints en daadwerkelijke databasesynchronisatie moeten nog worden gecontroleerd |
| Documentatie | Architectuur-, security-, monitoring-, back-up-, marktdata- en sprintauditdocumenten aanwezig | Boven gemiddeld voor een MVP; actualiteit en overeenstemming met code moeten nog worden gevalideerd |
| Werkstatus | Alleen auditbestanden en `todo.md` zijn gewijzigd sinds het vastgelegde merkcheckpoint | Audit kan zonder functionele wijziging worden uitgevoerd |

## Eerste voorlopige signalen

De bestaande kwaliteitsketen is reproduceerbaar en slaagt volledig. Dit is een sterk fundament. De testset bestaat echter uit slechts zeven tests en de productiebuild meldt een JavaScript-hoofdbundle van ruim 1,1 MB. Daardoor mogen een groene build en dependency-audit nog niet worden geïnterpreteerd als productie- of schaalbaarheidsbewijs. De volgende fasen moeten vooral vaststellen of financiële berekeningen server-side en getest zijn, of alle gegevens op gebruikersniveau correct zijn geïsoleerd, of de database relevante constraints en indexen heeft, en of de frontend geen hardcoded of mockbedrijfslogica bevat.

## Bewijsbestanden

De inventaris staat in `audit-inventory.txt`. De volledige nulmeting staat in `audit-verify.txt`. Het formele rapport wordt pas geschreven nadat alle auditfasen zijn voltooid en zal relatieve bronverwijzingen naar concrete code, configuratie, tests, logs en documentatie bevatten.

## Frontend- en UX-audit

De vijf kernroutes zijn visueel gecontroleerd op 1440 × 1000 en 390 × 844 pixels. De interface blijft op beide viewports bruikbaar en er zijn geen volledige layoutbreuken of horizontale pagina-overflows zichtbaar. De witte gereedschapsschermen hebben een rustige informatiehiërarchie, ruime klikvlakken en duidelijke lege toestanden. De dashboard-home toont het goedgekeurde Trimilix-richting-A-logo scherp en proportioneel in een zwarte header.

| Bevinding | Ernst | Bewijs en duiding |
|---|---|---|
| Merktaal is niet end-to-end consistent | Hoog | De home gebruikt zwart, goud en het Trimilix-logo, terwijl alle toolroutes terugvallen op een generieke wit-blauwe dashboardstijl met willekeurige accentkleuren. Daardoor voelt het platform als meerdere UI-systemen in plaats van één premium merkproduct. |
| Toolroutes hebben geen globale navigatie of terugweg | Hoog | Alleen `/` bevat de merkheader. `/etf-check`, `/portfolio-checker`, `/compounding-simulator` en `/goal-planner` tonen geen header, broodkruimel of terugknop. Dit is een navigatiedoodlopend pad en vermindert oriëntatie, merkherkenning en accounttoegang. |
| Mobiele simulatieresultaten zijn te krap | Hoog | De drie resultaatkaarten blijven op 390 pixels in drie kolommen staan. Labels breken onnatuurlijk af en grote bedragen, waaronder `€504.709` en `€694.709`, worden visueel tegen de kaartrand gedrukt of afgesneden. |
| Taal- en naamgevingsconsistentie is onvoldoende | Middel | De interface combineert Nederlands met Engelse productnamen zoals “ETF Check”, “Portfolio Checker” en “Compounding Simulator”. `™` staat bij bijna elke tooltitel en veroorzaakt visuele ruis zonder aantoonbare UX-waarde. |
| Toolschermen ogen als generieke componentdemo's | Middel | Witte afgeronde kaarten, standaardblauwe acties en statusbalken zijn helder maar onvoldoende eigen. Financiële cijfers, risico-informatie en dossierstructuur krijgen nog geen herkenbare Trimilix-presentatielogica. |
| Mobiele home-header is functioneel maar krap | Middel | Logo en persoonlijke begroeting passen naast elkaar, maar nemen vrijwel de volledige breedte in. Langere namen of vertalingen zullen waarschijnlijk wrappen of botsen. |
| Lege portfolio- en detailtoestanden zijn begrijpelijk | Sterk | De gebruiker krijgt een duidelijke volgende stap, bijvoorbeeld “Eerste portefeuille maken” of “Selecteer een ETF om details te zien”. |
| Responsive basis is aanwezig | Sterk | Dashboardkaarten, ETF-resultaten en doelkaarten herschikken zich zonder volledige breuk naar één kolom. |

De onafhankelijke stijlreview verwees naar een oudere `ideas.md`-richting met de naam NOORDLIJN. Die aanbeveling is **niet als productspecificatie overgenomen**, omdat de gebruiker nadien expliciet Trimilix richting A, zwart-goud en de huidige opstelling heeft goedgekeurd. De review bevestigt indirect wel de objectieve observatie dat het dashboard en de toolroutes momenteel visueel uit verschillende stijlsystemen bestaan.

### Voorlopig UX-oordeel

De huidige interface is bruikbaar als functionele MVP, maar nog niet professioneel coherent genoeg voor een financieel SaaS-platform dat vertrouwen en premiumpositionering moet uitstralen. De navigatiedoodlopende toolroutes en afgeknepen mobiele financiële totalen zijn absolute verbeterpunten vóór brede productuitbouw. Een gedeelde applicatieshell, één Trimilix-designtokenset en expliciete responsive regels voor financiële kerngetallen behoren tot de eerstvolgende kwaliteitsmaatregelen; deze worden nu alleen gerapporteerd en nog niet geïmplementeerd.

### Frontend-broncodebewijs

De broncodescan bevestigt de visuele waarnemingen. Alleen `Home.tsx` importeert en gebruikt `useLocation`; geen van de vier toolroutes bevat een `Link`, `href`, terugactie of globale navigatie. De drie financiële samenvattingskaarten in `CompoundingSimulator.tsx` zijn onvoorwaardelijk als `grid-cols-3` gedefinieerd, wat de geobserveerde mobiele afknelling rechtstreeks verklaart.

De invoervelden in ETF Check en Doelplanner hebben bijbehorende labels, en de simulator toont vier zichtbare labels bij zijn schuifregelaars. Toch is er vrijwel geen expliciete `aria-*`-metadata op toolroutes. Dat hoeft bij correct native HTML niet automatisch een toegankelijkheidsfout te zijn, maar vereist verdere controle op gekoppelde `htmlFor`/`id`-waarden, slidernaamgeving, toetsenbordfocus en foutmeldingen. In de globale CSS of kernschermen werd geen expliciete `prefers-reduced-motion`-regeling gevonden.

Een belangrijk productkwaliteitsrisico is dat zichtbare functionaliteit nog mockgedrag bevat. ETF Check toont na “toevoegen aan portefeuille” een succesmelding met letterlijk `(mock)` en bevat een TODO in plaats van een echte mutatie. Doelplanner initialiseert drie financiële doelen uit een lokale `mockGoals`-array en bewaart wijzigingen alleen in React-state. Portfolio Checker verwijst in de interfacecode naar mockanalysegegevens uit de backend. Dit moet vóór externe gebruikers of marketing als **prototypefunctionaliteit** worden gelabeld of door echte, persistent opgeslagen bedrijfslogica worden vervangen. Omdat de gebruiker een bouwstop heeft ingesteld, wordt nu alleen het risico gerapporteerd.

## Codekwaliteit en onderhoudbaarheid

De toepassingscode gebruikt TypeScript, tRPC, Zod en Drizzle op een herkenbare manier. De kwaliteitsketen slaagt zonder typefouten. Er zijn geen `@ts-ignore`- of `@ts-expect-error`-omzeilingen en slechts vijf expliciete `any`-gevallen, waarvan vier in generieke UI-/storagehulpmiddelen zitten. De centrale router is met 82 regels nog overzichtelijk; invoer voor portfolio-aanmaak en identifiers wordt met Zod gevalideerd. Autorisatiecontext wordt niet door de client aangeleverd maar uit `ctx.user.id` gehaald, wat een goede basisgrens vormt.

| Bevinding | Ernst | Onderhoudsimpact |
|---|---|---|
| Kernpagina's combineren datatoegang, domeinberekening en presentatie | Hoog | `PortfolioChecker.tsx` telt 299 regels, `GoalPlanner.tsx` 257, `ETFCheck.tsx` 223 en `CompoundingSimulator.tsx` 197. Er zijn nog geen featuremappen, viewmodels of herbruikbare domeincomponenten. Verdere functionaliteit zal deze bestanden snel moeilijk testbaar en foutgevoelig maken. |
| Financiële kernlogica is nauwelijks getest | Kritiek | Er zijn slechts drie testbestanden: logout, autorisatie en branding. Voor compounding, portefeuillewaardering, risico-indeling, percentages, nulwaarden en afronding ontbreken unit- en integratietests. |
| Database-uitval wordt inconsistent als geldige leegte teruggegeven | Hoog | Helpers retourneren bij ontbrekende database afwisselend `[]`, `null`, `undefined` of `void`. Hierdoor kan de UI “geen gegevens” tonen wanneer er feitelijk een infrastructuurfout is; foutdetectie en support worden moeilijker. |
| Mockfunctionaliteit zit in productiecode | Hoog | ETF toevoegen is een TODO met succes-toast; Doelplanner gebruikt lokale mockdata; portefeuilleadvies bevat vaste aanbevelingen. Dit creëert een misleidende productsituatie en verspreidt prototypegedrag door UI en domeinlaag. |
| Portfolioanalyse voert seriële N+1-query's uit | Hoog | Voor iedere holding wordt afzonderlijk `getEtfBySymbol` aangeroepen. Dit verhoogt responstijd en databasebelasting lineair met portefeuilleomvang. |
| Analysefunctie heeft impliciete, niet-gedocumenteerde domeinaannames | Hoog | Ontbrekende `riskScore` wordt stil als 3 behandeld; een lege portefeuille resulteert eveneens in 100% “matig risico”; aanbevelingen zijn voor iedere gebruiker identiek. Dit is niet geschikt als professioneel financieel analysemiddel zonder expliciete product- en complianceregels. |
| API-resultaten hebben geen consistente servicecontracten | Middel | `createPortfolio` en `createEtf` retourneren database-driverresultaten, terwijl getters domeinobjecten of nullwaarden retourneren. Een expliciete servicelaag en vaste DTO's ontbreken. |
| Router bevat een directe databasequery naast helpers | Laag | `etf.count` importeert `getDb`, tabel en `count` rechtstreeks, terwijl overige procedures via `db.ts` lopen. Dit is kleine maar zichtbare grensvervaging. |
| Grote template-/showcasebestanden vervuilen de projectbasis | Laag | `ComponentShowcase.tsx` bevat 1.437 regels en diverse ongebruikte algemene componenten blijven aanwezig. Dit hoeft runtime niet te schaden door tree-shaking, maar vergroot cognitieve last en auditoppervlak. |

De codebasis is voor een vroege MVP herkenbaar en relatief leesbaar, maar nog niet onderhoudbaar genoeg voor een professioneel SaaS-platform met financiële beslislogica. De belangrijkste technische schuld zit niet in syntactische kwaliteit, maar in ontbrekende domeinmodellen, ontbrekende businesslogica-tests, inconsistente foutsemantiek en prototypegedrag dat nog rechtstreeks in productiecode staat.

## Architectuur en schaalbaarheid

De basisstack is passend voor een vroeg SaaS-product: React en tRPC delen één typeveilig API-contract; Zod valideert procedure-inputs; Drizzle houdt schema en queries in TypeScript; de server kan stateless draaien; gebruikersbestanden zijn voorbereid op S3 in plaats van lokale opslag. Er zijn geen ongewenste runtime-imports van servercode in de browser. De enige client-naar-serververwijzing is `import type { AppRouter }`, het bedoelde tRPC-contract dat tijdens compilatie verdwijnt.

| Bevinding | Ernst | Schaalbaarheids- of architectuurimpact |
|---|---|---|
| Geen expliciete domein- en servicelaag | Hoog | Routes roepen databasehelpers en analysefuncties rechtstreeks aan. Naarmate doelen, abonnementen, betalingen en analyses groeien, worden transacties, autorisatiebeleid en businessregels over routers en pagina's verspreid. |
| Geen featuregerichte projectstructuur | Hoog | Frontendcode staat voornamelijk per pagina en servercode in één router en één databasebestand. Een professionele vervolgstap vereist modules zoals `portfolio`, `etf`, `goals`, `subscriptions` met eigen schema-contracten, services, repositories en tests. |
| Publieke routering kent geen centrale routeguard of layoutshell | Middel | Alle routes zijn client-side toegankelijk; sommige pagina's tonen lokaal een loginstatus. De backend beschermt gevoelige procedures correct, maar de frontend kan bij uitbreiding inconsistente toegangsstaten en navigatie krijgen. |
| Onbegrensde lijstprocedures en ontbrekende paginering | Hoog | Portfolio-, doel- en ETF-lijsten lezen alle rijen voor de context. Dit is acceptabel met minimale data, maar schaalt niet qua querytijd, payload en geheugen. |
| Geen batchquery voor ETF-details in portfolioanalyse | Hoog | Het seriële N+1-patroon maakt analysetijd lineair afhankelijk van het aantal holdings en vergroot de kans op time-outs bij groei. |
| Dubbele serverentrypoint aanwezig | Middel | `package.json` bouwt `server/_core/index.ts`, terwijl `server/index.ts` een tweede, verouderde statische server beschrijft zonder API of OAuth. Dit dode entrypoint kan toekomstige ontwikkelaars tot foutieve deploymentwijzigingen verleiden. |
| Grote requestlimiet op alle JSON- en formulierverzoeken | Middel | De centrale Express-runtime accepteert standaard 50 MB voor alle JSON en URL-encoded requests, hoewel grote bestanden via S3 horen te lopen. Dit vergroot geheugendruk en misbruikoppervlak per autoscale-instance. |
| Geen expliciete caching-, rate-limit- of backpressurelaag | Hoog | Publieke en beschermde procedures hebben geen zichtbaar verbruiksbeleid. Vooral ETF-lookups en toekomstige financiële data-integraties moeten per gebruiker/IP worden begrensd en waar passend worden gecachet. |
| Geen transactielaag voor samengestelde mutaties | Middel | De huidige mutaties zijn eenvoudig, maar portfolio met holdings, abonnementswijzigingen en toekomstige betaalstatussen vereisen atomische servicebewerkingen. De architectuur maakt dit nog niet expliciet. |
| Ongebruikte platformcomponenten en dependencies vergroten auditoppervlak | Laag | `DashboardLayout`, `AIChatBox`, `Map`, `ComponentShowcase`, een tweede serverentrypoint en veel UI-modules zijn niet onderdeel van de huidige productflow. Verwijderen of duidelijk isoleren verlaagt cognitieve last en supply-chainoppervlak. |
| Architectuurdocument en beslislog ontbreken | Hoog | Er is geen project-specifieke beschrijving van domeingrenzen, datastromen, autorisatiemodel, foutsemantiek, deploymentaannames of keuzes voor financiële precisie. Daardoor is verdere groei afhankelijk van impliciete kennis. |

**Architectuuroordeel:** het fundament kan een MVP dragen en hoeft niet volledig te worden vervangen. Voor verdere SaaS-uitbouw is eerst een gerichte modularisering nodig: behoud tRPC/Drizzle/React, maar voeg featuremodules, een servicelaag met expliciete fouten en transacties, repositorygrenzen, paginering en centraal beleid voor autorisatie, caching en rate limiting toe. Een microservicesmigratie is nu niet gerechtvaardigd; een goed gestructureerde modulaire monoliet is de passende doelarchitectuur.

## 5. Beveiliging, privacy en database

### Sterke punten
- De tRPC-laag heeft expliciete `publicProcedure`, `protectedProcedure` en `adminProcedure`-grenzen. Portefeuille-, doel- en abonnementsdata worden via beschermde procedures benaderd; ETF-mutaties vereisen de adminrol.
- Objectautorisatie is in de data-accesslaag gebruikersgebonden: portefeuille-detail en analyse ontvangen zowel het object-ID als `ctx.user.id`; hiervoor bestaan autorisatieregressietests.
- De OAuth-callback gebruikt een eenmalige nonce in `state`, vergelijkt deze met een `__Host-`-cookie en wist de nonce na gebruik. Dit is een relevante CSRF-verdediging.
- Sessies worden als HS256-JWT gevalideerd met een expliciete algoritmelijst en verlopen tokens worden door de JWT-library geweigerd.
- Query's lopen via Drizzle met parameterbinding; er zijn geen handmatig samengestelde SQL-strings in de applicatielaag gevonden.
- Secrets-scanning vond geen gecommitteerde geheimen. De productieconfiguratie gebruikt geïnjecteerde omgevingsvariabelen.
- Het schema bevat primaire sleutels, unieke sleutels op onder meer `openId`, ETF-symbolen en ISIN, plus foreign keys met cascaderende verwijdering voor portefeuille-afhankelijke records.
- Financiële geldbedragen worden als gehele centen opgeslagen, wat binaire floating-point-afwijkingen voorkomt.

### Absolute verbeterpunten vóór publieke SaaS-groei
- **P0/P1 – ontbrekende HTTP-hardening:** live ontwikkelheaders tonen `X-Powered-By: Express`, maar geen Content-Security-Policy, HSTS, `X-Content-Type-Options`, framebeperking, Referrer-Policy of Permissions-Policy. `helmet` of gelijkwaardige expliciete headers ontbreken. Dit vergroot de impact van XSS, clickjacking en content-sniffing.
- **P1 – geen rate limiting of misbruikbeveiliging:** OAuth-, tRPC- en publieke opslagroutes hebben geen aantoonbare per-IP/per-account limieten, request-sizebeleid of throttling. Dit is relevant voor brute force, scraping, kostendoorbelasting en beschikbaarheid.
- **P1 – sessieduur en revocatie:** normale sessies zijn één jaar geldig en er is geen aantoonbare server-side revocatielijst, rotatie of device/session management. Bij tokenlek blijft het risico langdurig bestaan.
- **P1 – bearer-token in `sessionStorage`:** de previewfallback kopieert de sessie naar JavaScript-toegankelijke opslag. Elke succesvolle XSS kan dit bearer-token uitlezen. Dit kan in de beheerde preview noodzakelijk zijn, maar moet strikt worden gescheiden van productie of door een aantoonbaar CSP- en runtimebeleid worden begrensd.
- **P1 – PII in `localStorage`:** `useAuth` schrijft het volledige `meQuery.data`-object naar `manus-runtime-user-info`. Dit omvat potentieel naam, e-mail, rol en identifiers, blijft na logout bestaan en is JavaScript-toegankelijk. Minimaliseren, verwijderen bij logout en documenteren is noodzakelijk.
- **P1 – publieke opslagproxy zonder objectautorisatie:** `/manus-storage/*` accepteert ieder pad, vraagt met een server-side Forge-sleutel een presigned URL op en vereist geen gebruiker, eigenaar of prefixbeleid. Als sleutels raadbaar of gelekt zijn, kan dit tot ongeautoriseerde bestandsinzage leiden. Voor publieke merkassets is een aparte expliciete publieke namespace wenselijk; privébestanden moeten via geautoriseerde metadatarecords lopen.
- **P1 – configuratie faalt niet veilig:** `server/_core/env.ts` vervangt ontbrekende kritieke waarden door lege strings. Er is geen startupvalidatie voor JWT-secret, database-URL, OAuth-server, app-ID of Forge-configuratie. Een verkeerd geconfigureerde productieomgeving kan daardoor starten met onduidelijk of zwak gedrag.
- **P1 – app-ID niet als audience/binding gevalideerd:** de sessieverificatie leest `appId`, maar controleert niet expliciet dat die overeenkomt met `ENV.appId`. De gedeelde signing key kan dit risico beperken, maar een expliciete issuer/audience/app-binding is een betere trustgrens.
- **P1 – auth veroorzaakt een database-write per verzoek:** `authenticateRequest` voert bij iedere geauthenticeerde request `upsertUser(lastSignedIn)` uit. Dit verhoogt write amplification, lock-/latencyrisico en maakt auth een schaalbaarheids- en beschikbaarheidsafhankelijkheid van de database.
- **P1 – migratieketen moet volledig reproduceerbaar worden bevestigd:** database en lokale migratie-inventaris gaven tijdens de audit tegenstrijdige signalen over het aantal beschikbare migraties. Voor release moet een schone database vanaf versiebeheer deterministisch naar het huidige schema kunnen migreren, inclusief snapshots en verificatie.

### Database- en datamodelschuld
- Het schema gebruikt `int` voor `shares`; fractionele ETF-aandelen zijn niet mogelijk. Voor moderne brokerdata is een vaste decimale representatie nodig.
- `currentPrice`, doelbedragen en maandinleg zijn 32-bit gehele centen. Dit is deterministisch, maar de bovengrens van een signed `int` is circa EUR 21,47 miljoen. Dat kan voor individuele prijzen ruim zijn, maar voor zakelijke/high-net-worth-doelen en toekomstige aggregaten krap worden; `bigint` of `decimal` verdient een bewuste domeinkeuze.
- `ter` is een integer zonder gedocumenteerde eenheid in het schema. De betekenis (basispunten, honderdsten of miljoensten) moet als domeincontract worden vastgelegd en gevalideerd op een realistisch bereik.
- Velden zoals `currency`, `status`, `plan`, `assetClass`, `region` en `riskScore` missen database-level CHECK/enum-beperkingen. Alleen TypeScript- en Zod-controles voorkomen nu ongeldige waarden, terwijl beheer- of migratiescripts die grens kunnen omzeilen.
- `symbol`-lookup heeft wel een unieke index; relaties worden door foreign keys ondersteund. Aanvullende samengestelde indexen moeten worden onderbouwd met echte query- en volumemeting, vooral voor `(userId, createdAt)`, `(portfolioId, createdAt)` en mogelijke dubbele holdings `(portfolioId, symbol)`.
- De database kent geen aantoonbare audit trail, soft-delete-/retentiebeleid, data-export/verwijderingsworkflow of versleutelingsclassificatie voor persoonsgegevens en financiële gegevens.

### Middellange termijn
- Voeg security-eventlogging toe voor login, logout, rolwijziging, adminmutaties en verdachte autorisatiefouten, zonder tokens of PII in logs op te nemen.
- Definieer back-up, restore-test, RPO/RTO, dataclassificatie, bewaartermijnen en een periodieke toegangsreview.
- Gebruik kortere sessies met rotatie/refresh of aantoonbare revocatie, plus expliciete `iss`, `aud`, `iat` en token-ID-claims.
- Maak databaseconstraints en applicatievalidatie congruent; voeg negatieve tests toe voor grenswaarden, dubbele records, cascades en unauthorized object access.

## 6. Prestaties, tests en operationele gereedheid

De productiebuild slaagt, maar de frontend wordt als één hoofdchunk van 1.187.997 bytes minified JavaScript en 121.047 bytes CSS geleverd. De gzipmetingen uit de kwaliteitsketen bedragen respectievelijk circa 327 KB en 19 KB. In de applicatiecode zijn geen `React.lazy`, dynamische route-imports of andere expliciete code-splittinggrenzen aangetroffen. Daardoor downloaden bezoekers van de homepagina ook code voor alle financiële tools en een brede set UI-afhankelijkheden. Dit is voor een kleine MVP technisch werkbaar, maar niet de gewenste basis voor een snel publiek financieel product.

| Onderdeel | Feitelijke observatie | Oordeel |
|---|---|---|
| Lokale HTML-respons | Vijf lokale ontwikkelrequests leverden 200 in ongeveer 7–14 ms TTFB, met een HTML-response van circa 369 KB door de preview/runtime-injectie. | De lokale server reageert vlot, maar deze meting is geen productiebenchmark en de HTML-omvang is niet representatief voor de gepubliceerde client. |
| API-latency | Historische previewlogs tonen eerste `auth.me`-requests van circa 861–1.056 ms en een eerste ETF-count van circa 920 ms; kort daarna liggen vergelijkbare requests rond 18–44 ms. | Dit wijst op relevante cold-start/initialisatie- of eerste-databasekosten. Voor autoscale is een productie-SLI en cold/warm-p95-meting noodzakelijk. |
| Clientbundel | Eén JavaScript-hoofdchunk van circa 1,19 MB minified; geen route-code-splitting. | Hoog verbeterpunt voor laadtijd, parse-/executietijd en mobiele gebruikers. |
| Querygedrag | Auth wordt op meerdere routes geladen; lijsten zijn onbegrensd; portfolioanalyse voert aanvullende detail- en analysequeries uit. | Acceptabel bij minimale data, maar vereist paginering, batching en queryprofilering vóór groei. |
| Testset | Drie testbestanden met zeven tests: logout, twee gebruikersisolatiecontroles, twee rolcontroles en twee brandingchecks. | De infrastructuur werkt, maar de dekking is kritiek onvoldoende voor financiële en SaaS-bedrijfslogica. |
| Runtimefouten | De serverlog bevat veel historische compile-/importfouten rond `analyzePortfolio`, gevolgd door succesvolle huidige build en requests. De browserconsole bevat in de gecontroleerde recente sectie geen fouten. | De huidige staat is hersteld, maar er is geen geautomatiseerde logtriage of foutbudget; historische ruis bemoeilijkt incidentanalyse. |
| Operationele documenten | Er zijn documenten voor monitoring-SLI en back-up/herstel. | Positief, maar uitvoering, alerts, eigenaarschap en restorebewijs moeten nog worden gevalideerd. |

### Absolute verbeterpunten

De financiële kern heeft geen unit tests voor samengestelde interest, maandelijkse inleg, afronding, nul- en negatieve grenswaarden, zeer lange looptijden, portefeuilleverdeling, risicoscore en ontbrekende ETF-data. Ook ontbreken integratietests voor portfolio-aanmaak, holdingrelaties, doelpersistentie, abonnementsstatus en databasefouten, plus end-to-endtests voor login, navigatie en kernstromen. Een groene suite van zeven tests is daarom geen betrouwbare releasepoort voor een financieel SaaS-platform.

Er is geen zichtbare CI-configuratie in het project die `pnpm verify` verplicht uitvoert bij iedere wijziging. De bestaande lokale verify-opdracht is een sterk begin, maar moet als verplichte branch-/releasecheck worden uitgevoerd. Verder ontbreken aantoonbare health-/readiness-endpoints, gestructureerde applicatielogs met request-ID's, centrale foutregistratie, latency-/error-ratealerts en een zichtbaar incidentrunbook. Zonder deze voorzieningen kan de software wel draaien, maar niet professioneel worden beheerd wanneer echte klanten afhankelijk worden van het platform.

De grootste directe prestatieverbeteringen zijn routegebaseerde lazy loading, verwijdering of isolatie van ongebruikte showcase-/toolingcode, paginering van lijstprocedures, batching van ETF-lookups en het elimineren van de database-write in iedere authenticatierequest. Deze veranderingen moeten pas na goedkeuring van het auditrapport worden uitgevoerd en vervolgens met productieachtige cold- en warmmetingen worden gevalideerd.

### Operationele releasepoort

Voor verantwoord verder bouwen is minimaal nodig: een verplichte CI-run van typecheck, tests, secret-scan, dependency-audit en productiebuild; tests voor alle financiële kernformules en autorisatiegrenzen; een reproduceerbare migratie-/rollbackproef; health/readiness; gestructureerde foutregistratie; en meetbare SLI's voor beschikbaarheid, p95-latency en fouten. Een Lighthouse-/Web Vitals-baseline en een beperkte loadtest met productieachtige data horen bij de releasevalidatie, niet bij aannames op basis van lokale TTFB.

## Documentatie en uitbreidbaarheid

**Sterke punten.** Het project heeft een bovengemiddeld sterke beleids- en architectuurbaseline voor een MVP. `ENGINEERING_HANDBOOK.md` definieert evidence-based statussen, security-by-design, modulariteit, provideronafhankelijkheid, schaaltriggers en releasegates. `docs/architecture.md` en de ADR's leggen de modulaire monoliet en de toekomstige marktdata-adapter vast. De monitoring- en herstelrunbooks maken expliciet onderscheid tussen ontwerpdoelen en operationeel bewijs. De documenten vermijden terecht voortijdige microservices en maken de EOD/delayed-naar-realtimefasering reversibel.

**Belangrijke documentatieschuld.** Er bestaat geen root-`README.md`. Daardoor ontbreekt een duidelijke startpagina voor installatie, lokale uitvoering, omgevingsvariabelen, database-migraties, kwaliteitscommando's, projectstructuur en releaseflow. `ENGINEERING_HANDBOOK.md` is een normenkader, maar geen vervanging voor uitvoerbare developer-onboarding. De bestaande `docs/cto-baseline-audit.md` is aantoonbaar verouderd: het noemt één test, een open IDOR en ontbrekende verify-gates, terwijl de latere sprintreview en huidige code de beveiligingsfixes en zeven tests tonen. Dit creëert conflicterende bronnen van waarheid. `docs/media/trimilix-video-series.md` beweert nog dat geen zelfstandig logoasset bestaat, terwijl richting A inmiddels definitief is geïntegreerd. Het handbook verwijst bovendien naar `docs/cto-sprint-report-template.md`, terwijl het aanwezige bestand `docs/CTO_SPRINT_REVIEW_TEMPLATE.md` heet.

**Operationele bewijsstatus.** `docs/operations/monitoring-sli.md` en `docs/operations/backup-recovery.md` zijn professioneel en eerlijk geformuleerd, maar beschrijven grotendeels nog te implementeren controles. Centrale metrics, externe uptimeprobe, rate-limitmetrics, querymetrics, productiealarmering, platform-back-upbewijs, PITR, geïsoleerde restore, objectrestore en break-glass-secretherstel zijn niet aangetoond. Deze documenten verhogen de ontwerpkwaliteit, maar mogen niet als productiecontrole worden geïnterpreteerd.

**Uitbreidbaarheid.** De documentatie ondersteunt gecontroleerde uitbreiding via domeingrenzen, adaptercontracten, ADR's en objectieve schaaltriggers. Verdere bouw is verantwoord nadat de releaseblokkers uit de audit zijn opgelost en documentatie als één actuele bron van waarheid wordt beheerd. Nodig zijn minimaal: een root-README, een documentindex/statusregister, archivering of actualisering van verouderde audits, expliciete eigenaars en verificatiedata voor operationele controles, en een CI-gate die documentlinks en kwaliteitscommando's controleert.
