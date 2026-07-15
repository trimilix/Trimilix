# The Trimilix System™ — Engineering Handbook

**Versie:** 2.0

**Laatst bijgewerkt:** 16 juli 2026

**Eigenaar:** CTO / Lead Software Architect

**Auteur:** Manus AI
**Status:** Levende, versiebeheerbare engineeringstandaard

> Dit handbook beschrijft **verplichte normen en beslisregels**. Het is geen bewijs dat een controle reeds operationeel is. Een controle geldt pas als geïmplementeerd wanneer code, configuratie, testresultaten of platformbewijs dat aantonen.

## 1. Doel en toepassingsgebied

The Trimilix System™ wordt ontwikkeld als een professioneel SaaS-platform dat op termijn meer dan **100.000 betalende gebruikers** en **1.000.000 geregistreerde gebruikers** moet kunnen ondersteunen. Dat doel rechtvaardigt een schaalbare structuur, maar niet het voortijdig toevoegen van microservices, queues, Redis of multi-regioninfrastructuur zonder gemeten noodzaak. We kiezen steeds de eenvoudigste architectuur die veilig, onderhoudbaar, testbaar en uitbreidbaar blijft.

Deze standaard geldt voor frontend, backend, database, integraties, marktdata, betalingen, infrastructuur, documentatie en operationele processen. Nieuwe functionaliteit moet aantoonbaar aan deze standaard voldoen vóór ze als productiegeschikt wordt beschouwd.

## 2. Kernprincipes

| Principe | Verplichte toepassing |
|---|---|
| **Security by design** | Authenticatie, autorisatie, validatie, gegevensminimalisatie en veilige standaardwaarden worden tijdens het ontwerp bepaald, niet achteraf toegevoegd. |
| **Evidence over assertions** | We documenteren nooit een controle als actief zonder verifieerbaar bewijs. |
| **Modulariteit** | Domeinlogica is gescheiden van frameworks en externe providers. |
| **Provider-onafhankelijkheid** | Externe diensten worden achter interne contracten en adapters geplaatst. |
| **Least privilege** | Gebruikers, beheerders, services en secrets krijgen enkel de minimaal noodzakelijke rechten. |
| **Meet vóór optimalisatie** | Performance- en schaalbeslissingen volgen uit SLI’s, profielen en loadtests. |
| **Kosten zijn een runtime-eigenschap** | API-gebruik, cache-efficiëntie en kosten per provider en gebruiker moeten meetbaar worden. |
| **Documentatie volgt de code** | Een codewijziging is onvolledig wanneer relevante architectuur-, API-, database- of operationele documentatie achterloopt. |
| **Reversibele beslissingen** | Waar mogelijk kiezen we oplossingen die zonder grote migratie vervangen kunnen worden. |

## 3. Statusmodel en bewijsvoering

Iedere architectuur- of securitycontrole krijgt één van de volgende statussen. Documentatie moet deze termen consequent gebruiken.

| Status | Betekenis | Vereist bewijs |
|---|---|---|
| **Geïmplementeerd** | Actief in de huidige code of omgeving | Code/configuratie, test en waar nodig platformbewijs |
| **Gedeeltelijk** | Slechts een deel van de controle is actief | Beschrijving van aanwezig en ontbrekend deel |
| **Gepland** | Goedgekeurd ontwerp, nog niet gebouwd | Roadmap- of ADR-verwijzing |
| **Platformafhankelijk** | Buiten de repository beheerd | Screenshot, export, auditlog of periodieke verificatie |
| **Niet van toepassing** | Bewust niet relevant | Gemotiveerde uitzondering met herzieningsdatum |

De actuele baseline staat in [`docs/cto-baseline-audit.md`](docs/cto-baseline-audit.md). Afwijkingen worden in het sprintverslag en, bij structurele keuzes, in een Architecture Decision Record vastgelegd.

## 4. Architectuurstandaard

### 4.1 Huidige en doelarchitectuur

De huidige MVP is een modulaire monoliet met React, tRPC, Express en Drizzle. Dat blijft de voorkeursvorm zolang één deploybare applicatie operationeel beheersbaar is. Grenzen worden wel langs domeinen getrokken, zodat marktdata, portefeuilles, abonnementen en notificaties later afzonderlijk kunnen schalen zonder een volledige herschrijving.

