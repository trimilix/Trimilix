# Monitoring, SLI’s en kostenbewaking

**Versie:** 1.0  
**Laatst bijgewerkt:** 16 juli 2026  
**Status:** Vereiste operationele standaard; instrumentatie en dashboards zijn nog niet volledig geïmplementeerd  
**Eigenaar:** CTO / Engineering

> Een SLI die niet automatisch gemeten wordt, is een ontwerpdoel en geen operationeel bewijs. Dit document maakt daarom telkens onderscheid tussen **te meten**, **eerste doelrichting** en **huidige status**.

## 1. Meetprincipes

Trimilix meet gebruikersimpact, systeemgezondheid, datakwaliteit en variabele kosten. Metrics gebruiken lage-cardinaliteitslabels. Request-ID’s en gepseudonimiseerde gebruikers-ID’s horen in logs of traces, niet in metrieklabels. Logs bevatten geen secrets, volledige portefeuilles, betaalgegevens of ruwe providerpayloads.

| Signaal | Doel | Retentieprincipe |
|---|---|---|
| Metrics | Trends, SLO’s, capaciteit en alarmen | Geaggregeerd; afgestemd op operationele en wettelijke noden |
| Gestructureerde logs | Diagnose en auditspoor | Minimaal en tijdsgebonden; gevoelige data redigeren |
| Traces | Latency over componentgrenzen | Sampling; geen gevoelige payloads |
| Business events | Entitlements, betalingen en providerkosten | Idempotent en auditbaar |
| Uptime probes | Externe beschikbaarheid | Onafhankelijk van applicatie-instantie |

## 2. Kern-SLI’s

De doelwaarden hieronder zijn **startwaarden voor staging en vroege productie**. Ze worden na een meetperiode herzien. Er wordt geen 99,9%-belofte aan klanten gedaan zolang hosting, database, externe providers, monitoring en incidentrespons dat niet aantoonbaar ondersteunen.

| Domein | SLI | Berekening | Eerste doelrichting | Status |
|---|---|---|---|---|
| Beschikbaarheid | Succesvolle kritieke requests | `(geldige 2xx + verwachte 4xx) / alle geldige requests` | ≥ 99,5% per 30 dagen | Niet geïnstrumenteerd |
| Latency | API-responstijd | p50, p95 en p99 per procedure | p95 < 500 ms zonder externe provider | Niet geïnstrumenteerd |
| Fouten | Onverwachte serverfouten | 5xx / alle requests | < 0,5% | Basislogs aanwezig; geen dashboard |
| Browser | Clientfouten | Sessies met onverwachte fout / actieve sessies | Dalende trend; releaseblokkade bij kritieke regressie | Debuglog aanwezig; geen SLI |
| Database | Querylatency | p50/p95/p99 per queryfamilie | p95 < 200 ms voor kritieke reads | Niet geïnstrumenteerd |
| Database | Connectiebelasting | actieve en wachtende connecties / limiet | Alarm bij 70%, 85% en 95% | Platformafhankelijk |
| Server | CPU en geheugen | gebruik / allocatie per instantie | Alarm op aanhoudende verzadiging | Platformafhankelijk |
| Marktdata | Quote-actualiteit | `nu - marketTimestamp` per mode | Binnen contractuele modegrens | Provider nog niet actief |
| Marktdata | Cache-hitratio | hits / `(hits + misses)` | Baseline na MVP; alarm op abrupte daling | Cache nog niet actief |
| Marktdata | Providerfouten | timeout, 429 en invalid data / calls | Per provider en endpoint volgen | Provider nog niet actief |
| Kosten | Providerverbruik | calls, credits, bytes of berichten per periode | Alarm op 70%, 85% en 95% quota | Provider nog niet actief |
| Betalingen | Webhookverwerking | geldige verwerkte events / ontvangen events | 100% of gecontroleerde retry/DLQ | Nog te valideren |
| Jobs | Taaksucces | geslaagde / afgeronde taken | Per jobklasse gedefinieerd | Geen businessjobs actief |

## 3. Kritieke journeys

| Journey | Synthetische of interne controle | Faalimpact |
|---|---|---|
| Publieke startpagina laden | HTTP-status, renderbare HTML en kernasset | Acquisitie en merkzichtbaarheid |
| Inloggen | OAuth-start, callback en `auth.me` | Toegang tot alle persoonlijke functies |
| Portefeuille openen | Auth, eigenaarsquery en analyseprocedure | Kernproduct en gevoelige financiële data |
| ETF-beheer | Adminautorisatie en mutatie | Catalogusintegriteit |
| Abonnementsstatus lezen | Database en betaalstatus | Premiumtoegang en omzet |
| Marktdata ophalen | Provider, cache, timestamp en entitlement | Waardering en productvertrouwen |

Een health endpoint mag alleen procesgezondheid aantonen. Readiness controleert noodzakelijke dependencies met korte time-outs, maar retourneert geen secrets, connection strings of interne stacktraces.

