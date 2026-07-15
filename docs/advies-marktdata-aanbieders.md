# Advies marktdata-aanbieders voor de ETF-portefeuilleapp

**Datum:** 16 juli 2026  
**Auteur:** Manus AI

## Managementsamenvatting

Voor uw geplande aanpak — eerst een betaalbare versie lanceren en pas later real-time koersen aanbieden wanneer er voldoende betalende gebruikers zijn — is **één aanbieder voor alle fases niet noodzakelijk de beste keuze**. De goedkoopste aanbieders hebben doorgaans geen duidelijk gedocumenteerde real-time Europese ETF-feed, terwijl aanbieders met commerciële EU-realtimekoersen en streaming meteen een aanzienlijk zakelijk abonnement vragen.

> **Aanbeveling:** bouw de eerste versie provider-onafhankelijk en lanceer met end-of-day- of vertraagde koersen. Onderzoek eerst **Marketstack** als budgetvriendelijke MVP-optie en **EODHD** als alternatief met sterker bevestigde Europese beursdekking. Activeer later **Twelve Data** als premiumprovider zodra de abonnementen de vaste datakost, eventuele beurskosten en een veilige marge kunnen dragen.

| Fase | Voorgestelde route | Waarom |
|---|---|---|
| MVP | Marketstack na schriftelijke licentie- en symboolbevestiging | Lage instapkost en commercieel gebruik vermeld vanaf Basic, maar Europese ETF-dekking en externe klantweergave moeten voor uw concrete gebruik bevestigd worden. |
| MVP-alternatief | EODHD met commerciële offerte | Sterk publiek bevestigde dekking van Xetra en meerdere Euronext-beurzen; geschikt voor EOD en circa 15 minuten vertraagde wereldwijde data. |
| Premiumfase | Twelve Data Business, waarschijnlijk Venture of hoger | Duidelijkste publiek gedocumenteerde route naar EU-realtimekoersen, WebSockets en externe weergaverechten. |
| Niet aanbevolen als primaire route | Finnhub, FMP, Tiingo, Alpaca en Massive | Te duur, licentie te beperkt of onduidelijk, redistributie niet toegestaan, of geen Europese dekking. |

## Onderzoeksaanpak

Acht alternatieven voor Alpha Vantage zijn vergeleken op vijf criteria: **Europese ETF- en beursdekking (25%)**, **duidelijkheid van commerciële klantweergaverechten (25%)**, **toegankelijkheid van de MVP-kost (20%)**, **een realistisch groeipad naar Europese real-timekoersen (20%)** en **streaming/WebSocket-ondersteuning (10%)**. Scores lopen van 1 tot 5 en dienen als beslissingsondersteuning; ze vervangen nooit een bindende licentiebevestiging van de leverancier.