De doelarchitectuur is geen lijst verplichte technologieën. Redis, een queue, workers, event streaming of aparte services worden pas ingevoerd wanneer één of meer objectieve triggers bereikt zijn, zoals aanhoudende providerquota-problemen, p95-latency buiten de SLO, databasecontentie, niet-idempotente achtergrondtaken of een deploymentkoppeling die releases onveilig maakt.

### 4.2 Modulair ontwerp

Domeinregels mogen niet rechtstreeks afhangen van een specifieke provider-SDK, databaseclient of UI-framework. Iedere externe integratie krijgt een intern contract, een adapter en contracttests. Routers blijven dun: validatie en autorisatie gebeuren aan de grens, terwijl domeinlogica in afzonderlijke services staat en datatoegang via expliciete repositories/helpers verloopt.

Bestanden worden opgesplitst zodra verantwoordelijkheden vermengd raken of een router onoverzichtelijk wordt. Nieuwe code gebruikt gedeelde types en schema’s, vermijdt duplicatie en houdt side effects expliciet.

### 4.3 Architecture Decision Records

Een ADR is verplicht bij keuzes met hoge migratiekost of brede impact, waaronder een marktdata- of betaalprovider, cachetechnologie, queue, authenticatiemodel, databasewijziging met datamigratie, hostingwijziging en nieuwe runtime. Een ADR beschrijft context, beslissing, alternatieven, voor- en nadelen, security- en kosteneffecten, exitstrategie en herzieningstriggers.

### 4.4 Diagrammen

[`docs/architecture.md`](docs/architecture.md) bevat minimaal een systeemcontext, componentoverzicht, belangrijke datastromen en trust boundaries. Diagrammen worden aangepast in dezelfde wijziging die de architectuur beïnvloedt.

## 5. Securitystandaard

Trimilix gebruikt de OWASP Top 10 en OWASP ASVS als controlekader en NIST SSDF als procesreferentie.[1] [2] [3] Deze verwijzingen vervangen geen threat model of productgerichte risicoanalyse.

### 5.1 Authenticatie en sessies

Authenticatie gebruikt het platform-OAuthmechanisme en server-side gevalideerde sessies. Sessiecookies moeten `HttpOnly`, `Secure` en een passende `SameSite`-instelling gebruiken. Login-, logout- en callbackflows worden getest op replay, state-validatie, open redirects en sessiefixatie. Gevoelige acties mogen nooit uitsluitend op frontendstatus vertrouwen.

### 5.2 Autorisatie

Iedere procedure bepaalt expliciet of ze publiek, aangemeld, beheerdergebonden of eigenaarsgebonden is. Objecttoegang filtert in de databasequery tegelijk op object-ID en gebruiker-ID; eerst ophalen en daarna in applicatiecode controleren is enkel aanvaardbaar wanneer de query niet veilig gecombineerd kan worden. Een niet-toegankelijk object geeft bij voorkeur dezelfde respons als een niet-bestaand object om enumeratie te beperken.

Adminfuncties gebruiken een centrale `adminProcedure` of gelijkwaardig middlewaremechanisme. Autorisatietests omvatten minstens: eigenaar toegestaan, andere gebruiker geweigerd, niet-aangemeld geweigerd en beheerder volgens het bedoelde beleid.

### 5.3 Input, output en bestanden

Alle externe input wordt met Zod of een gelijkwaardig schema gevalideerd. Limieten gelden voor lengte, formaat, numerieke grenzen en toegestane waarden. Fouten lekken geen stacktraces, interne identifiers, query’s of secrets. Bestanden worden rechtstreeks of via gecontroleerde helpers naar objectopslag gestuurd; grote uploads gebruiken geen globale JSON-bodyparser.

### 5.4 Secrets en persoonsgegevens

Secrets worden uitsluitend via beveiligde projectinstellingen of een secret manager beheerd. Ze komen nooit in broncode, documentatie, fixtures, logs, screenshots, querystrings of analytics terecht. Secretrotatie moet mogelijk zijn zonder codewijziging. Logs bevatten geen tokens, volledige financiële payloads, betalingsidentifiers of onnodige persoonsgegevens.

### 5.5 Dependency- en secret-scanning

