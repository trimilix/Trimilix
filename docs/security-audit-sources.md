# Security-auditbronnen

Laatst gecontroleerd: 16 juli 2026.

## OSV-dependencyaudit

De ingebouwde `pnpm audit`-route faalde doordat het oudere npm-auditendpoint `/-/npm/v1/security/audits` met HTTP 410 werd uitgefaseerd. Daarom gebruikt dit project een eigen read-only controle tegen de officiële OSV API.

Officiële bronnen:

- OSV API-overzicht: https://google.github.io/osv.dev/api/
- OSV batchquerydocumentatie: https://google.github.io/osv.dev/post-v1-querybatch/
- Batchendpoint: `POST https://api.osv.dev/v1/querybatch`

Volgens de officiële documentatie aanvaardt `querybatch` meerdere package- en versiecombinaties, garandeert de respons dezelfde volgorde als de input en retourneert per package de gevonden kwetsbaarheids-ID’s. OSV vermeldt momenteel geen API-ratelimiet. Het projectscript `scripts/audit-dependencies.mjs` leest uitsluitend de lokaal geïnstalleerde productiepackages via `pnpm list`, verstuurt package- en versiegegevens in batches en faalt gesloten als OSV niet betrouwbaar antwoordt of kwetsbaarheden rapporteert.
