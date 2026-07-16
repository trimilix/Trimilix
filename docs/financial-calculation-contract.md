# Trimilix Financial Calculation Contract

**Status:** Fase A-contract, goedgekeurd op 16 juli 2026  
**Eigenaar:** Engineering  
**Norm:** correctheid en reproduceerbaarheid gaan vóór snelheid of implementatiegemak.

> Dit document beschrijft de rekenkundige contracten van de Compounding Simulator™ en de educatieve portefeuille-risico-indicator. De uitkomsten zijn scenarioanalyses en geen persoonlijke financiële prognose of beleggingsadvies.

## 1. Numerieke representatie

De kern gebruikt `decimal.js` met 40 significante cijfers en `ROUND_HALF_UP`. Geld komt de kern binnen als **gehele eurocenten**; rendement komt binnen als **gehele basispunten**. Daardoor zijn binaire IEEE-754-afwijkingen zoals `0.1 + 0.2` geen onderdeel van de domeinberekening.

| Grootheid | Interne eenheid | Contract |
|---|---:|---|
| Startbedrag en inleg | Eurocent | Niet-negatief, geheel en JavaScript-safe |
| Nominaal jaarrendement | Basispunt | 100 bp = 1%; toegestaan −10.000 t/m +10.000 bp |
| Looptijd | Maand | Geheel; 0 t/m 1.200 maanden |
| ETF-prijs en positiewaarde | Eurocent | Prijs × geheel aantal aandelen |
| ETF-risico | Geheel getal 1–5 | `null` betekent onbekend; er bestaat geen standaardwaarde |

De invoergrens voor één geldbedrag is 1.000.000.000.000 cent. Een output boven `Number.MAX_SAFE_INTEGER` cent wordt geblokkeerd in plaats van stilzwijgend onnauwkeurig gemaakt. De productinterface hanteert bewust smallere grenzen dan de domeinmodule.

## 2. Samengestelde interest en maandinleg

### 2.1 Formule

Laat `P` het startbedrag in cent zijn, `C` de maandinleg in cent, `R` het nominale jaarrendement in basispunten en `n` het aantal maanden. De maandrente is:

```text
i = (R / 10.000) / 12
```

De simulator gebruikt de **ordinary-annuity-conventie**: eerst groeit het openingssaldo met de maandrente, daarna wordt de maandinleg toegevoegd.

```text
B₀ = P
Bₘ = Bₘ₋₁ × (1 + i) + C
Tₘ = P + m × C
Gₘ = round_cent(Bₘ) − Tₘ
```

Voor `i ≠ 0` is de equivalente gesloten vorm:

```text
Bₙ = P × (1 + i)ⁿ + C × (((1 + i)ⁿ − 1) / i)
```

Voor `i = 0` geldt `Bₙ = P + n × C`.

### 2.2 Motivatie en bron