Iedere belangrijke sprint voert minimaal een dependency audit en repository-secret-scan uit. Bevindingen worden op ernst beoordeeld; kritieke en hoge kwetsbaarheden blokkeren productie tenzij een gedocumenteerde, tijdsgebonden risicoacceptatie bestaat. Scanners zijn signalen en worden steeds handmatig beoordeeld op bereikbaarheid en werkelijke impact.

### 5.6 Securitymelding

Een nieuw kritiek of hoog risico wordt onmiddellijk aan de eigenaar gemeld met impact, getroffen component, misbruikscenario, tijdelijke mitigatie en structurele oplossing. Een securityfix krijgt tests die regressie voorkomen. Securitybevindingen worden niet afgezwakt om een sprint als ‘af’ te kunnen rapporteren.

## 6. Data- en privacystandaard

Trimilix verwerkt enkel gegevens die nodig zijn voor de productfunctie. Financiële data wordt beschouwd als gevoelig, ook wanneer ze juridisch niet onder een bijzondere categorie valt. Toegang wordt gelogd op een privacybewuste manier wanneer auditability dat vereist. Retentie, verwijdering en export moeten per gegevenstype worden gedefinieerd vóór publieke lancering.

Bedragen worden in de kleinste valuta-eenheid opgeslagen. Business timestamps worden in UTC bewaard en aan de frontend in de lokale tijdzone weergegeven. Databasewijzigingen zijn schema-first, gereviewd, gemigreerd en getest. Destructieve migraties vereisen een terugvalplan en een aantoonbare back-up of export.

## 7. Performance en schaalbaarheid

### 7.1 Service Level Indicators

Voor productie worden minimaal requestvolume, foutpercentage, p50/p95/p99-responstijd, databasequeryduur, connectiegebruik, externe API-latency en cache hit ratio gevolgd. Een SLO wordt pas vastgelegd wanneer er voldoende baselinegegevens zijn; streefwaarden zonder meting worden als hypothese aangeduid.

### 7.2 Database

Query’s selecteren enkel noodzakelijke kolommen, gebruiken passende indexen en vermijden N+1-patronen. Nieuwe of gewijzigde kritieke query’s worden met realistische datavolumes getest. Transacties worden gebruikt wanneer meerdere writes één businessactie vormen. Idempotency is verplicht voor betalingen, webhooks en herhaalbare mutaties met financieel effect.

### 7.3 Caching

Caching wordt gebruikt wanneer het aantoonbaar latency, providerquota of kosten verbetert. Iedere cache definieert sleutel, TTL, invalidatie, maximaal aanvaardbare stale data, privacyclassificatie en fallback. Gebruikersspecifieke financiële data mag niet via een gedeelde sleutel lekken. Cachemisses worden waar nuttig samengevoegd om een stampede te voorkomen.

### 7.4 Load- en stresstesten

Vóór een belangrijke publieke lancering of infrastructuurwijziging worden kritieke lees- en schrijfpaden belast met realistische scenario’s. Het rapport bevat dataset, concurrentie, duur, percentielen, foutpercentage, bottlenecks, kostenimpact en stopcriteria. Stresstesten gebeuren nooit ongecontroleerd op productie.

### 7.5 Schaaltriggers

| Mogelijke uitbreiding | Objectieve trigger |
|---|---|
| Gedeelde Redis-cache | Meerdere app-instanties met inconsistente lokale cache, of providerquota/kosten die door herhaalde requests oplopen |
| Queue en workers | Langlopende of herhaalbare taken blokkeren requests, vereisen retries of moeten idempotent buiten de requestcyclus draaien |
| Aparte marktdata-service | Marktdata heeft onafhankelijk schaal-, beveiligings- of deploygedrag |
| Read replica | Gemeten leesdruk veroorzaakt databasecontentie ondanks query- en indexoptimalisatie |
| Multi-region | Bedrijfscontinuïteit of latency rechtvaardigt de extra complexiteit en dataresidentie is opgelost |

## 8. Marktdata en provider-onafhankelijkheid

Alle marktdata verloopt server-side via het interne contract dat in [`docs/market-data-architecture.md`](docs/market-data-architecture.md) wordt beschreven. Frontendcode kent geen providersleutels, providereindpunten of providerspecifieke payloads. Intern gebruiken we genormaliseerde instrumentidentiteit met bij voorkeur ISIN plus beurs/MIC en valuta; een tickersymbool alleen is onvoldoende voor betrouwbare Europese ETF-identificatie.

