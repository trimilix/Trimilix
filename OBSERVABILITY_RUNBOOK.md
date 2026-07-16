# Trimilix observability- en CI-runbook

## Doel en actuele status

Dit runbook beschrijft de **Fase A-baseline** voor technische observability, healthchecks, incidentdiagnose en continue integratie. De applicatie produceert privacyveilige JSON-lines op stdout/stderr, correleert HTTP- en tRPC-fouten met een request-ID, onderscheidt dependencyvrije liveness van databaseafhankelijke readiness en verifieert iedere codewijziging via een niet-deployende GitHub Actions-workflow.

> Een log- of metriekbron is pas operationele monitoring nadat een externe collector, bewaarbeleid, dashboard, alertregel, eigenaar en escalatiekanaal aantoonbaar zijn geconfigureerd. De repository levert de signalen en drempeldefinities; de Manus-hostingintegratie voor centrale retentie en automatische paging is nog een expliciete deploymentactie.

## Runtimearchitectuur

| Onderdeel | Implementatie | Contract |
|---|---|---|
| Requestcorrelatie | `server/_core/observability.ts` | Valide `x-request-id` wordt behouden; anders genereert de server een UUID. Dezelfde waarde staat in de responseheader, tRPC-context en foutlogs. |
| Gestructureerde logs | `server/_core/logger.ts` | Eén JSON-object per regel met canonieke timestamp, level, service, environment en event. |
| HTTP-SLI-signalen | `requestObservabilityMiddleware` | Registreert methode, grove routeklasse, status, duur en request-ID; geen URL, querystring, body of headers. |
| Startup database-integriteit | `server/_core/databaseIntegrity.ts` | Valideert vóór luisteren read-only binnen tien seconden TiDB CHECK-enforcement en exact de negen benoemde constraints; iedere afwijking stopt startup fail-closed. |
| Liveness | `GET /healthz` | Dependencyvrije procescheck; antwoordt `200 {"status":"ok"}` zolang Express requests kan verwerken. |
| Readiness | `GET /readyz` | Voert een read-only `SELECT 1` uit met standaarddeadline van 1 seconde; antwoordt 200 bij succes en minimale 503 bij fout of timeout. |
| Express-foutgrens | `expressErrorHandler` | Antwoordt met een generieke 500 en request-ID; logt uitsluitend veilige foutclassificatie. |
| tRPC-foutgrens | `server/_core/trpc.ts` en bootstrap-`onError` | Onverwachte interne berichten worden generiek gemaakt; stacktraces worden buiten development verwijderd; bestaande business- en authcodes blijven behouden. |

De volgorde is bewust: securityheaders en parsers worden eerst ingesteld, daarna requestcorrelatie en healthroutes, vervolgens rate limiting en applicatieroutes, en ten slotte de centrale foutgrenzen. `/healthz` mag geen database-, provider- of storagecall uitvoeren. `/readyz` controleert uitsluitend dependencies die vereist zijn om klantverkeer verantwoord te bedienen.

## Privacy- en logcontract

De logger normaliseert regelscheidingen, begrenst strings, arrays en objectdiepte en redigeert sleutelvelden die duiden op credentials, sessies, persoonsgegevens of payloads. Canonieke logvelden kunnen niet door callerdata worden overschreven.

| Nooit loggen | Wel loggen |
|---|---|
| Authorizationheaders, cookies, JWT’s, tokens, secrets en wachtwoorden | Eventnaam, level, ISO-timestamp, service en environment |
| Request-/responsebodies en volledige financiële payloads | Server-side request-ID en grove routeklasse |
| E-mail, openID, volledige IP-adressen en querystrings | HTTP-methode, statuscode en afgeronde duur in milliseconden |
| Stacktrace of database-/providerbericht in publieke responses | Veilige foutnaam of foutcode zonder berichtinhoud |

