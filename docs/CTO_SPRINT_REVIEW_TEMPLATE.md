# CTO-sprintevaluatie — sjabloon

**Project:** The Trimilix System™  
**Sprint/periode:** `[YYYY-MM-DD — YYYY-MM-DD]`  
**Rapportdatum:** `[YYYY-MM-DD]`  
**Auteur:** `[naam/rol]`  
**Beslisser:** Business Owner / CTO  
**Releasekandidaat of checkpoint:** `[versie-ID]`

> Dit rapport maakt strikt onderscheid tussen **geïmplementeerd en bewezen**, **geïmplementeerd maar nog niet operationeel bewezen**, en **gepland**.

## 1. Managementsamenvatting

Beschrijf in volledige paragrafen wat de sprint opleverde, welke gebruikers- of bedrijfswaarde werd bereikt, wat nog blokkeert en welke beslissingen van de Business Owner of CTO nodig zijn.

| Dimensie | Status | Korte toelichting |
|---|---|---|
| Scope | Groen / Oranje / Rood | `[toelichting]` |
| Security | Groen / Oranje / Rood | `[toelichting]` |
| Betrouwbaarheid | Groen / Oranje / Rood | `[toelichting]` |
| Performance | Groen / Oranje / Rood | `[toelichting]` |
| Kosten | Groen / Oranje / Rood | `[toelichting]` |
| Releasegereedheid | Groen / Oranje / Rood | `[toelichting]` |

## 2. Opgeleverde veranderingen

| Verandering | Gebruikers- of bedrijfswaarde | Bewijs | Status |
|---|---|---|---|
| `[verandering]` | `[waarde]` | Test, document, metric, screenshot of checkpoint | Bewezen / Onbewezen / Gepland |

## 3. Architectuur en ADR’s

Beschrijf elke nieuwe of gewijzigde architectuurbeslissing, de alternatieven die zijn overwogen en waarom de keuze omkeerbaar of proportioneel is.

| ADR | Beslissing | Gevolg | Reviewmoment |
|---|---|---|---|
| `[pad/nummer]` | `[beslissing]` | `[positief en negatief]` | `[datum/trigger]` |

## 4. Securityreview

| Controle | Resultaat | Bewijs | Resterend risico | Eigenaar/deadline |
|---|---|---|---|---|
| Authenticatie en sessies | `[resultaat]` | `[test/log]` | `[risico]` | `[eigenaar/datum]` |
| Autorisatie en eigenaarschap | `[resultaat]` | `[test/log]` | `[risico]` | `[eigenaar/datum]` |
| Inputvalidatie | `[resultaat]` | `[test]` | `[risico]` | `[eigenaar/datum]` |
| Secrets | `[resultaat]` | Secretscan | `[risico]` | `[eigenaar/datum]` |
| Dependencies | `[resultaat]` | OSV/audit | `[risico]` | `[eigenaar/datum]` |
| Headers, CORS en rate limiting | `[resultaat]` | Configuratietest | `[risico]` | `[eigenaar/datum]` |
| Privacy en logging | `[resultaat]` | Logreview | `[risico]` | `[eigenaar/datum]` |
| Misbruik en kostenbeheersing | `[resultaat]` | Quota-/budgetcontrole | `[risico]` | `[eigenaar/datum]` |

Nieuwe kritieke of hoge bevindingen krijgen een afzonderlijke taak. Een risicobehandeling vermeldt expliciet of het risico wordt opgelost, beperkt, overgedragen of tijdelijk aanvaard.

## 5. Test- en kwaliteitsrapport

| Kwaliteitsgate | Opdracht of methode | Resultaat | Trend |
|---|---|---|---|
| Typecheck | `pnpm check` | `[resultaat]` | Beter / Gelijk / Slechter |
| Unit- en regressietests | `pnpm test` | `[aantal/resultaat]` | `[trend]` |
| Secretscan | `pnpm scan:secrets` | `[resultaat]` | `[trend]` |
| Productiedependencyaudit | `pnpm audit:prod` | `[resultaat]` | `[trend]` |
| Productiebuild | `pnpm build` | `[resultaat]` | `[trend]` |
| Kritieke browserflows | Browser/screenshot | `[resultaat]` | `[trend]` |
| Toegankelijkheid | Handmatig en automatisch | `[resultaat]` | `[trend]` |

Registreer ontbrekende testcategorieën en leg uit welk productrisico daardoor onbewezen blijft.

## 6. Performance en schaalbaarheid

