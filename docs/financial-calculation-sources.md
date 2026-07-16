# Financial calculation source notes

**Vastgelegd:** 16 juli 2026

## Samengestelde interest

OpenStax, *Contemporary Mathematics*, §6.4 beschrijft samengestelde interest als interest die na iedere periode aan het saldo wordt toegevoegd, waarna volgende interest over hoofdsom plus eerder toegevoegde interest wordt berekend. De bron geeft de toekomstwaardebenadering `A = P(1 + r/n)^(nt)` en een maandelijkse voorbeeldcase van USD 5.000 tegen 3,8% gedurende vijf jaar met uitkomst USD 6.044,43.

Bron: https://openstax.org/books/contemporary-mathematics/pages/6-4-compound-interest

## Einde-periode-inleg / ordinary annuity

OpenStax, *Principles of Finance*, §8.2 definieert een ordinary annuity als een vaste periodieke betaling aan het einde van iedere periode. In het voorbeeld wordt eerst interest over het bestaande saldo berekend en pas aan het einde van de periode de volgende inleg toegevoegd; de laatste betaling verdient in die periode geen interest. De tekst waarschuwt bovendien dat vroegtijdige afronding bij grotere looptijden en bedragen materiële verschillen kan veroorzaken.

Bron: https://openstax.org/books/principles-finance/pages/8-2-annuities

OpenStax, *Principles of Managerial Accounting*, §11.3 bevestigt dat een annuïteit een reeks gelijke kasstromen op gelijke intervallen is, dat compounding interest op eerdere interest betekent, en dat spreadsheet-/financiële formules `Type = 0` gebruiken voor een reguliere annuïteit en `Type = 1` voor een annuity due.

Bron: https://openstax.org/books/principles-managerial-accounting/pages/11-3-explain-the-time-value-of-money-and-calculate-present-and-future-values-of-lump-sums-and-annuities

## Waardegewogen aggregatie

S&P Global, *Principles of Portfolio Analytics — Aggregation & Exposure*, beschrijft portefeuilleweging als uitstaande waarde gedeeld door totale portefeuillewaarde en een portefeuille-impact als de som van gewicht maal individuele impact. De publieke PDF-extractie was onvolledig; deze bron wordt alleen gebruikt als motivatie voor de algemene gewogen-aggregatiestructuur, niet als validatie van Trimilix' eigen educatieve 1–5-risicoschaal.

Bron: https://portal.s1.spglobal.com/survey/documents/SPG_S1_Principles_PA_Aggregation_Exposure.pdf

## Bronbeperking risicoschaal

De huidige Trimilix-seed bevat handmatig toegekende scores 2, 4 en 5 voor vijf ETF's, maar er is nog geen extern gevalideerde methodiek die deze productspecifieke 1–5-scores onderbouwt. Daarom mag de rekenkern alleen geldige aanwezige scores aggregeren, ontbrekende of ongeldige waarden fail-closed behandelen en de score uitdrukkelijk als een educatieve Trimilix-indicator presenteren. Het valideren van individuele seed-scores blijft afzonderlijke productschuld en mag niet stilzwijgend door de aggregatieformule worden opgelost.