De adapterlaag ondersteunt time-outs, retries met begrensde back-off, rate-limitinterpretatie, circuit breaking, quota- en kostenmeting en gecontroleerde failover. Failover is alleen toegestaan wanneer datalicenties, symboolmapping, valuta, vertraging en timestampsemantiek compatibel zijn. We mengen nooit stilzwijgend real-time, vertraagde en end-of-daydata.

Premium real-time koersen worden via een server-side entitlement geactiveerd. Frontendverberging is geen toegangscontrole. De server controleert het abonnement, providerrechten, beursdekking en quota vóór een real-time of streamingrespons wordt geopend.

## 9. Observability en incidentbeheer

Logs zijn gestructureerd en gebruiken een request- of correlation-ID. Metrics meten technische gezondheid én economische gezondheid: providerrequests, foutpercentage, cache hit ratio, quota, kosten per provider, kosten per gebruiker en kosten per abonnementsplan. Distributed tracing wordt toegevoegd wanneer verzoeken meerdere processen of services doorlopen; voor de huidige monoliet volstaan eerst gerichte timings en correlation-ID’s.

Alerts zijn actiegericht en bevatten eigenaar, ernst, runbook en escalatiepad. We vermijden alerts op symptomen zonder handelingsperspectief. Kritieke incidenten krijgen een tijdlijn, impact, root cause, mitigatie, herstel en preventieve acties zonder schuldtoewijzing.

## 10. Kostenbeheer

Iedere betaalde externe API krijgt een budgeteigenaar, prijsmodel, quota, waarschuwingdrempel en kill switch. Kosten worden genormaliseerd per provider, feature, gebruiker en abonnementsplan. Nieuwe premiumfunctionaliteit wordt niet gelanceerd zonder unit economics en een limiet tegen onbegrensde providerkosten.

Een kostendashboard is **gepland** en moet minstens het volgende tonen: aantal requests, cache hit ratio, foutpercentage, kosten per provider, kosten per actieve gebruiker, kosten per betalende gebruiker, hoogste verbruikers en prognose tegenover budget. Tot dat dashboard bestaat, worden cijfers niet als ‘gemonitord’ omschreven.

## 11. Omgevingen en releasebeheer

Trimilix gebruikt logisch gescheiden **Development**, **Staging** en **Production**. Wanneer de hostinglaag nog geen drie fysiek gescheiden omgevingen biedt, wordt dat als platformrisico geregistreerd en worden minimaal afzonderlijke configuratie, secrets en data gebruikt. Er wordt nooit rechtstreeks in productie ontwikkeld.

| Omgeving | Doel | Data en integraties |
|---|---|---|
| Development | Lokale ontwikkeling en snelle tests | Geen productiegegevens; sandboxproviders waar mogelijk |
| Staging | Integratie-, migratie-, security- en acceptatietests | Productie-achtige synthetische data; testbetalingen |
| Production | Klantverkeer | Strikt beheerde secrets, monitoring, back-up en change control |

Een productieklare release vereist geslaagde typecheck, tests, build, dependencybeoordeling, secret-scan, migratiecontrole, documentatie-update en rollbackplan. Betalings-, authenticatie-, autorisatie- en datamigratiewijzigingen krijgen expliciete handmatige review.

## 12. Back-up en herstel

Back-upverantwoordelijkheden worden per laag vastgelegd. Broncode en documentatie worden via versiebeheer en projectcheckpoints beschermd. Databaseback-ups en point-in-time recovery zijn platformafhankelijk en moeten met bewijs geverifieerd worden. Configuratie wordt versiebeheerbaar gemaakt zonder secrets. Secrets worden via een beveiligde beheerlaag gereconstrueerd of volgens het platformbeleid beschermd; ze worden niet naar platte tekst geëxporteerd.

| Asset | Vereiste | Herstelbewijs |
|---|---|---|
| Database | Versleutelde back-up, retentie en waar mogelijk point-in-time recovery | Periodieke restore naar geïsoleerde omgeving |
| Broncode | Externe Git-repository en projectcheckpoint | Schone checkout/build |
| Configuratie | Versiebeheerbare niet-geheime configuratie | Reproduceerbare environment setup |
| Documentatie | Zelfde lifecycle als code | Aanwezig in release/checkpoint |
| Secrets | Beveiligd beheer en rotatieprocedure | Rotatietest zonder secretwaarde te loggen |

