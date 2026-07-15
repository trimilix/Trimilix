# ADR 0002 — Provideronafhankelijke marktdata met gefaseerde actualiteit

**Status:** Aanvaard  
**Datum:** 16 juli 2026  
**Beslissers:** Product Owner en CTO

## Context

Trimilix wil in een betaalbare eerste versie end-of-day- of vertraagde ETF-koersen aanbieden en real-timekoersen pas activeren wanneer voldoende betalende gebruikers de volledige data-, beurs- en operationele kost duurzaam dragen. Marktdata-aanbieders verschillen sterk in Europese dekking, actualiteit, technische interfaces, quota en externe weergaverechten. Een directe koppeling van UI of domeinlogica aan één provider zou de migratiekost en contractafhankelijkheid verhogen.

## Beslissing

We introduceren een intern `MarketDataProvider`-contract met genormaliseerde instrumenten, koersen, tijdstempels, valuta, actualiteitsklasse, kwaliteitsstatus en licentiepolicy. Provideradapters blijven server-side. UI, tRPC-routes en portefeuilleberekeningen gebruiken uitsluitend het interne contract.

De MVP start met end-of-day- of vertraagde data na schriftelijke bevestiging van instrumentdekking, externe klantweergave, caching en afgeleide berekeningen. Real-time wordt een afzonderlijke server-side premium-entitlement met een globale feature flag, licentiegate, budgetgate, kill switch en operationele health gate.

Failover is alleen toegelaten wanneer de fallback voor hetzelfde instrument, dezelfde noteringsplaats, valuta, actualiteitsklasse en gebruiksrechten geschikt is. Anders degradeert het product zichtbaar naar vertraagde data of onbeschikbaar.

## Gevolgen

| Positief | Negatief of kost |
|---|---|
| Providers kunnen per capability worden vervangen. | Interne normalisatie en contracttests vragen extra initiële bouwtijd. |
| Licentie- en actualiteitsregels worden centraal afgedwongen. | Symbolmapping per beurs en provider moet onderhouden worden. |
| Batchen en gedeelde caching beperken providerkosten. | Een gedeelde cache wordt bij horizontale schaal een bijkomende operationele component. |
| Premium real-time kan los van betaling en release worden geactiveerd. | Streaming kan later een always-on runtime vereisen. |
| De UI kan altijd bron, timestamp en vertraging correct tonen. | Failover is complexer dan een generieke retry en vereist providerpolicy’s. |

## Afgewezen alternatieven

| Alternatief | Reden van afwijzing |
|---|---|
| Eén providerresponse rechtstreeks aan de UI doorgeven | Vendor lock-in, sleutel- en licentierisico, inconsistente datamodellen. |
| Meteen real-time voor alle gebruikers | Te hoge vaste kost en onzekere beurs- en redistributierechten in de MVP-fase. |
| Eén providercall per gebruiker en instrument | Onnodige quota-, latency- en kostenvermenigvuldiging. |
| Automatische fallback ongeacht actualiteit of beurs | Risico op foutieve waardering en misleidende real-timeclaims. |
| Microservice vóór productvalidatie | Operationele complexiteit zonder gemeten schaalnood. |

## Uitvoeringsbewijs

Het gedetailleerde contract, caching- en failoverbeleid staat in `docs/market-data-architecture.md`. Implementatie vereist afzonderlijke taken, tests, providercredentials en schriftelijk licentiebewijs. Deze ADR op zichzelf activeert geen externe provider.
