# Fase A — Financiële visuele verificatie

**Datum:** 16 juli 2026  
**Viewport:** 1440 × 1000, volledige pagina

| Route | Resultaat | Bevinding |
|---|---|---|
| `/compounding-simulator` | Geslaagd | Instellingen, grafiekcontainer, totaalinleg, berekende groei, eindvermogen en beide methodiekmeldingen renderen. Standaardcase toont €190.000 inleg, €501.150 berekende groei en €691.150 eindvermogen. Een ontbrekende spatie tussen het dynamische maandbedrag en “wordt” is direct hersteld. Recharts-lijnen zijn in de bevroren full-page capture niet betrouwbaar te beoordelen door animatiefreezing; numerieke output is via de domeintests bewezen. |
| `/portfolio-checker` | Geslaagd voor actuele lege status | De ingelogde previewgebruiker heeft geen portefeuille. De pagina toont een duidelijke lege status zonder gefabriceerde analyse of voorbeelddata. De complete en onvolledige risicocontracten zijn daarom server-side via regressietests geverifieerd in plaats van met ingevoerde productiedata. |

De visuele controle introduceerde geen nieuwe functionaliteit en er is geen test- of voorbeeldportefeuille in de projectdatabase geplaatst.

## Mobiele controle

**Viewport:** 390 × 844, volledige pagina

De simulator stapelt instellingen, grafiek, drie uitkomstkaarten en methodiekmeldingen correct. De grafieklijnen zijn mobiel zichtbaar, labels blijven bruikbaar en de herstelde zin toont nu correct “€ 500 wordt”. De Portfolio Checker toont de lege status zonder horizontale overflow. Er zijn geen visuele releaseblokkers voor deze financiële integratie vastgesteld.
