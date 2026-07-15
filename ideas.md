# Ontwerprichting — Moderne Bedrijfswebsite

## Drie mogelijke stijlroutes

### Thema 1 — Architectonisch Vertrouwen
**Korte introductie:** Een redactionele, architectonische stijl met veel ritme, sterke typografie en een warme zakelijke uitstraling. De website voelt deskundig, zorgvuldig en menselijk zonder conventioneel corporate te worden.

**Kans:** 0,031

### Thema 2 — Digitaal Atelier
**Korte introductie:** Een expressieve, technologisch geïnspireerde richting met donkere materialen, scherpe typografie en lichtgevende accenten. De ervaring voelt ambitieus en vooruitstrevend.

**Kans:** 0,074

### Thema 3 — Natuurlijk Ondernemerschap
**Korte introductie:** Een lichte, tactiele vormgeving met organische fotografie, aardse kleuren en zachte redactionele composities. De toon is toegankelijk, lokaal en duurzaam.

**Kans:** 0,018

## Gekozen richting: Architectonisch Vertrouwen

### Design Movement
De vormgeving is gebaseerd op **International Typographic Style**, verrijkt met hedendaags Nederlands editorial design en subtiele brutalistische accenten. Het resultaat is precies en zakelijk, maar niet steriel.

### Kernprincipes

1. **Asymmetrische helderheid:** Secties gebruiken verschoven kolommen, brede marges en bewuste spanning tussen tekst en beeld in plaats van gecentreerde standaardblokken.
2. **Typografie als architectuur:** Grote koppen, compacte labels en rustige leestekst vormen de primaire visuele hiërarchie.
3. **Warm zakelijk materiaal:** Crèmekleurige oppervlakken, diep inktblauw en mineraalgroen geven vertrouwen zonder de gebruikelijke koele corporate uitstraling.
4. **Bewijs door structuur:** Diensten, werkwijze en voordelen worden concreet en scanbaar gepresenteerd; decoratie ondersteunt inhoud en vervangt die nooit.

### Kleurfilosofie
De basis is warm ivoor, gekozen om de website menselijker en tactieler te maken dan helder wit. Diep nachtblauw staat voor expertise en vormt het belangrijkste contrast. Het eigen mineraalgroen brengt energie en groei in CTA’s, markeringen en interactieve details. Een gedempt kleirood wordt alleen als secundair signaal gebruikt. De kleurverhouding blijft ongeveer 70% ivoor, 22% nachtblauw en 8% accenten.

| Rol | Kleur | Intentie |
| --- | --- | --- |
| Achtergrond | Warm ivoor `#F2EFE7` | Rust, tactiliteit en leescomfort |
| Hoofdtekst | Nachtinkt `#102724` | Autoriteit zonder hard zwart |
| Merkkleur | Mineraalgroen `#20B486` | Groei, daadkracht en herkenbaarheid |
| Secundair accent | Klei `#D96C4C` | Menselijkheid en redactionele spanning |
| Donker vlak | Diep petrol `#0B1E1B` | Contrast en premium diepte |

### Layoutparadigma
De pagina volgt een **versprongen redactionele strook**. Inhoud wordt georganiseerd langs een zichtbare verticale geleidelijn die soms links en soms centraal loopt. De hero gebruikt een groot tekstvlak links en een gelaagde fotografische compositie rechts. Secties wisselen tussen smalle tekstkolommen, brede beeldvelden en horizontale servicelijnen. In plaats van uniforme kaarten worden diensten gepresenteerd als genummerde dossiers met afwijkende uitlijning.

### Signatuurelementen

1. Een dunne verticale **groeilijn** die door meerdere secties loopt en belangrijke punten verbindt.
2. Grote, licht transparante sectienummers zoals `01`, `02` en `03`, gebruikt als ruimtelijke ankers.
3. Afgesneden hoekvlakken en kleine mineraalgroene maatstreepjes die verwijzen naar technische tekeningen en architectuur.

### Interactiefilosofie
Interacties voelen direct en precies. Knoppen reageren met een kleine fysieke druk, tekstlinks krijgen een uitschuivende maatlijn en dienstregels verschuiven enkele pixels wanneer ze focus of hover krijgen. De mobiele navigatie opent als een rustig, volwaardig paneel. Functionaliteit blijft zonder muis volledig bereikbaar.

### Animatie
Secties verschijnen met korte verticale verplaatsing en opacity, maximaal 500 ms en met een krachtige ease-out. Groepen krijgen een subtiele vertraging van 45 ms per element. De groeilijn tekent zich tijdens de eerste hero-entrance in, terwijl afbeeldingen licht van schaal 1,03 naar 1 bewegen. Hoveranimaties blijven onder 180 ms. `prefers-reduced-motion` schakelt alle niet-essentiële beweging uit.

### Typografiesysteem

| Niveau | Lettertype | Richtlijn |
| --- | --- | --- |
| Displaykoppen | **Manrope** | 650–800, compacte regelafstand, responsieve `clamp()`-schaal |
| Lopende tekst | **Source Serif 4** | 400–500, royale regelafstand voor een redactioneel en betrouwbaar gevoel |
| Labels en navigatie | **Manrope** | 600, kleine kapitalen of ruime letterspatiëring |
| Cijfers en bewijs | **Manrope** | 700, tabulaire cijfers waar relevant |

### Merkessentie
**Een scherpe groeipartner voor ambitieuze ondernemers die strategie en uitvoering zonder ruis willen verbinden.** Persoonlijk, precies, voortvarend.

### Merkstem
Koppen zijn kort, zelfverzekerd en concreet. CTA’s benoemen de eerstvolgende stap, niet een abstract resultaat. Microcopy is menselijk en praktisch; vakjargon wordt alleen gebruikt wanneer het betekenis toevoegt.

> Voorbeeldkop: **Vooruitgang begint met een helder plan.**
>
> Voorbeeld-CTA: **Plan een eerste gesprek**

### Woordmerk en logo
Het conceptmerk heet **NOORDLIJN**. Het woordmerk combineert brede kapitalen met een karakteristieke insnede in de letter `N`. Het beeldmerk is een eenvoudige, oplopende hoeklijn: drie verbonden segmenten die tegelijk een noordpijl, een groeigrafiek en een abstracte `N` suggereren. Het symbool wordt zonder tekst op transparante achtergrond gebruikt in navigatie en favicon.

### Kenmerkende merkkleur
**Mineraalgroen `#20B486`** is de eigen, herkenbare signaalkleur. De kleur wordt gereserveerd voor acties, maatstrepen, focusstaten en strategische accenten, zodat hij betekenis houdt.

## Inhoudsarchitectuur

De eerste versie wordt een complete one-page bedrijfswebsite met vaste navigatie naar **Diensten**, **Werkwijze**, **Over ons** en **Contact**. De diensten zijn Strategie, Digitale groei en Uitvoering. De primaire conversie is het plannen van een eerste gesprek; de secundaire conversie is het bekijken van de werkwijze. Een contactformulier werkt als frontend-demonstratie met duidelijke bevestiging, zonder externe gegevensopslag.
