# Geverifieerde bronnotities marktdata-aanbieders

Deze notities bevatten enkel bevindingen uit officiële aanbiedersbronnen, geraadpleegd op 16 juli 2026.

## Marketstack

De officiële prijspagina vermeldt een gratis laag met 100 aanvragen per maand, end-of-daydata en één jaar historie. Basic kost $9,99 per maand en bevat 10.000 aanvragen, tien jaar historie, commercieel gebruik en IEX-intradaydata voor de Verenigde Staten. Professional kost $49,99 per maand en Business $149,99 per maand; beide vermelden commercieel gebruik en real-time updates. Dezelfde pagina verduidelijkt echter dat intradaydata specifiek voor Amerikaanse tickers is. Daardoor is Europese end-of-daydekking plausibel voor de MVP, maar echte Europese real-timekoersen zijn niet publiek bevestigd. De dienst vermeldt REST; publieke WebSocket-ondersteuning is niet aangetoond.

Bron: https://marketstack.com/pricing

## EODHD

De officiële beurslijst bevestigt historische/global-marketdekking voor Xetra, Euronext Parijs, Brussel, Amsterdam en Lissabon. De commerciële gebruikspagina stelt expliciet dat standaardpakketten voor persoonlijk gebruik zijn en dat commercieel gebruik een afzonderlijke licentie/offerte vereist. De officiële WebSocketpagina biedt real-time streaming met minder dan 50 ms gatewaylatentie voor Amerikaanse aandelen, forex en crypto, met standaard maximaal 50 gelijktijdige symbolen. Voor wereldwijde markten biedt EODHD volgens diezelfde pagina live vertraagde data met circa 15 minuten vertraging. Echte real-time WebSocketdata voor Europese ETF’s is dus niet bevestigd; de sterke kant is wereldwijde EOD en vertraagde data.

Bronnen: https://eodhd.com/list-of-stock-markets ; https://eodhd.com/financial-apis/commercial-vs-personal-license-use ; https://eodhd.com/financial-apis/new-real-time-data-api-websockets

## Twelve Data

De officiële beurslijst bevestigt Euronext Amsterdam, Brussel, Parijs en Lissabon, Xetra en London Stock Exchange, maar markeert deze reguliere beursfeeds als end-of-day. De zakelijke prijspagina vermeldt Venture aan $499 per maand of $414 per maand bij jaarlijkse facturatie, met 2.584 API- en 2.500 WebSocketcredits, externe weergaverechten, real-time Amerikaanse aandelen, real-time EU-marketdata en globale EOD-aandelen en ETF’s. Enterprise kost $1.099 per maand of $916 per maand bij jaarlijkse facturatie en vermeldt externe distributie. De gebruiksvoorwaarden stellen dat Business-plannen commerciële weergave en intern gebruik toelaten onder voorbehoud van beurslicenties; prijsdata buiten de VS vereist bijkomende goedkeuring en redistributie een aparte overeenkomst.

Bronnen: https://twelvedata.com/exchanges ; https://twelvedata.com/pricing-business ; https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage

## Finnhub

De officiële voorwaarden stellen dat alle publiek vermelde plannen voor persoonlijk gebruik zijn tenzij expliciet anders aangegeven. Zakelijk gebruik, zelfs intern, en het delen of redistribueren van data of afgeleide resultaten vereisen schriftelijke toestemming. De technische API heeft REST en WebSocketmogelijkheden, maar commerciële Europese ETF-dekking en prijzen moeten via sales worden bevestigd.

Bron: https://finnhub.io/terms-of-service

## Financial Modeling Prep (FMP)

De officiële prijspagina vermeldt een gratis laag met 250 aanvragen per dag en end-of-daydata; Starter kost $19 per maand, Premium $49 en Ultimate $99. Ultimate vermeldt globale dekking, ETF- en mutual-fundholdings en éénminuutgrafieken. Alle publiek vermelde pakketten zijn echter als individueel gebruik aangeduid. De prijspagina en voorwaarden stellen expliciet dat weergave of redistributie een afzonderlijke Data Display and Licensing Agreement vereist. Zonder zo’n overeenkomst mag de data niet in een website of applicatie voor meerdere gebruikers worden getoond, ongeacht of de toepassing gratis of betalend is. Specifieke real-time Europese beursdekking en streaming via WebSocket zijn niet publiek bevestigd.

