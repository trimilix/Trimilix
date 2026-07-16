# Fase A finale visuele smoke — 2026-07-16

## Desktop

De home-/authweergave rendert op de schone runtime volledig binnen één viewport. Het primaire Trimilix-logo, de propositie, de CTA en de educatieve disclaimer zijn zichtbaar; er zijn geen zichtbare asset-, contrast-, overlap- of routefouten waargenomen.

De publieke `/etf-check` lazy route rendert op desktop met titel, zoekveld, zoekactie en expliciete lege toestand. De ongeauthenticeerde preview retourneerde nul ETF-resultaten en toonde daarom zowel “Geen ETF's gevonden” als de database-lege toestand. Dit is een datatoestands-/previewbeperking, geen zichtbare lazy-loading- of cursorlayoutfout.

Screenshots zijn intern vastgelegd in de runtimebrowser. De afgeschermde portfolioflow wordt afzonderlijk gecontroleerd; zonder geldige gebruikerssessie kan alleen het authenticatiegedrag worden bewezen.

## Mobiel — eerste capture

Op 390×844 blijft de homepropositie, CTA en disclaimer leesbaar, gecentreerd en zonder horizontale overflow. Het logo was in de onmiddellijke headless capture nog niet zichtbaar, terwijl het op desktop correct laadde; dit wordt daarom als capture-/assettiming-onbeslist behandeld en vertraagd herhaald.

De onmiddellijke mobiele ETF-capture toonde de toegankelijke `Suspense`-fallback “Pagina laden…”. Dat bewijst dat de fallback rendert, maar nog niet dat de uiteindelijke mobiele route-layout correct is. Een vertraagde recapture is verplicht voordat de mobiele controle kan slagen.

## Mobiel — vertraagde eindtoestand

Met vijf seconden virtuele laadtijd rendert de homeweergave compleet: logo, propositie, CTA en disclaimer passen binnen 390×844, hebben geldige tekstomloop en veroorzaken geen horizontale overflow. De eerdere ontbrekende logo-observatie was daarmee uitsluitend capturetiming.

De ETF Checker verlaat de `Suspense`-fallback en toont de volledige route op 390×844. Zoekveld en actie blijven naast elkaar bruikbaar, de resultaten- en database-lege kaarten stapelen verticaal en alle teksten blijven leesbaar zonder horizontale overflow. De eerdere fallback-observatie was eveneens capturetiming, geen lazy-routefout.

## Mobiel — afgeschermde Portfolio Checker

De eerste ongeauthenticeerde capture toonde ten onrechte de portefeuille-empty-state doordat de query correct was uitgeschakeld maar de authloading/-grens niet vóór de datatoestand werd gerenderd. Dit is hersteld met een expliciete login-grens. De vertraagde recapture toont op 390×844 uitsluitend “Inloggen vereist”, een duidelijke toelichting en een user-triggered “Inloggen of registreren”-actie; er lekt geen beschermde portefeuille-inhoud en er is geen horizontale overflow.

Na de fix retourneerden `/healthz` en warme `/readyz` opnieuw HTTP 200 met respectievelijk `{"status":"ok"}` en `{"status":"ready","checks":{"database":"up"}}`; beide responses bevatten een unieke `x-request-id`.

## Definitieve Compounding Simulator-smoke na frontendbewijsfix

Op 16 juli 2026 is `/compounding-simulator` opnieuw geladen tegen de schone eindruntime. De standaardscenario-uitvoer rendert volledig: instellingen, grafiek, totale inleg (€ 190.000), berekende groei (€ 501.150), eindvermogen (€ 691.150) en beide aannamesblokken zijn zichtbaar, leesbaar en zonder horizontale overflow of contrastfout. De nieuwe fail-safe berekeningsfoutgrens verandert de normale formule-uitkomst niet en wordt alleen gebruikt wanneer de gedeelde financiële kern een onveilige invoer of output weigert. Bewijsscreenshot: `/home/ubuntu/screenshots/3000-i68duzr3aln9zdk_2026-07-16_12-22-55_5706.webp`.