Een back-up telt pas als betrouwbaar nadat een hersteltest geslaagd is. Hersteldoelstellingen voor tijd en dataverlies worden vóór publieke betalende lancering samen met de bedrijfsimpact vastgelegd.

## 13. Test- en kwaliteitsstrategie

Iedere bugfix bevat een regressietest. Iedere feature bevat tests op domeinregels, autorisatie en foutpaden. Backendprocedures worden via caller- of servicetests getest; database-intensieve functies krijgen integratietests met een geïsoleerde testdatabase zodra die omgeving beschikbaar is. Frontendtests focussen op kritieke interacties; browservalidatie vervangt geen unit- of integratietests.

De minimale lokale kwaliteitsgate is:

```bash
pnpm check
pnpm test
pnpm build
pnpm audit --audit-level high
pnpm security:secrets
```

Een auditwaarschuwing wordt nooit automatisch gelijkgesteld aan exploiteerbaarheid, maar moet wel worden beoordeeld en gedocumenteerd. Tests mogen geen echte klantgegevens, productiecredentials of betaalgeheimen gebruiken.

## 14. Documentatiestandaard

De volgende documenten worden samen met relevante code bijgewerkt:

| Document | Verantwoordelijkheid |
|---|---|
| `ENGINEERING_HANDBOOK.md` | Normen, releasegates en engineeringbeleid |
| `docs/architecture.md` | Huidige architectuur, doelrichting, datastromen en trust boundaries |
| `docs/market-data-architecture.md` | Providercontract, cache, failover, licenties en premium entitlement |
| `docs/cto-baseline-audit.md` | Feitelijke baseline en gaps |
| `docs/cto-sprint-report-template.md` | Vast sprintreviewformat |
| `docs/adr/` | Beslissingen met alternatieven en trade-offs |
| `drizzle/schema.ts` en migraties | Datamodel als code en wijzigingshistoriek |

API-documentatie wordt uit de getypeerde tRPC-contracten en aanvullende domeindocumentatie opgebouwd. Voor externe integraties leggen we time-outs, retries, foutmapping, quota en gegevensclassificatie vast.

## 15. Sprintreview en technische schuld

Na iedere belangrijke sprint wordt een CTO-rapport gemaakt met: gebouwde functionaliteit, technische keuzes en motivatie, open risico’s, technische schuld, testresultaten, performanceanalyse, securitystatus, gewijzigde documentatie en aanbevelingen voor de volgende sprint. ‘Niet gemeten’ is een geldige maar expliciete status; het wordt nooit vervangen door een ongefundeerde positieve claim.

Technische schuld wordt als backlogitem geregistreerd met impact, waarschijnlijkheid, geschatte inspanning, eigenaar en beslismoment. Security-, dataverlies- en betalingsrisico’s krijgen voorrang op cosmetische verbeteringen.

## 16. Kritisch besluitvormingskader

Opdrachten worden niet blind uitgevoerd. Wanneer een alternatief veiliger, eenvoudiger, goedkoper of schaalbaarder is, wordt het voorgesteld met voor- en nadelen. De snelste oplossing wordt afgewezen wanneer ze aantoonbaar ten koste gaat van veiligheid, onderhoudbaarheid, betrouwbaarheid, schaalbaarheid of prestaties.

Bij iedere belangrijke keuze beantwoorden we vijf vragen: welk probleem lossen we op, welke meetbare eis geldt, welke eenvoudigere alternatieven bestaan, wat is de exitstrategie, en welk bewijs toont dat de oplossing werkt?

## 17. Uitzonderingen en handhaving

Een afwijking van dit handbook vereist een geregistreerde reden, risico-inschatting, eigenaar en vervaldatum. Kritieke securitygates, eigenaarschapscontrole, secretbescherming en betalingsintegriteit mogen niet stilzwijgend worden overgeslagen. Deze standaard wordt bij iedere belangrijke sprint herzien en alleen aangepast via versiebeheer.

## Referenties

[1]: https://owasp.org/www-project-top-ten/ "OWASP Top 10"
[2]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
[3]: https://csrc.nist.gov/Projects/ssdf "NIST Secure Software Development Framework"