| Metriek | Huidige waarde | Vorige waarde | Doel | Besluit |
|---|---:|---:|---:|---|
| Frontendbundle | `[waarde]` | `[waarde]` | `[doel]` | `[actie]` |
| API-latency p95 | `[waarde]` | `[waarde]` | `[doel]` | `[actie]` |
| Databasequery p95 | `[waarde]` | `[waarde]` | `[doel]` | `[actie]` |
| Foutpercentage | `[waarde]` | `[waarde]` | `[doel]` | `[actie]` |
| Cache-hitratio | `[waarde]` | `[waarde]` | `[doel]` | `[actie]` |
| Gelijktijdige gebruikers | `[waarde]` | `[waarde]` | `[doel]` | `[actie]` |

Vermeld welke schaalmaatregel pas wordt ingevoerd nadat metrics een echte bottleneck aantonen.

## 7. Monitoring en operationele gereedheid

| SLI of controle | Geïnstrumenteerd | Dashboard | Alarm | Runbook | Status |
|---|---|---|---|---|---|
| Uptime | Ja/Nee | Ja/Nee | Ja/Nee | `[pad]` | `[status]` |
| API-latency en fouten | Ja/Nee | Ja/Nee | Ja/Nee | `[pad]` | `[status]` |
| Server- en databasebelasting | Ja/Nee | Ja/Nee | Ja/Nee | `[pad]` | `[status]` |
| Providerverbruik en kosten | Ja/Nee | Ja/Nee | Ja/Nee | `[pad]` | `[status]` |
| Cache-efficiëntie | Ja/Nee | Ja/Nee | Ja/Nee | `[pad]` | `[status]` |
| Betaalwebhooks en entitlements | Ja/Nee | Ja/Nee | Ja/Nee | `[pad]` | `[status]` |

## 8. Kosten en unit economics

| Kostencategorie | Huidige kost | Forecast | Drempel | Actie |
|---|---:|---:|---:|---|
| Hosting | `[bedrag]` | `[bedrag]` | `[bedrag]` | `[actie]` |
| Database | `[bedrag]` | `[bedrag]` | `[bedrag]` | `[actie]` |
| Opslag | `[bedrag]` | `[bedrag]` | `[bedrag]` | `[actie]` |
| Marktdata/API’s | `[bedrag]` | `[bedrag]` | `[bedrag]` | `[actie]` |
| Betalingen | `[bedrag]` | `[bedrag]` | `[bedrag]` | `[actie]` |

Noteer aannames en ontbrekende contractinformatie. Real-timefunctionaliteit wordt niet geactiveerd zonder positief unit-economicsmodel, licentiebewijs en operationele gates.

## 9. Technische schuld

| Item | Impact | Kans | Prioriteit | Voorgestelde maatregel | Eigenaar/deadline |
|---|---|---|---|---|---|
| `[schuld]` | Hoog/Midden/Laag | Hoog/Midden/Laag | P0–P3 | `[actie]` | `[eigenaar/datum]` |

Technische schuld krijgt een meetbaar acceptatiecriterium. Vage items zoals “performance verbeteren” worden vervangen door concrete grenzen en bewijs.

## 10. Back-up, herstel en continuïteit

| Controle | Laatste uitvoering | Resultaat | Volgende datum | Bewijs |
|---|---|---|---|---|
| Projectcheckpoint | `[datum]` | `[resultaat]` | `[datum]` | `[versie-ID]` |
| Databaseback-upstatus | `[datum]` | `[resultaat]` | `[datum]` | `[bewijs]` |
| Geïsoleerde database-restore | `[datum]` | `[resultaat]` | `[datum]` | `[verslag]` |
| Objectrestore | `[datum]` | `[resultaat]` | `[datum]` | `[verslag]` |
| Secretherstel/rotatie | `[datum]` | `[resultaat]` | `[datum]` | `[verslag]` |

## 11. Incidenten en bijna-incidenten

| Incident | Impact | Oorzaak | Detectie | Herstel | Preventieve actie |
|---|---|---|---|---|---|
| `[incident]` | `[impact]` | `[oorzaak]` | `[detectie]` | `[herstel]` | `[actie]` |

Voor SEV-1 en SEV-2 is een afzonderlijke postmortem vereist zonder schuldtoewijzing aan personen.

## 12. Beslissingen en volgende sprint

| Beslissing of actie | Reden | Eigenaar | Deadline | Acceptatiecriterium |
|---|---|---|---|---|
| `[actie]` | `[reden]` | `[eigenaar]` | `[datum]` | `[criterium]` |

Sluit af met de topprioriteiten in volgorde, de expliciet uitgestelde zaken en de voorwaarden om naar productie of de volgende schaalfase te gaan.