Nieuwe events gebruiken een stabiele lower-case naam zoals `http_request_completed`, `readiness_failed` of `trpc_request_failed`. Vrije tekst is geen eventnaam. Externe invoer blijft onbetrouwbare data en mag niet als zelfstandig logrecord worden geïnterpreteerd.

## SLI’s en voorlopige SLO-/alertdrempels

De in-process tellers zijn testbaar bewijs voor signaalvorming, maar niet duurzaam over restarts en niet globaal over autoscaling instances. Productiedashboards moeten daarom de JSON-eventstream centraal aggregeren. Tot die collector bestaat, is de status **signalen beschikbaar, centrale monitoring niet geactiveerd**.

| Signaal | Definitie uit logs | Voorlopige drempel | Ernst en actie |
|---|---|---|---|
| Server error ratio | `statusCode >= 500` gedeeld door alle niet-health HTTP-responses | Meer dan 2% gedurende 10 minuten bij minstens 100 requests | P2; controleer recente release, tRPC-/Express-events en dependencystatus |
| Kritieke foutpiek | Zelfde ratio | Meer dan 5% gedurende 5 minuten bij minstens 50 requests | P1; stop releaseverkeer waar mogelijk en start incidentcoördinatie |
| Readiness | Aandeel 503 op `/readyz` | Drie opeenvolgende fouten binnen 2 minuten per actieve instantie | P1 wanneer klantverkeer geraakt wordt; controleer databaseconnectiviteit en platformstatus |
| Requestlatency | p95 van `durationMs`, exclusief healthroutes | Meer dan 1.000 ms gedurende 10 minuten bij minstens 100 requests | P2; splits op routeklasse en onderzoek database/providerlatency |
| Auth-/rate-limitsecurityevents | Toename van veilige securityeventnamen | Meer dan driemaal de 7-daagse uurbaseline, met minimumvolume 50 | P2 securitytriage; geen automatische accountblokkade op dit signaal alleen |
| CI-hoofdgate | Status van workflow `CI` | Iedere fout blokkeert merge/release | P2 voor normale regressie; P1 wanneer een urgente securityfix niet veilig leverbaar is |

Deze drempels zijn startwaarden en moeten na minimaal twee weken representatief verkeer worden herijkt. Een herijking wordt als gedocumenteerde wijziging gereviewd; drempels worden niet verruimd om een structurele fout te verbergen.

## Incidentrunbook

### Runtime opent geen luisterpoort

Zoek eerst naar `database_integrity_preflight_failed` en gebruik alleen het veilige veld `reason`. `probe_failed` vereist controle van databasebereikbaarheid, configuratie en platformstatus; `check_capability_disabled` vereist de goedgekeurde TiDB-capabilityprocedure; `constraint_set_mismatch` vereist de read-only schema-equivalentiecontrole en vergelijking met de gecommitteerde migraties. Omzeil de startupgate niet en voeg geen journalrecord toe zonder bewezen schema-effect. Herstel volgens `TECHNICAL_HANDOVER.md` en start pas daarna opnieuw.

### `/healthz` faalt

Een livenessfout wijst op een proces-, runtime- of routingprobleem en niet op een bewust gecontroleerde database-uitval. Controleer eerst deploymentstatus en runtimeconsole. Zoek daarna naar `server_start_failed`, `express_unhandled_error`, out-of-memorysignalen of een restartlus. Herstart alleen wanneer het proces aantoonbaar vastzit; voorkom een livenessconfiguratie die instances onder hoge belasting massaal herstart.

### `/readyz` geeft 503 terwijl `/healthz` 200 blijft

Dit betekent dat het proces leeft maar de vereiste databaseprobe niet binnen de deadline slaagt. Controleer database- en netwerkstatus, recente schemawijzigingen, connection limits en de eventreeks `readiness_failed`. De response bevat bewust geen databasefout. Voer bij migratietwijfel de read-only schema-equivalentiecontrole uit; voer nooit automatisch DDL uit vanuit een healthcheck.

### Klant meldt een 500