![Gewogen vergelijking van marktdata-aanbieders](https://files.manuscdn.com/user_upload_by_module/session_file/310519663834810733/PDbHwWROBSeLxdFN.png)

| Rang | Aanbieder | Gewogen score | Meest geschikte rol |
|---:|---|---:|---|
| 1 | Twelve Data | 4,05/5 | Premiumroute naar real-time EU-koersen |
| 2 | EODHD | 3,18/5 | Europese EOD- en vertraagde data met commerciële offerte |
| 3 | Marketstack | 3,15/5 | Goedkope EOD-MVP na schriftelijke bevestiging |
| 4 | Finnhub | 2,88/5 | Technisch sterk, maar duur en licentie op maat |
| 5 | Tiingo | 2,33/5 | Brede globale dataset, publieke plannen enkel intern gebruik |
| 6 | Financial Modeling Prep | 2,12/5 | Analyse en fundamentals; aparte displaylicentie nodig |
| 7 | Alpaca Market Data | 1,93/5 | Niet geschikt voor gewone redistributie |
| 8 | Massive | 1,85/5 | Valt af wegens uitsluitend Amerikaanse marktdekking |

## Vergelijking van de belangrijkste kandidaten

### Twelve Data: beste premiumroute

Twelve Data bevestigt dekking van onder meer **Euronext Amsterdam, Brussel, Parijs en Lissabon, Xetra en London Stock Exchange**. De publieke beurslijst markeert veel van die reguliere feeds wel als end-of-day. De zakelijke prijspagina vermeldt vanaf het Venture-plan externe weergaverechten, real-time EU-marketdata, globale ETF-data en zowel API- als WebSocketcapaciteit. Venture kost publiek $499 per maand bij maandelijkse facturatie of $414 per maand bij jaarlijkse facturatie.[1] [2]

| Sterkte | Beperking |
|---|---|
| Duidelijkste technische route naar Europese real-timekoersen en streaming. | Hoge vaste kost voor een vroege MVP. |
| Zakelijke plannen vermelden externe weergaverechten. | Europese beursdata kan bijkomende goedkeuringen en kosten vereisen. |
| Goede kandidaat voor een betalende premiumlaag. | Redistributie buiten de overeengekomen app kan een aparte overeenkomst vereisen. |

De gebruiksvoorwaarden verduidelijken dat Business-plannen commerciële weergave en intern gebruik toelaten, maar dat prijsdata buiten de Verenigde Staten onderworpen kan zijn aan bijkomende beursgoedkeuringen. Redistributie aan derden kan bovendien een aparte overeenkomst vereisen.[3] Daardoor is Twelve Data **de beste doelprovider voor fase twee**, maar niet noodzakelijk de voordeligste startprovider.

### EODHD: sterkste Europese MVP-alternatief

EODHD bevestigt publiek dekking voor **Xetra en Euronext Parijs, Brussel, Amsterdam en Lissabon**.[4] De officiële WebSocketpagina vermeldt real-time streaming voor Amerikaanse aandelen, forex en crypto, terwijl wereldwijde markten volgens diezelfde bron met ongeveer 15 minuten vertraging worden aangeboden.[5]

| Sterkte | Beperking |
|---|---|
| Sterk bevestigde Europese beursdekking. | Geen publiek bevestigde echte real-time WebSocketfeed voor Europese ETF’s. |
| Geschikt voor EOD en vertraagde koersinformatie. | Publieke standaardpakketten zijn voor persoonlijk gebruik. |
| Commerciële onboarding kan volgens EODHD snel gebeuren. | Klantweergave of redistributie vereist voorafgaande schriftelijke toestemming. |

EODHD stelt uitdrukkelijk dat de publieke prijspakketten voor persoonlijk gebruik zijn en dat commerciële toepassingen een aparte licentie/offerte nodig hebben. De voorwaarden vereisen voorafgaande schriftelijke goedkeuring om data in een herverpakte vorm te tonen of te redistribueren.[6] [7] EODHD is daarom een **sterke inhoudelijke kandidaat voor de MVP**, op voorwaarde dat de commerciële offerte haalbaar is.

### Marketstack: goedkoopste mogelijke MVP-route

Marketstack vermeldt een gratis laag met end-of-daydata en een Basic-plan van $9,99 per maand met commercieel gebruik, 10.000 aanvragen en Amerikaanse IEX-intradaydata. Hogere plannen vermelden real-time updates, maar de prijspagina verduidelijkt dat intradaydata specifiek op Amerikaanse tickers gericht is.[8]

| Sterkte | Beperking |
|---|---|
| Zeer lage publieke instapkost. | Echte real-time Europese ETF-koersen zijn niet bevestigd. |
| End-of-daydata past bij een eerste portefeuilleversie. | Publieke WebSocketondersteuning is niet aangetoond. |
| Commercieel gebruik staat vanaf Basic vermeld. | Externe klantweergave en de vereiste Europese ETF-symbolen moeten schriftelijk bevestigd worden. |

Marketstack is dus **de eerste partij die ik voor een goedkope MVP zou aanschrijven**, maar enkel met een duidelijke lijst van gewenste ISIN’s, beurzen en gebruiksvormen. Zonder schriftelijke bevestiging zou ik niet aannemen dat “commercial use” automatisch alle externe display- of redistributierechten omvat.

## Waarom de andere aanbieders afvallen

Finnhub biedt technisch sterke internationale marktdata, met onder meer Euronext, Deutsche Börse en LSE en WebSocketmogelijkheden. De publieke prijspagina vermeldt echter een persoonlijk pakket van $3.500 per maand, terwijl de voorwaarden zakelijk gebruik en delen met derden enkel met schriftelijke toestemming toelaten.[9] [10]

| Aanbieder | Reden om niet als primaire route te kiezen |
|---|---|
| Finnhub | Technisch sterk, maar zeer hoge publieke kost en commerciële licentie op maat. |
| Financial Modeling Prep | Publieke plannen zijn voor individueel gebruik; klantweergave vereist een afzonderlijke Data Display and Licensing Agreement.[11] [12] |
| Tiingo | Meer dan 108.000 globale effecten en bijna 60.000 ETF’s/fondsen, maar de publieke API-plannen zijn enkel voor intern gebruik.[13] |
| Alpaca Market Data | Alpaca stelt expliciet dat API-data niet via een eigen platform mag worden herverdeeld.[14] |
| Massive | Ondersteunt volgens de officiële kennisbank momenteel enkel Amerikaanse markten.[15] |

Deze aanbieders kunnen later opnieuw worden bekeken wanneer er een specifieke businesscase, onderhandelingsmacht of brokerintegratie bestaat. Voor de huidige gefaseerde strategie leveren ze echter te veel licentie-, dekkings- of kostrisico op.

## Aanbevolen product- en architectuurstrategie

De toepassing mag niet rechtstreeks rond één leveranciersformaat worden gebouwd. Een interne `MarketDataProvider`-laag moet symbolen, koersen, tijdstempels, valuta, vertraging en datastatus normaliseren. Daardoor kan de MVP starten met één leverancier en kan later een tweede provider voor premiumgebruikers worden toegevoegd zonder de volledige applicatie te herschrijven.

| Onderdeel | MVP-gedrag | Premiumgedrag |
|---|---|---|
| Koersfrequentie | Vorige slotkoers of circa 15 minuten vertraagd | Real-time of quasi-real-time volgens beurslicentie |
| Dataprovider | Marketstack of EODHD | Twelve Data Business |
| Transport | Periodieke server-side API-ophaling en caching | Eén server-side WebSocketverbinding, daarna gecontroleerde distributie naar geautoriseerde betalende gebruikers |
| Interface | Duidelijk label “slotkoers” of “15 min vertraagd” met tijdstempel | Label “real-time” uitsluitend wanneer contractueel en technisch correct |
| Toegang | Alle gebruikers of onderdeel van de basisversie | Feature flag gekoppeld aan actieve betaling en abonnementstype |
| Kostenbeheersing | Gecachte koers per symbool, niet per gebruiker opvragen | Symbolen bundelen, verbindingen delen en limieten centraal bewaken |

Het is belangrijk dat de browser **nooit rechtstreeks de sleutel van de marktdata-aanbieder ontvangt**. Alle aanvragen horen via de server te lopen, met caching, rate limiting, logging en een kill switch. Een betaling mag bovendien niet automatisch betekenen dat real-timekoersen beschikbaar zijn: de functie moet afzonderlijk activeerbaar blijven via een feature flag, zodat ze pas live gaat wanneer ook de marktdata- en beurslicenties in orde zijn.

## Financiële activeringsdrempel

Voor Twelve Data Venture bedraagt de publiek vermelde kost ongeveer $499 per maand bij maandelijkse facturatie, vóór mogelijke bijkomende beurs- of licentiekosten.[1] Gebruik daarom geen drempel die enkel de API-factuur dekt. Een gezonde interne regel is dat de **maandelijkse brutomarge van de premiumgebruikers minstens twee tot drie keer de volledige maandelijkse datakost** bedraagt voordat real-timekoersen worden geactiveerd.

| Voorbeeld | Formule |
|---|---|
| Volledige maandelijkse datakost | Providerabonnement + beurskosten + wisselkoersbuffer + operationele marge |
| Beschikbare brutomarge per premiumgebruiker | Verkoopprijs exclusief btw − betaalproviderkost − andere variabele kosten |
| Minimale gebruikersdrempel | `(2 × volledige datakost) / brutomarge per gebruiker`, naar boven afgerond |
| Voorzichtige drempel | Gebruik factor 3 in plaats van 2 wanneer de gebruikersbasis nog volatiel is. |

Deze drempel is een bedrijfsregel, geen marktvoorspelling. Ze voorkomt dat u een dure, gereglementeerde feed activeert op basis van enkele vroege abonnementen die de kost slechts nipt dekken.

## Te vragen bevestigingen vóór een contract

Stuur aan Marketstack, EODHD en Twelve Data exact dezelfde korte vragenlijst. Vraag eerst bevestiging van de gewenste **ISIN’s en noteringsplaatsen**, omdat een leverancier een beurs kan ondersteunen zonder elk ETF-instrument correct te dekken.

| Vraag | Waarom ze essentieel is |
|---|---|
| Ondersteunt u deze concrete ETF-ISIN’s op Xetra en de relevante Euronext-beurzen? | Vermijdt verrassingen na integratie. |
| Mogen koersen zichtbaar zijn voor ingelogde gratis en betalende eindgebruikers? | Bevestigt externe klantweergave. |
| Mogen afgeleide waarden zoals portefeuillewaarde, rendement en allocatie getoond worden? | Onderscheidt ruwe data van afgeleide data. |
| Hoe lang mogen koersen en historische resultaten gecachet of opgeslagen worden? | Bepaalt architectuur en databankbeleid. |
| Welke extra beurs-, professional-user- of redistributiekosten gelden? | Voorkomt verborgen vaste kosten. |
| Wat betekent “real-time” per beurs en instrument, en welke tijdstempel wordt geleverd? | Verzekert correct productlabel. |
| Mag één server-side WebSocketfeed naar geautoriseerde appgebruikers worden doorgegeven? | Bevestigt de geplande premiumarchitectuur. |
| Welke voorwaarden gelden na beëindiging van het contract? | Bepaalt of opgeslagen koersdata verwijderd moet worden. |

## Definitief besluit

**Twelve Data** komt als beste technische en commerciële premiumroute uit de vergelijking, maar is te duur om zonder betalende tractie als startpunt te nemen. **Marketstack** is de meest interessante budgetkandidaat voor een eerste end-of-dayversie, mits schriftelijke bevestiging van de gewenste Europese ETF’s en klantweergaverechten. **EODHD** is het sterkste alternatief wanneer Europese dekking belangrijker is dan de laagste publieke prijs en er een haalbare commerciële offerte kan worden verkregen.

> Bouw nu dus een provider-onafhankelijke MVP met duidelijk vertraagde of end-of-daykoersen. Maak real-timekoersen technisch én commercieel een afzonderlijke premiumfeature. Zo houdt u de startkost laag zonder later in een dure herbouw vast te lopen.

## Referenties

[1]: https://twelvedata.com/pricing-business "Twelve Data — Business Pricing"
[2]: https://twelvedata.com/exchanges "Twelve Data — Supported Exchanges"
[3]: https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage "Twelve Data — Commercial and Personal Usage"
[4]: https://eodhd.com/list-of-stock-markets "EODHD — List of Supported Stock Markets"
[5]: https://eodhd.com/financial-apis/new-real-time-data-api-websockets "EODHD — Real-Time Data API and WebSockets"
[6]: https://eodhd.com/financial-apis/commercial-vs-personal-license-use "EODHD — Commercial vs Personal License Use"
[7]: https://eodhd.com/financial-apis/terms-conditions "EODHD — Terms and Conditions"
[8]: https://marketstack.com/pricing "Marketstack — Pricing"
[9]: https://finnhub.io/pricing "Finnhub — Pricing"
[10]: https://finnhub.io/terms-of-service "Finnhub — Terms of Service"
[11]: https://site.financialmodelingprep.com/pricing-plans "Financial Modeling Prep — Pricing Plans"
[12]: https://site.financialmodelingprep.com/terms-of-service "Financial Modeling Prep — Terms of Service"
[13]: https://www.tiingo.com/pricing "Tiingo — Pricing"
[14]: https://alpaca.markets/support/redistribute-alpaca-api "Alpaca — Redistribution of API Data"
[15]: https://massive.com/knowledge-base/article/does-massive-offer-international-data "Massive — International Data Coverage"
