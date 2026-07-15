# Back-up- en herstelbeleid

**Versie:** 1.0  
**Laatst bijgewerkt:** 16 juli 2026  
**Status:** Vereiste standaard; platformback-ups en hersteltests moeten nog operationeel bewezen worden  
**Eigenaar:** CTO / Engineering

> Een ingestelde back-up zonder geslaagde hersteltest geldt niet als bewezen herstelmogelijkheid. Dit document is een beleid en runbookbasis, geen bewijs dat het hostingplatform vandaag elk beschreven mechanisme activeert.

## 1. Doel en scope

Het herstelbeleid beschermt broncode, documentatie, configuratie, databasegegevens, objectopslag en integratieconfiguratie tegen menselijke fouten, defecte releases, providerstoringen en beveiligingsincidenten. Secrets worden nooit in gewone repository- of documentback-ups opgenomen.

| Asset | Systeem van record | Back-up- of herstelmechanisme | Huidige bewijsstatus |
|---|---|---|---|
| Broncode | Projectrepository | Checkpoints en externe repository-export | Checkpoints beschikbaar; externe repository te verifiëren |
| Documentatie en ADR’s | Projectrepository | Zelfde versiegeschiedenis als code | Beschikbaar via checkpoints |
| Niet-geheime configuratie | Projectrepository / beheerlaag | Versiegeschiedenis en gedocumenteerde defaults | Gedeeltelijk bewezen |
| Database | Beheerde MySQL/TiDB | Platformback-up, retentie en eventueel point-in-time recovery | Niet geverifieerd |
| Objectbestanden | S3-compatibele objectopslag | Providerduurzaamheid, versiebeheer of replicatie | Niet geverifieerd |
| Secrets | Beveiligde secretbeheerlaag | Gescheiden herstelprocedure en rotatie | Niet exporteren naar repository |
| Externe integraties | Stripe, OAuth, marktdata | Providerconfiguratie en contractregister | Handmatig te inventariseren |
| Buildartefacten | CI/buildsysteem | Reproduceerbaar herbouwen uit bron en lockfile | Lokale productiebuild bewezen |

## 2. Gegevensclassificatie en herstelprioriteit

| Klasse | Voorbeelden | Prioriteit | Herstelhouding |
|---|---|---:|---|
| Kritiek | Gebruikers, abonnementen, portefeuilles, holdings | 1 | Dataverlies minimaliseren; integriteit vóór beschikbaarheid |
| Hoog | ETF-catalogus, entitlementconfiguratie, auditmetadata | 2 | Snel herstellen en tegen contractsysteem controleren |
| Middel | Historische afgeleide analyses, gecachte marktdata | 3 | Herberekenen of gecontroleerd opnieuw ophalen indien licentie dit toelaat |
| Laag | Tijdelijke caches en lokale buildartefacten | 4 | Niet back-uppen; opnieuw opbouwen |

Marktdataretentie is altijd ondergeschikt aan het providercontract. Een technische back-up mag geen data langer bewaren dan contractueel toegelaten.

## 3. RPO- en RTO-doelrichting

RPO en RTO worden pas contractuele SLO’s wanneer hostingmogelijkheden, kosten en hersteltests ze aantonen. De volgende waarden zijn interne **doelrichtingen** voor verdere uitwerking.

| Asset | Initiële RPO-doelrichting | Initiële RTO-doelrichting | Afhankelijkheid |
|---|---:|---:|---|
| Kritieke databasegegevens | ≤ 24 uur; later lager bij betalende schaal | ≤ 8 uur | Platformback-up/PITR en restoretoegang |
| Broncode en documentatie | Laatste checkpoint/commit | ≤ 2 uur | Repository- en checkpointtoegang |
| Objectopslag | ≤ 24 uur waar vereist | ≤ 8 uur | Versiebeheer/replicatie bij provider |
| Secrets en integratieconfiguratie | Laatste goedgekeurde configuratie | ≤ 4 uur | Beheerlaag, eigenaarstoegang en rotatieprocedure |
| Marktdata-cache | Geen garantie | ≤ 1 uur om opnieuw op te bouwen | Providerbeschikbaarheid en licentie |

Na validatie van het platform worden de waarden aangescherpt op basis van bedrijfsimpact, betalende gebruikers en kost.

## 4. Verplichte controles

| Controle | Frequentie | Bewijs |
|---|---|---|
| Checkpoint vóór release en risicovolle migratie | Iedere relevante wijziging | Versie-ID en beschrijving |
| Databaseback-upstatus controleren | Minimaal maandelijks; vaker in productie | Platformrapport of beheerbewijs |
| Geïsoleerde database-restore | Minimaal per kwartaal zodra productie actief is | Restoreverslag en integriteitschecks |
| Objectrestore-steekproef | Per kwartaal indien gebruikersbestanden actief zijn | Bestandschecksum en toegangscontrole |
| Secretherstel en rotatie-oefening | Halfjaarlijks of na incident | Geredigeerd verslag zonder secretwaarden |
| Volledig continuïteitsscenario | Jaarlijks en na grote architectuurwijziging | CTO-goedgekeurd rapport |

