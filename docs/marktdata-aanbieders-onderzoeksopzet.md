# Onderzoeksopzet marktdata-aanbieders

## Doel

Vergelijk alternatieven voor Alpha Vantage voor een Belgische ETF-portefeuilleapp die eerst met vertraagde of laatst beschikbare koersen kan starten en later real-time koersen uitsluitend aan betalende gebruikers kan aanbieden.

## Beoordelingscriteria

De vergelijking beoordeelt elke aanbieder op dekking van aandelen en ETF's, met bijzondere aandacht voor Europese beurzen zoals Euronext, Xetra en London Stock Exchange. Verder worden de actualiteit van de koersen, REST- en WebSocket-mogelijkheden, gratis testmogelijkheden, limieten, prijsstructuur, commerciële weergave- en redistributierechten, technische integratie, schaalbaarheid en geschiktheid voor een gefaseerde lancering onderzocht.

## Kandidaten

| Aanbieder | Reden voor opname |
|---|---|
| Finnhub | Bekende marktdata-API met REST en WebSocket en internationale dekking. |
| Twelve Data | Internationale aandelen- en ETF-data met REST en WebSocket. |
| Massive (voorheen Polygon.io) | Sterke real-time infrastructuur en WebSockets; relevant als latere premiumoptie. |
| Marketstack | Eenvoudige REST-API met wereldwijde beursdekking; mogelijk geschikt voor een lichte MVP. |
| EODHD | Brede internationale dekking, inclusief end-of-day en real-time pakketten. |
| Tiingo | Marktdata-API met REST en streamingmogelijkheden en duidelijke abonnementsstructuur. |
| Financial Modeling Prep | Betaalbare marktdata en fundamentals; te toetsen op Europese ETF-dekking en rechten. |
| Alpaca Market Data | Real-time en WebSocket-georiënteerd; te toetsen op bruikbaarheid zonder brokerfunctie en op Europese dekking. |

## Gewenste uitkomst

De eindbeoordeling moet minstens twee haalbare routes naast elkaar zetten: een lichte en goedkope MVP met vertraagde of laatst beschikbare koersen, en een schaalbare premiumroute met real-time updates voor betalende gebruikers. Er wordt nog geen API geïntegreerd zonder een afzonderlijke keuze en bevestiging.