## 4. Dashboardstructuur

| Dashboard | Minimale inhoud | Primair publiek |
|---|---|---|
| Executive health | Uptime, kritieke foutpercentages, actieve incidenten en kostenforecast | CTO / Business Owner |
| API | Requestvolume, p50/p95/p99, 4xx/5xx per procedure | Engineering |
| Database | Querylatency, connecties, fouten en trage queryfamilies | Engineering |
| Marktdata | Providerhealth, quoteleeftijd, quota, cache en degradaties | Engineering / Product |
| Betalingen | Webhookvolume, retries, entitlementfouten en omzetimpact | Product / Finance |
| Frontend | Clientfouten, Core Web Vitals en bundletrend | Engineering / Product |
| Security | Rate-limit-events, mislukte auth, adminmutaties en secretscanstatus | CTO / Security |
| Kosten | Provider-, hosting-, database- en opslagkosten per feature/plan | CTO / Finance |

## 5. Alarmbeleid

Een alarm moet een eigenaar, ernst, gebruikersimpact, runbook en herstelcriterium hebben. Niet-actiegerichte waarschuwingen worden verwijderd of verlaagd.

| Ernst | Definitie | Reactie |
|---|---|---|
| SEV-1 | Brede uitval, datalek, foutieve financiële data of ongeautoriseerde toegang | Onmiddellijke incidentcoördinatie; risicofunctie uitschakelen |
| SEV-2 | Kritieke journey sterk gedegradeerd of provideruitval zonder veilige fallback | Snelle respons binnen afgesproken wachtdienstvenster |
| SEV-3 | Beperkte fout, stijgende latency, quota- of kostendrempel | Tijdens werkuren onderzoeken en plannen |
| SEV-4 | Trend, technische schuld of niet-urgente optimalisatie | Backlog met meetbaar acceptatiecriterium |

Voorbeelden van actiegerichte alarmen zijn een plots stijgende 5xx-rate, quoteleeftijd boven de toegelaten mode, herhaalde cross-user-autorisatiefouten, providerquota boven 85%, mislukte betaalwebhooks en databaseconnectieverzadiging.

## 6. Provider- en kostenmetrics

| Metriek | Eenheid | Dimensies |
|---|---|---|
| `marketdata_requests_total` | requests | provider, endpoint, mode, result |
| `marketdata_request_duration_ms` | milliseconden | provider, endpoint |
| `marketdata_quote_age_seconds` | seconden | exchange, mode |
| `marketdata_cache_total` | events | hit/miss/stale, mode |
| `marketdata_quota_used` | credits of requests | provider, quota_type |
| `marketdata_cost_forecast` | contractvaluta/maand | provider, feature |
| `marketdata_degradation_total` | events | from_mode, to_mode, reason |
| `marketdata_active_symbols` | instrumenten | provider, mode |

User-ID, portfolio-ID en ticker worden niet als metrieklabel gebruikt. Detailonderzoek gebeurt via gecorreleerde, geredigeerde logs.

## 7. Release- en sprintreview

Elke release legt minimaal vast: teststatus, typecheck, secretscan, dependencyaudit, buildstatus, bekende incidenten, bundletrend en nieuwe operationele risico’s. Elke sprintreview vergelijkt SLI’s met de vorige periode en noteert waar meting nog ontbreekt.

## 8. Implementatievolgorde

| Stap | Resultaat | Exitcriterium |
|---|---|---|
| 1 | Gestructureerde requestlogging en request-ID | Geen gevoelige payloads; correlatie werkt |
| 2 | Health- en readinessprobes | Afhankelijkheidsfalen correct zichtbaar |
| 3 | API- en databasebasismetrics | p50/p95/p99, fouten en volume beschikbaar |
| 4 | Frontendfout- en performancebewaking | Releasevergelijking mogelijk |
| 5 | Marktdata- en kostenmetrics | Actief vóór providerproductie |
| 6 | Dashboards, alarmen en runbooks | Elk alarm is actiegericht en getest |
| 7 | SLO- en capaciteitsreview | Doelwaarden gebaseerd op gemeten baseline |

## 9. Huidige open punten

| Open punt | Risico | Volgende maatregel |
|---|---|---|
| Geen centrale metricsbackend | Geen historische SLI’s of automatische alarmen | Platformmogelijkheden en integratie selecteren |
| Geen externe uptimeprobe | Interne logs missen volledige uitval | Onafhankelijke probe configureren |
| Geen rate-limitmetrics | Misbruik en kostenpieken minder zichtbaar | Rate limiter ontwerpen en instrumenteren |
| Geen databasequerymetrics | Schaal- en indexproblemen worden laat ontdekt | Drizzle/querylaag instrumenteren |
| Geen providerkostenledger | Real-time unit economics niet afdwingbaar | Voor providerlancering implementeren |
