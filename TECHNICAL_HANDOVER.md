# Trimilix Technical Handover

**Eigenaar:** Manus AI  
**Status:** Fase A-stabilisatie in uitvoering  
**Laatste update:** 16 juli 2026

## 1. Doel

Dit document draagt de operationeel relevante implementatiekeuzes van Trimilix over aan toekomstige engineers en beheerders. Het beschrijft de werkelijke huidige toestand; controles die nog niet door de volledige Fase A-gate zijn gegaan, worden niet als productiebewezen aangeduid. Het [`ENGINEERING_HANDBOOK.md`](ENGINEERING_HANDBOOK.md) blijft normatief voor engineeringbeleid en architectuurtriggers.

## 2. Runtime en hoofdgrenzen

Trimilix is een fullstack modulaire monoliet met React, tRPC, Express, Drizzle en MySQL/TiDB. Het actieve serverentrypoint is `server/_core/index.ts`. Authenticatie verloopt via het platform-OAuthmechanisme, waarna Trimilix een eigen applicatiesessie uitgeeft. Gebruikers- en financiële data blijven in de relationele database; bestanden gebruiken objectopslag met een afzonderlijke publieke allowlist en eigenaargebonden private namespaces.

| Grens | Centrale implementatie | Verplichte invariant |
|---|---|---|
| HTTP-security | `server/_core/httpSecurity.ts` | Securityheaders, begrensde bodies en veilige 413-responsen |
| Rate limiting | `server/_core/rateLimiting.ts` | Routeklassepolicy achter een vervangbare storefactory |
| Sessietoken | `server/_core/sdk.ts` | Maximaal zeven dagen, claimgebonden en alleen via HttpOnly-cookie |
| Sessierevocatie | `server/_core/sessionRevocation.ts` | Adaptercontract; huidige strategie vergelijkt `sessionVersion` |
| Storage | `server/_core/storagePolicy.ts` en `storageProxy.ts` | Publieke allowlist of geauthenticeerde eigenaarnamespace |
| Database | `drizzle/schema.ts` en gecommitteerde migraties | Schema-first, beoordeelde SQL en gecontroleerde toepassing |

## 3. Sessiebesluit ADR-2026-07-16-B

### 3.1 Huidige implementatie

Fase A gebruikt een maximaal zeven dagen geldige HS256-JWT in de `HttpOnly`-sessiecookie. De token bevat `iss`, `aud`, `sub`, `iat`, `nbf`, `exp`, `jti`, `appId`, `openId`, `name` en `sessionVersion`. Verificatie controleert algoritme, issuer, audience, subject/app-binding, verplichte velden, expiratie en een maximale `exp`-`iat`-afstand van zeven dagen. JWT en cookie gebruiken dezelfde `SESSION_DURATION_MS`-constante.

De frontend leest of bewaart de sessietoken niet. De vroegere `sessionStorage`-bearerfallback en volledige profielcache in `localStorage` zijn verwijderd. `clearLegacyAuthStorage()` verwijdert eventueel bij bestaande browsers achtergebleven waarden tijdens initialisatie en logout.

### 3.2 Revocatie en logout

De tabel `users` bevat een monotone `sessionVersion` met initiële waarde `1`. Iedere nieuwe gebruikerssessie neemt de actuele versie op. Na cryptografische verificatie vergelijkt `SessionRevocationAdapter.isCurrent()` deze claim met de geladen gebruiker. Logout wist altijd de cookie en verhoogt voor een geldige gebruiker de databaseversie atomisch. Daardoor worden alle eerder uitgegeven sessies van die gebruiker direct geweigerd.

| Situatie | Gedrag |
|---|---|
| Geldige cookie en gelijke versie | Verzoek kan na normale gebruikerscontrole doorgaan |
| Geldige handtekening maar oude versie | Verzoek wordt geweigerd als ingetrokken sessie |
| Bearertoken zonder sessiecookie | Verzoek wordt niet als gebruikerssessie geaccepteerd |
| Logout met geldige gebruiker | Cookie wordt gewist en alle bestaande sessies worden ingetrokken |
| Logout zonder geldige gebruiker | Een achtergebleven cookie wordt gewist; er is geen database-intrekking nodig |
| Revocatiestore niet beschikbaar | Logout faalt server-side gesloten nadat de browsercookie is gewist |