## 5. Databaseherstelrunbook

1. **Declareer het incident en bevries destructieve wijzigingen.** Noteer starttijd, impact, betrokken omgeving en laatste bekende geldige toestand.
2. **Selecteer het herstelpunt.** Gebruik platformmetadata, migratiegeschiedenis en business-events; raad niet op basis van alleen bestandstimestamps.
3. **Herstel eerst geïsoleerd.** Een restore gaat naar een aparte omgeving of database en overschrijft productie niet rechtstreeks.
4. **Valideer schema en integriteit.** Controleer migratieversie, rijaantallen, referentiële relaties, unieke constraints en kritieke businessrecords.
5. **Valideer autorisatie.** Test login, eigenaarsgebonden portefeuilletoegang, adminrechten en abonnementsentitlements.
6. **Valideer applicatiegedrag.** Start de exacte releaseversie, voer typecheck/build uit en test kritieke journeys.
7. **Plan gecontroleerde omschakeling.** Documenteer downtime, read-onlyvenster, DNS/connection switch en rollbackpunt.
8. **Monitor na herstel.** Volg fouten, latency, databasebelasting en dataconsistentie.
9. **Sluit af met postmortem.** Leg oorzaak, dataverlies, RPO/RTO, corrigerende acties en eigenaar vast.

Geen destructieve SQL of productierestore wordt uitgevoerd zonder expliciete goedkeuring van de Business Owner/CTO en een bevestigd terugkeerpad.

## 6. Broncode- en releaseherstel

Elke stabiele mijlpaal krijgt een checkpoint met een betekenisvolle beschrijving. Voor publicatie is een checkpoint verplicht. Terugrollen gebeurt via het beheerde rollbackmechanisme, niet via een harde Git-reset. Databasewijzigingen worden niet automatisch teruggedraaid door een code-rollback; migraties vereisen een afzonderlijk, vooraf ontworpen herstelpad.

| Scenario | Herstelactie |
|---|---|
| Frontendregressie zonder datamigratie | Laatste stabiele checkpoint herstellen en opnieuw valideren |
| Serverregressie zonder schemawijziging | Stabiele checkpoint, smoke test en gecontroleerde herpublicatie |
| Foutieve schemawijziging | Databasespecifiek herstelplan; geen automatische downgrade aannemen |
| Kwetsbare dependency | Veilige patch/override, volledige verify-keten en checkpoint |
| Gecompromitteerd secret | Secret intrekken, roteren, logs beoordelen en betrokken releases opnieuw starten |

## 7. Secrets en externe integraties

Secrets worden niet geëxporteerd naar Markdown, tickets, logs of gewone back-ups. Het herstelregister bevat alleen de omgevingsvariabelenaam, eigenaar, doel, rotatiefrequentie en verkrijgingsprocedure. Bij herstel worden secretwaarden via de beveiligde beheerlaag opnieuw ingesteld.

Externe integraties vereisen een inventaris van accountowner, contract, omgeving, callback-URL’s, webhookconfiguratie, quota en escalatiekanaal. Test- en productiecredentials blijven strikt gescheiden.

## 8. Platformbeperkingen die nog bewezen moeten worden

| Vraag | Risico zonder bewijs | Vereiste actie |
|---|---|---|
| Welke databaseback-ups en retentie zijn actief? | Onbekend dataverliesvenster | In beheerlaag of providerdocumentatie verifiëren |
| Is point-in-time recovery beschikbaar? | Geen herstel tot vlak vóór incident | Beschikbaarheid en kost bevestigen |
| Kan een restore naar een geïsoleerde database? | Hersteltest kan productie bedreigen | Herstelworkflow testen |
| Heeft objectopslag versiebeheer of replicatie? | Overschreven/verwijderde bestanden mogelijk verloren | Providerinstellingen controleren |
| Zijn projectcheckpoints extern geëxporteerd? | Afhankelijkheid van één platform/account | Repository-export en eigenaarstoegang instellen |
| Hoe worden secrets na accountverlies hersteld? | Integraties blijven offline | Break-glass-procedure documenteren |
| Bestaat fysiek gescheiden staging? | Hersteltests raken productie | Stagingomgeving verifiëren of creëren |

## 9. Hersteltestverslag

Ieder hersteltestverslag bevat datum, omgeving, gekozen herstelpunt, gemeten RPO, gemeten RTO, betrokken assets, gebruikte procedures, integriteitsresultaten, beveiligingscontroles, afwijkingen en concrete vervolgacties met eigenaar en deadline.

## 10. Acceptatiecriteria

Het back-up- en herstelbeleid is operationeel bewezen wanneer database- en objectback-ups aantoonbaar actief zijn, een geïsoleerde restore succesvol is uitgevoerd, kritieke journeys en autorisatie na restore slagen, secrets gescheiden zijn gebleven en gemeten RPO/RTO binnen de goedgekeurde grenzen vallen.