Bronnen: https://site.financialmodelingprep.com/pricing-plans ; https://site.financialmodelingprep.com/terms-of-service

## Voorlopige interpretatie

Marketstack is publiek het goedkoopst voor een commerciële MVP met end-of-daydata, maar echte Europese real-timekoersen zijn niet bevestigd en WebSockets ontbreken. EODHD heeft de sterkste publiek bevestigde Europese EOD- en vertraagde dekking, maar vereist een commerciële offerte en biedt publiek enkel echte WebSocket-real-timekoersen voor Amerikaanse aandelen. Twelve Data is de duidelijkste publiek gedocumenteerde route naar real-time EU-data en commerciële externe weergave, maar begint voor dat gebruik op een aanzienlijk hoger prijsniveau en blijft onderworpen aan bijkomende beursgoedkeuringen. Finnhub en FMP kunnen technisch bruikbaar zijn, maar vereisen voorafgaande schriftelijke commerciële licenties en meer salesvalidatie.

## Aanvullende verificaties

Massive bevestigt officieel dat het momenteel enkel Amerikaanse markten ondersteunt. Daardoor valt het af voor een Europese ETF-portefeuille, ondanks de sterke real-time infrastructuur.

Bron: https://massive.com/knowledge-base/article/does-massive-offer-international-data

Tiingo vermeldt op zijn publieke prijspagina wel meer dan 108.000 wereldwijde effecten en bijna 60.000 ETF’s en mutual funds, maar de publieke Starter- en Power-licenties zijn uitdrukkelijk beperkt tot intern gebruik. Externe klantweergave vergt dus een afzonderlijke commerciële overeenkomst, terwijl de precieze Europese beurs- en real-timekwaliteit publiek onvoldoende is gespecificeerd.

Bron: https://www.tiingo.com/pricing

Alpaca bevestigt expliciet dat Alpaca-API-data niet via een eigen platform mag worden herverdeeld. Zonder een afzonderlijk partner- of brokercontract is dit daarom niet geschikt voor koersen in een commerciële klantapp.

Bron: https://alpaca.markets/support/redistribute-alpaca-api

Finnhub vermeldt op zijn prijspagina een gratis laag en een persoonlijk pakket van $3.500 per maand met internationale marktdata voor onder meer LSE, Euronext en Deutsche Börse, plus WebSocketdekking. De voorwaarden blijven echter duidelijk: zakelijk gebruik en delen met derden vereisen schriftelijke toestemming. Daardoor is Finnhub technisch sterk, maar financieel en juridisch ongeschikt als vroege MVP-route zonder maatwerkofferte.

Bronnen: https://finnhub.io/pricing ; https://finnhub.io/terms-of-service

Marketstacks publieke prijspagina vermeldt wel ‘Commercial Use’ vanaf Basic, maar de publiek gevonden juridische overzichtspagina specificeert geen ondubbelzinnige rechten om ruwe koersen extern aan eindgebruikers te tonen of te redistribueren. Voor implementatie moet daarom schriftelijk worden bevestigd dat de geplande klantweergave en afgeleide portefeuilleberekeningen onder het gekozen pakket vallen.

Bronnen: https://marketstack.com/pricing ; https://www.ideracorp.com/legal/APILayer

EODHD bevestigt in de voorwaarden dat professionele gebruikers voorafgaande schriftelijke toestemming moeten aanvragen om data te tonen of te redistribueren. De voorwaarden waarschuwen bovendien dat beurs-, ETF- en andere prijzen indicatief kunnen zijn en niet noodzakelijk real-time of geschikt voor handelsdoeleinden. Dit past beter bij portefeuille-informatie dan bij een handelsplatform, maar vereist heldere disclaimers en een commerciële licentie.

Bronnen: https://eodhd.com/financial-apis/commercial-vs-personal-license-use ; https://eodhd.com/financial-apis/terms-conditions
