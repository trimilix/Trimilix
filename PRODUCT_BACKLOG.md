# Trimilix — Productbacklog na Fase A

Deze backlog bevat uitsluitend werk dat **niet is geïmplementeerd in de Fase A-stabilisatiesprint**. Het is bewust buiten scope gehouden omdat de goedgekeurde opdracht geen nieuwe functionaliteit, betaalflow, contentproductie of brede productierelease omvatte. De items blijven open totdat zij afzonderlijk worden geprioriteerd, ontworpen, beveiligd en gevalideerd.

## Productflows en commercialisering

- [ ] Onboarding-flow.
- [ ] Stripe-integratie.
- [ ] Premium-abonnement en checkout.
- [ ] Doelplanner koppelen aan echte goals-data via tRPC en database, inclusief lijst, aanmaken, wijzigen en verwijderen.
- [ ] Doelplanner voorzien van loading-, error- en empty states en volledige invoervalidatie.
- [ ] Academy-content.
- [ ] Broker Match™.
- [ ] Fiscale Module™.

## Portfolioanalyse en risicodata

- [ ] Voltooi één geïntegreerd backendcontract voor risico, spreiding en dynamische aanbevelingen; risico en spreiding zijn in Fase A data-gedreven gemaakt, maar aanbevelingen worden bewust niet gefabriceerd en blijven geblokkeerd totdat methodiek en productverantwoordelijkheid zijn goedgekeurd.
- [ ] Valideer of vervang de huidige geseede ETF-risicoscores met een expliciete, onderhoudbare en juridisch/productmatig goedgekeurde methodiek en bron.
- [ ] Documenteer per geseede ETF de vastgestelde risicoscore, criteria, voorbeelden, bronbeperkingen en herbeoordelingsproces.
- [ ] Genereer aanbevelingen alleen na goedkeuring van analysemethodiek, productclaims, disclaimers en testbare beslisregels.

## Productie- en releasegereedheid

- [ ] Voer een volledige geauthenticeerde browser-E2E-suite uit met geïsoleerde testdata voor login, portfolio, ETF, simulatie en foutpaden.
- [ ] Voer productieachtige load-, cold-start-, autoscaling-, database- en Web Vitals-metingen uit; de Fase A-health/readinessbaseline is geen capaciteitstest.
- [ ] Convergeer een centrale API-/database-/deploymentdocumentindex vóór teamuitbreiding.
- [ ] Doorloop de brede productiereleasechecklist pas nadat externe monitoring/alerts, providerback-upretentie, meetbare RPO/RTO en branch-/mergebescherming zijn bewezen.
- [ ] Breid generieke request-level idempotency uit zodra Stripe, webhooks, betalingen of andere samengestelde geldachtige mutaties worden geïntroduceerd; huidige atomische writes en transactiewrapper zijn wel aanwezig.

## Video- en contentproductie

- [ ] Inventariseer de Trimilix-merkstijl, logo-assets en geschikte videotoepassingen voor website en social media.
- [ ] Definieer een herbruikbaar weekformat met intro/outro, motiontaal, afleveringsstructuur, platformverhoudingen en topicbibliotheek.
- [ ] Schrijf script, storyboard, voice-over en schermteksten voor een eerste Trimilix-pilotvideo.
- [ ] Produceer en controleer een professionele geanimeerde pilotvideo in minimaal één social-mediaformaat en één websitevariant.
- [ ] Documenteer de wekelijkse productiewerkwijze, publicatiecopy en vervangbare inhoudsblokken.

## Besluitregel

Geen item uit deze backlog mag als gereed worden beschouwd op basis van dit document. Elk item vereist een nieuwe expliciete opdracht, eigen acceptatiecriteria, tests, security-/privacybeoordeling en waar relevant database-, herstel- en observabilitybewijs.