Vraag uitsluitend om tijdstip en de responseheader `x-request-id`; vraag geen token, cookie, volledige financiële payload of screenshot met persoonsgegevens. Zoek het ID in `http_request_completed`, `trpc_request_failed` en `express_unhandled_error`. Classificeer impact, identificeer de eerste veilige foutcode en koppel een regressietest aan de fix.

### Logs lijken gevoelige data te bevatten

Behandel dit als security-incident. Stop extra distributie van het log, beperk toegang, bepaal welk veld en welke periode geraakt zijn, roteer mogelijk blootgestelde credentials, volg het platformproces voor verwijdering en voeg een redactie-regressietest toe. Kopieer de gevoelige waarde niet naar tickets of documentatie.

## Continue integratie

`.github/workflows/ci.yml` draait op iedere push en pull request met `contents: read`, immutable action-SHA’s, Node 22.13.0, pnpm 10.4.1 en een frozen lockfile. De workflow deployt niet en ontvangt geen productiegeheimen.

| Gate | Commando | Faalbetekenis |
|---|---|---|
| Reproduceerbare installatie | `pnpm install --frozen-lockfile` | Manifest en lockfile zijn niet consistent of supply-chaininstallatie faalt |
| Typeveiligheid | `pnpm check` | Typecontract of buildinput is inconsistent |
| Regressies | `pnpm test` | Unit-/integratie-/securitycontract faalt |
| Secret-scan | `pnpm security:secrets` | Tracked bron bevat verdacht credentialpatroon |
| Dependencybeoordeling | `pnpm security:deps` | Productieafhankelijkheid overschrijdt het vastgelegde auditbeleid |
| Databaseherstel | `node scripts/verify-migrations-and-recovery.mjs` | Migratieketen, constraints, rollback, atomaire upsert of restorechecksum faalt op geïsoleerde TiDB |
| Productiebundel | `pnpm build` | Frontend- of serverartefact kan niet reproduceerbaar worden gebouwd |

De CI-database is synthetisch en tijdelijk. De live TiDB-capability-, constraint- en journalcontrole blijft een afzonderlijke read-only pre-releasegate voor databasewijzigingen; productiecredentials worden niet aan pull-requestjobs gegeven.

## Lokale verificatie

De algemene lokale gate is `pnpm verify`. Voor wijzigingen aan schema, constraints, journal of herstelgedrag is daarnaast een expliciete testdatabase vereist:

```bash
DATABASE_URL=mysql://... node scripts/verify-migrations-and-recovery.mjs
```

Voor een live databasecontrole worden uitsluitend de gedocumenteerde read-only scripts gebruikt. Journalreconciliatie of CHECK-remediatie vereist afzonderlijke goedkeuring en de fail-closed procedures in `TECHNICAL_HANDOVER.md`.

## Deploymentkoppeling

Configureer de hostinglaag met `/healthz` als livenesscheck en `/readyz` als readinesscheck. Kies platformtimeouts die langer zijn dan de interne readinessdeadline en gebruik meerdere opeenvolgende failures voordat een instantie wordt herstart. Koppel stdout/stderr aan een centrale JSON-collector met encryptie, toegangsbeheer, retentie en veldgebaseerde filters. Activeer pas daarna dashboards en alerts volgens de tabel hierboven en leg eigenaar plus escalatiekanaal vast.

## Normatieve bronnen

De logvelden, privacygrenzen en incidentdoelen volgen de [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) en [OWASP Top 10 2025 A09](https://owasp.org/Top10/2025/A09_2025-Security_Logging_and_Alerting_Failures/). De scheiding tussen dependencyvrije liveness en dependencybewuste readiness volgt de [Kubernetes probeconcepten](https://kubernetes.io/docs/concepts/workloads/pods/probes/). De CI-opzet volgt de officiële [GitHub Node.js CI-richtlijn](https://docs.github.com/actions/guides/building-and-testing-nodejs), [GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use) en [pnpm CI-documentatie](https://pnpm.io/continuous-integration).