[OpenStax, *Contemporary Mathematics*, §6.4](https://openstax.org/books/contemporary-mathematics/pages/6-4-compound-interest) beschrijft samengestelde interest als interest over hoofdsom plus eerder opgebouwde interest en geeft de toekomstwaardestructuur `P(1+r/n)^(nt)`. [OpenStax, *Principles of Finance*, §8.2](https://openstax.org/books/principles-finance/pages/8-2-annuities) definieert een ordinary annuity als betaling aan het einde van iedere periode en toont dat de laatste betaling in die periode geen interest verdient. Deze timing is conservatiever dan begin-maandinleg en is daarom de expliciet goedgekeurde Trimilix-conventie.

Het ingevoerde jaarrendement wordt als **nominaal jaarrendement met maandelijkse periodisering** geïnterpreteerd. Het is geen effectief jaarrendement, inflatiecorrectie, belastingmodel of voorspelling. Kosten en kasstromen die niet als input bestaan, worden niet stilzwijgend geschat.

## 3. Afrondingscontract

Fractionele centen blijven tijdens alle maanden behouden. Afronding vindt uitsluitend plaats bij een publiek outputpunt: beginpunt, jaarpunt, eindpunt of expliciete euro-naar-centconversie. De regel is **half-up naar de dichtstbijzijnde hele cent**.

| Waarde vóór output | Output |
|---:|---:|
| €1,004 | 100 cent |
| €1,005 | 101 cent |
| 7,124% | 712 bp |
| 7,125% | 713 bp |

Deze late afronding voorkomt cumulatieve drift. OpenStax waarschuwt in de annuïteitenbehandeling expliciet dat vroeg of beperkt afronden bij grotere bedragen en looptijden materiële verschillen kan veroorzaken.[^openstax-annuity]

## 4. Portefeuillewaardering

Voor een positie `j` met een geheel aantal aandelen `qⱼ` en actuele prijs `pⱼ` in cent geldt:

```text
Vⱼ = qⱼ × pⱼ
Vportfolio = Σ Vⱼ
wⱼ = Vⱼ / Vportfolio
```

Een negatieve, fractionele of niet-safe invoer wordt geweigerd. Een positie met waarde nul telt niet mee als economische blootstelling.

## 5. Waardegewogen educatieve risicoscore

Voor iedere positieve positie moet een geldige gehele Trimilix-risicoscore `sⱼ` tussen 1 en 5 aanwezig zijn. Als alle relevante gegevens geldig zijn:

```text
Sportfolio = Σ (Vⱼ × sⱼ) / Σ Vⱼ
```

De publieke score wordt half-up op twee decimalen afgerond. De grafiek verdeelt **portefeuillewaarde**, niet aantallen effecten, over de categorieën laag (1–2), matig (3) en hoog (4–5). De algemene aggregatiestructuur volgt het principe dat een portefeuillegewicht de positieomvang gedeeld door de totale portefeuilleomvang is en dat geaggregeerde impact de som van gewicht maal individuele impact is.[^sp-aggregation]

> De 1–5-schaal is een educatieve Trimilix-indicator en geen volatiliteits-, VaR-, PRIIPs-SRI- of geschiktheidsmeting. De aggregatieformule valideert niet de inhoudelijke herkomst van een individuele ETF-score.

### 5.1 Fail-closed databeleid

| Situatie | Status | Score en advies |
|---|---|---|
| Geen positieve blootstelling | `empty` | Geen score |
| Minstens één relevante score ontbreekt | `incomplete` | Geen score; ontbrekende tickers expliciet |
| Minstens één score valt buiten 1–5 of is fractioneel | `incomplete` | Geen score; ongeldige tickers expliciet |
| Alle relevante data is geldig | `complete` | Waardegewogen score en waardeverdeling |

Een ontbrekende ETF-record wordt behandeld als ontbrekende risicodata. De kern vult nooit score 3 in, knipt ongeldige scores niet af en laat ongeldige posities niet stilzwijgend weg. Gepersonaliseerde mockaanbevelingen zijn uit de analyse verwijderd.

## 6. Referentie- en grenswaardebewijs

| Contractcase | Verwachte uitkomst | Geautomatiseerde test |
|---|---:|---|
| 5.000,00 start; 3,8% nominaal; maandelijks; 60 maanden; geen inleg | 6.044,43 | `matches the OpenStax monthly compound-interest reference case` |
| 1.000,00 start; 100,00 einde-maandinleg; 12%; 12 maanden | 2.395,08 | `matches an independently calculated ordinary-annuity reference case` |
| Nulrendement met 12 inleggen | Eindwaarde = totale inleg | `adds contributions without gain when the return is zero` |
| Looptijd nul | Eindwaarde = startbedrag | `retains the opening amount for a zero-month projection` |
| Negatief rendement | Negatieve berekende groei, geen fabricage | `supports a negative nominal annual return without fabricating gains` |
| Maximale looptijd 1.200 maanden | Geaccepteerd binnen outputgrens | `accepts the documented maximum horizon when growth is bounded` |
| 10% waarde op score 1 en 90% op score 5 | Waardegewogen score 4,60 | `weights risk by holding value and returns a value distribution` |
| Ontbrekende of ongeldige risicoscore | Status `incomplete`, score `null` | `blocks the score when…` en `blocks invalid scores…` |

De tests staan in `server/financialCore.test.ts` en `server/portfolioAnalysis.test.ts`. De laatste test de serverintegratie en bewijst ook dat de analyse geen mockaanbevelingen retourneert.

## 7. Wijzigingscontrole

Een wijziging aan formule, timing, eenheid, afronding, validatiegrens of risicodatabeleid is een **breaking domeinwijziging**. Zo'n wijziging vereist voorafgaande architectuurgoedkeuring, aangepaste referentiecases, een vergelijking van oude en nieuwe uitkomsten en actualisatie van dit document. Optimalisaties zijn alleen toegestaan als zij bit-voor-bit dezelfde publieke cent- en score-uitkomsten opleveren voor de volledige regressieset.

[^openstax-annuity]: OpenStax, *Principles of Finance*, §8.2, geraadpleegd 16 juli 2026: https://openstax.org/books/principles-finance/pages/8-2-annuities
[^sp-aggregation]: S&P Global, *Principles of Portfolio Analytics — Aggregation & Exposure*, geraadpleegd 16 juli 2026: https://portal.s1.spglobal.com/survey/documents/SPG_S1_Principles_PA_Aggregation_Exposure.pdf
