# Trimilix

> **Één platform. Één systeem. TRIMILIX.**

Trimilix is een Europees ETF-beleggingsplatform in publieke bèta. Het brengt portefeuillebeheer, ETF-analyse, portefeuilleanalyse, samengestelde-rendementsberekeningen en doelplanning samen in één Nederlandstalige financiële cockpit.

## Bètastatus

Deze repository bevat **Trimilix v0.1-beta**. De huidige release is bedoeld voor gecontroleerde publieke bètatests. Trimilix verstrekt geen persoonlijk beleggings-, juridisch of fiscaal advies. Financiële uitkomsten zijn indicatief en moeten vóór productiebeslissingen onafhankelijk worden gevalideerd.

De bestaande productroutes omvatten:

| Onderdeel | Doel | Toegangsgrens |
|---|---|---|
| Homepage | Publieke positionering en productnavigatie | Publiek |
| Registratie/Login | OAuth-gebaseerde gebruikersauthenticatie | Publiek instappunt |
| Dashboard | Persoonlijke financiële cockpit | Ingelogd |
| Portfolio's | Portefeuilles en posities beheren | Ingelogd, eigenaargebonden |
| ETF Checker | ETF-catalogus doorzoeken en analyseren | Publiek/in productcontext |
| Portfolio Checker | Waardegewogen portefeuille- en risicoanalyse | Ingelogd, eigenaargebonden |
| Compounding Simulator | Deterministische samengestelde-rendementsberekening | Publiek |
| Doelplanner | Financiële doelen plannen | Bètafunctionaliteit |

## Technische architectuur

Trimilix is een modulaire monoliet met end-to-end TypeScript-contracten.

| Laag | Technologie |
|---|---|
| Webclient | React 19, Vite 7, Tailwind CSS 4, Wouter |
| API | Express 4, tRPC 11, Zod |
| Data | Drizzle ORM, MySQL/TiDB |
| Authenticatie | OAuth, claimgebonden HttpOnly JWT-sessiecookie |
| Kwaliteit | TypeScript, Vitest, secret-scan, OSV dependency-audit, bundlebudgetten |
| Observability | JSON-lines logging, request-ID, `/healthz`, `/readyz`, SLI-tellers |

De productie-entrypoint is `server/_core/index.ts`. Financiële berekeningen zijn geïsoleerd in gedeelde, deterministische domeinlogica. De volledige architectuur en trust boundaries staan in [`docs/architecture.md`](docs/architecture.md).

## Mappenstructuur

```text
client/                 React-webclient en routes
server/                 tRPC-routers, databasehelpers en runtime
shared/                 Gedeelde types, constanten en financiële domeinlogica
drizzle/                Schema, migraties en seedondersteuning
scripts/                Reproduceerbare quality-, security- en migratiegates
docs/                   Architectuur, contracten, ADR's en onderzoeksbewijs
.github/workflows/       Least-privilege CI
```

## Lokale ontwikkeling

### Vereisten

- Node.js 22
- pnpm 10
- Een MySQL- of TiDB-database
- Geldige OAuth- en Forge-runtimeconfiguratie

### Installatie

```bash
git clone https://github.com/trimilix/trimilix.git
cd trimilix
corepack enable
pnpm install --frozen-lockfile
```

Maak uitsluitend lokaal een `.env`-bestand aan. **Commit nooit geheimen.** De server valideert de volgende kritieke variabelen fail-closed:

```dotenv
DATABASE_URL=
JWT_SECRET=
VITE_APP_ID=
OAUTH_SERVER_URL=
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

Aanvullende platformvariabelen kunnen nodig zijn voor de OAuth-portal, eigenaarmetadata, analytics en frontend-integraties. Zie [`server/_core/env.ts`](server/_core/env.ts) en [`TECHNICAL_HANDOVER.md`](TECHNICAL_HANDOVER.md). Gebruik voor productie een secretsmanager; plaats nooit echte waarden in broncode of documentatie.

### Database en runtime

```bash
pnpm db:push
pnpm dev
```

De ontwikkelserver start via het canonieke Express-entrypoint. Voor een productieartefact:

```bash
pnpm build
pnpm start
```

## Kwaliteits- en securitygates

Voer vóór iedere release de samengestelde gate uit:

```bash
pnpm verify
```

Deze gate omvat typechecking, Vitest-regressies, secret-scanning, dependency-audit, ongebruikte-dependencycontrole, productiebuild en bundlebudgetten. De GitHub Actions-workflow gebruikt een frozen lockfile en least-privilege permissies.

Afzonderlijke controles:

```bash
pnpm check
pnpm test
pnpm security:secrets
pnpm security:deps
pnpm deps:unused
pnpm build
```

Meld beveiligingsproblemen niet via een openbaar issue. Gebruik het private contactkanaal van de repository-eigenaar totdat een formeel security-adres is gepubliceerd.

## Operationele endpoints

| Endpoint | Betekenis |
|---|---|
| `GET /healthz` | Dependencyvrije liveness |
| `GET /readyz` | Timeout-begrensde read-only database-readiness |

Operationele drempels, loggingregels en incidentrespons staan in [`OBSERVABILITY_RUNBOOK.md`](OBSERVABILITY_RUNBOOK.md).

## Documentatie

| Document | Inhoud |
|---|---|
| [`ENGINEERING_HANDBOOK.md`](ENGINEERING_HANDBOOK.md) | Architectuur-, security-, performance- en migratiestandaarden |
| [`TECHNICAL_HANDOVER.md`](TECHNICAL_HANDOVER.md) | Operationele overdracht, migraties en herstelprocedures |
| [`OBSERVABILITY_RUNBOOK.md`](OBSERVABILITY_RUNBOOK.md) | Logging, SLI's, health/readiness en incidentrespons |
| [`docs/financial-calculation-contract.md`](docs/financial-calculation-contract.md) | Formules, eenheden, afronding en validatiegrenzen |
| [`PHASE_A_STABILIZATION_AUDIT_2026-07-16.md`](PHASE_A_STABILIZATION_AUDIT_2026-07-16.md) | Formeel stabilisatie- en releasebewijs |
| [`PRODUCT_BACKLOG.md`](PRODUCT_BACKLOG.md) | Bewust uitgestelde productontwikkeling |

## Bijdragen

Open eerst een issue met probleemstelling, risico en voorgestelde acceptatiecriteria. Wijzigingen aan financiële logica, authenticatie, autorisatie, migraties of observability vereisen regressietests en relevante documentatie-updates. Nieuwe productfuncties vallen buiten de v0.1-beta stabilisatiescope en horen eerst in de roadmap/backlog.

## Licentie

De broncode is beschikbaar onder de [MIT License](LICENSE).
