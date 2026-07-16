# Fase A observability — externe bronnotities

## OWASP Logging Cheat Sheet

Bron: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

OWASP beveelt consistente applicatielogging in een consumeerbaar standaardformaat aan. Logs moeten voldoende context bevatten voor **when, where, who and what**, inclusief een interactie-/correlatie-ID. Relevante gebeurtenissen zijn onder meer authenticatie- en autorisatiefouten, inputvalidatiefouten, sessiefouten, applicatie-/connectiviteitsfouten, startup/shutdown en misbruik van hoog-risicofuncties. Externe of clientaangeleverde logvelden blijven onbetrouwbare invoer. Een stdout-eventstream kan door de execution environment centraal worden verzameld.

De richtlijn waarschuwt tegen over- en onderlogging en tegen het opnemen van gevoelige informatie. Logdoelen moeten vooraf worden bepaald; operationele, security- en auditlogs kunnen verschillende doeleinden en retentie hebben.

## OWASP Top 10 2025 — A09 Security Logging & Alerting Failures

Bron: https://owasp.org/Top10/2025/A09_2025-Security_Logging_and_Alerting_Failures/

OWASP A09 beschrijft onvoldoende/inconsistente registratie van login-, access-control-, inputvalidatie- en high-value events als risico. Waarschuwingen en fouten moeten bruikbaar zijn, logs moeten door logmanagement kunnen worden verwerkt en gevoelige data/PII mogen niet uitlekken. Logdata moet veilig worden gecodeerd om loginjectie te voorkomen. Monitoring zonder alertdrempels en responseplaybooks is niet voldoende. Foutende transacties moeten rollbacken en controles moeten fail-closed werken.

## Consequenties voor Trimilix

De minimale implementatie gebruikt één JSON-lines logger naar stdout/stderr met vaste velden: ISO-timestamp, level, event, requestId, method, route-template of genormaliseerd pad, status, durationMs en privacyveilige foutclassificatie. JWT’s, cookies, Authorizationheaders, request-/responsebodies, openID, e-mail, volledige IP-adressen en stacktraces in publieke responses worden uitgesloten. Request-ID wordt server-side gevalideerd of gegenereerd en teruggegeven als responseheader. Securityevents blijven expliciete eventnamen behouden. Health/readinessresponses en centrale foutafhandeling moeten testbaar zijn; een externe collector/alertservice blijft een afzonderlijke deploymentintegratie.

## Kubernetes — liveness, readiness en startup probes

Bronnen:

- https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
- https://kubernetes.io/docs/concepts/workloads/pods/probes/

Kubernetes maakt een expliciet onderscheid. **Liveness** bepaalt of een container moet worden herstart en moet alleen een onherstelbare applicatiestoring signaleren; een verkeerd ontworpen livenessprobe kan cascadefouten veroorzaken. **Readiness** bepaalt of een instantie verkeer mag ontvangen en kan daarnaast strikt vereiste backenddependencies controleren. Bij een readinessfout blijft de container draaien maar ontvangt hij geen verkeer. HTTP-status 200–399 telt als probe-succes; timeouts en failure thresholds horen in de deploymentconfiguratie.

Voor Trimilix volgt hieruit: `/healthz` blijft een goedkope procescheck zonder databaseafhankelijkheid; `/readyz` voert een korte, read-only databaseprobe uit en retourneert 503 bij onbeschikbaarheid. Beide endpoints geven minimale JSON zonder secrets, stacktraces of infrastructuurdetails. De readinessdependency krijgt een applicatie-interne timeout zodat een vastgelopen databaseverbinding niet onbeperkt een request bezet.

## GitHub Actions en pnpm CI

Bronnen:

- https://docs.github.com/actions/guides/building-and-testing-nodejs
- https://docs.github.com/en/actions/reference/security/secure-use
- https://pnpm.io/continuous-integration
- https://github.com/actions/setup-node

GitHub adviseert een expliciete Node-versie via `setup-node`, een lockfile-gebaseerde installatie en minimale `GITHUB_TOKEN`-permissions. Gevoelige waarden horen niet als plaintext in workflows; pull-requestworkflows mogen geen privileged `pull_request_target`-patroon gebruiken voor onbetrouwbare code. pnpm draait in CI automatisch frozen-lockfile en adviseert dezelfde pnpm-major als waarmee de lockfile is gemaakt. `setup-node` kan de pnpm-store cachen, niet `node_modules`; caching is optioneel.

Voor Trimilix volgt hieruit: een niet-deployende workflow op `push` en `pull_request`, `permissions: contents: read`, Node 22 overeenkomstig de runtime, pnpm 10 overeenkomstig `packageManager`, `pnpm install --frozen-lockfile`, en afzonderlijke fail-faststappen voor typecheck, tests, secret-scan, dependency-audit, migratieketencontrole en productiebuild. De workflow ontvangt geen productie- of databasegeheimen; live TiDB-verificatie blijft een expliciete pre-release/operationele gate, terwijl CI de migratiebestanden, schema-asserties en herstelrehearsal geïsoleerd valideert.
