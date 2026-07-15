# ADR-0001 — Modulaire monoliet als startarchitectuur

**Status:** Aanvaard  
**Datum:** 16 juli 2026  
**Beslissers:** Product Owner, CTO / Lead Software Architect

## Context

Trimilix heeft de ambitie om op termijn meer dan 100.000 betalende en 1.000.000 geregistreerde gebruikers te ondersteunen. De huidige productfase vereist echter vooral snelle validatie, correcte financiële dataverwerking, sterke autorisatie en beheersbare operationele kosten. De bestaande applicatie is één full-stack deployment met React, tRPC, Express, Drizzle en MySQL/TiDB.

Een onmiddellijke opsplitsing in microservices zou extra netwerkgrenzen, deploymentcoördinatie, tracing, foutafhandeling en operationeel beheer introduceren zonder dat gemeten belasting dit vandaag vereist.

## Beslissing

Trimilix blijft voorlopig een **modulaire monoliet**. Domeinen zoals identiteit, portefeuilles, marktdata, abonnementen en notificaties krijgen expliciete interne grenzen. Externe providers worden achter adapters geplaatst. Applicatieprocessen blijven stateless waar praktisch mogelijk, terwijl bestanden en persistente data extern worden opgeslagen.

De monoliet mag later per domein worden opgesplitst wanneer objectieve schaal-, beveiligings-, team- of deploymentvereisten dat rechtvaardigen.

## Gevolgen

| Positief | Negatief of aandachtspunt |
|---|---|
| Eenvoudigere deployments en lokale ontwikkeling | Slechte modulegrenzen kunnen alsnog sterke koppeling veroorzaken |
| Typeveilige calls zonder intern netwerk | Eén release kan meerdere domeinen tegelijk beïnvloeden |
| Lagere infrastructuur- en observabilitycomplexiteit | Zware workloads moeten bewust buiten de requestcyclus gehouden worden |
| Snelle refactoring tijdens productvalidatie | Onafhankelijke schaal per domein is nog niet beschikbaar |

## Verworpen alternatieven

**Microservices vanaf de start** zijn verworpen omdat de extra complexiteit niet door huidige gebruikersbelasting, teamgrootte of deploymentbehoeften wordt gerechtvaardigd. **Serverless functies per procedure** zijn niet gekozen omdat dat de domeingrenzen niet automatisch verbetert en providerconnecties, cold starts en debugging kan versnipperen.

## Guardrails

Routers blijven dun, domeinlogica staat in services, datatoegang is expliciet en externe integraties implementeren interne contracten. Nieuwe lokale state die horizontale schaal verhindert is niet toegestaan. Langlopende of herhaalbare taken worden idempotent ontworpen en pas naar een queue/worker verplaatst wanneer de workload dat vereist.

## Herzieningstriggers

Deze beslissing wordt herzien wanneer p95-latency of foutpercentages structureel buiten de SLO vallen door één domein, wanneer marktdata onafhankelijk moet schalen, wanneer deployments door domeinkoppeling risicovol worden, of wanneer achtergrondtaken de requestcyclus merkbaar belasten.

## Exitstrategie

Een domein kan worden afgesplitst door het interne servicecontract als netwerkcontract te implementeren, eigen persistente verantwoordelijkheden te definiëren en verkeer gefaseerd via een adapter te verplaatsen. De bestaande monoliet blijft tijdens de migratie de fallback totdat contracttests en operationele meetpunten slagen.