### 3.3 Deploymentgevolg

De claimset is strenger dan vóór Fase A. Reeds uitgegeven oude sessies missen issuer-, audience-, `jti`- of versieclaims en worden na release bewust ongeldig. Bestaande gebruikers moeten daarom eenmaal opnieuw aanmelden. Dit is een gecontroleerde security-invalidatie, geen datamigratieprobleem.

De niet-destructieve migratie `drizzle/0004_spicy_hercules.sql` voegt `users.sessionVersion INT DEFAULT 1 NOT NULL` toe. Het schema en de projectdatabase moeten deze migratie bevatten vóór de nieuwe runtime productie wordt gemaakt.

### 3.4 Uitbreiding naar apparaatgebonden sessies

Het huidige `SessionRevocationAdapter`-contract is de vervangingsgrens. Een toekomstige implementatie mag een sessierepository met hashed `jti`, gebruiker-ID, expiratie, revocatiestatus en strikt begrensde apparaatmetadata gebruiken. Routers en cookie-/JWT-grenzen mogen daarvoor niet worden herschreven; alleen tokenuitgifte en de adapterimplementatie horen te veranderen.

Migratie is verplicht wanneer afzonderlijke apparaatrevocatie productvereiste wordt, support of security één sessie moet kunnen intrekken, enterprise/compliance een audittrail vereist, risicogestuurde apparaatcontroles nodig zijn, of all-device logout aantoonbaar onaanvaardbare impact heeft. Een apparaatregister vereist vóór productie een retentie- en cleanupbeleid, privacybeoordeling, indexplan, beheerautorisatie en contracttests.

## 4. Rate-limitingbesluit ADR-2026-07-16-A

OAuth, storage en tRPC hebben eigen policies. `RateLimitStoreFactory` is de infrastructuurgrens; Fase A gebruikt afzonderlijke lokale memory stores. Geauthenticeerde verzoeken worden op een gehashte gebruikersidentiteit gesleuteld en overige verzoeken op een proxy-gecorrigeerd IP-adres. Overschrijdingen geven HTTP 429, standaard `RateLimit`-headers en privacyveilige gestructureerde events.

De lokale limiter is niet globaal over meerdere autoscaling instances. Een gedeelde Redis- of edge-adapter is verplicht bij structureel meer dan één productie-instance, misbruik over instances, globale user-/tenantquota, strengere SLA/compliance of multi-regionbediening. De primaire productiedatabase mag niet zonder afzonderlijk ADR als limiterstore worden gebruikt.

## 5. Verificatiebewijs in Fase A

De gerichte regressies voor sessies, logout, browseropslag en rate limiting staan in `server/sessionSecurity.test.ts`, `server/auth.logout.test.ts`, `client/src/lib/authStorage.test.ts` en `server/rateLimiting.test.ts`. De testconfiguratie omvat zowel `server/**/*.test.ts` als `client/src/**/*.test.ts`. Het definitieve aantal, de volledige buildgate en het productie-go/no-go-oordeel worden na afronding vastgelegd in `PHASE_A_STABILIZATION_AUDIT_2026-07-16.md`.

## 6. Overdrachtswaarschuwingen

Geheimen mogen uitsluitend via de projectsecretlaag worden beheerd. Auth- en limiterlogs mogen geen JWT, openID, volledig IP-adres of volledig gebruikersprofiel bevatten. Verleng de sessieduur niet lokaal; iedere wijziging aan levensduur, revocatiemodel, cookiebeleid of tokenclaims vereist een securityreview, regressietests en een bijgewerkt ADR. Een toekomstige apparaat-sessieimplementatie mag geen ruwe JWT’s opslaan.
