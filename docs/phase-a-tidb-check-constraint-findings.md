# Fase A — TiDB CHECK-constraintbevinding

**Datum:** 16 juli 2026  
**Status:** Gevalideerde blocker, oplossing goedgekeurd

## Bevinding

De geïsoleerde clean-database- en restore-rehearsal paste alle zeven gecommitteerde migraties zonder SQL-fout toe, maar registreerde geen van de negen verwachte `CHECK`-constraints. Een holding met nul aandelen en negatieve prijzen werd geaccepteerd. De unieke index op `(portfolioId, etfTicker)`, atomische subscription-upsert, transactierollback en alle logische restorechecksums functioneerden wel.

De oorzaak is dat TiDB CHECK-constraintondersteuning expliciet geactiveerd moet zijn via `tidb_enable_check_constraint`. De officiële TiDB-documentatie stelt dat ingeschakelde CHECK-constraints inserts en updates valideren en dat `TIDB_CHECK_CONSTRAINTS` de geregistreerde constraintset rapporteert.[1] [2]

> `SET GLOBAL tidb_enable_check_constraint = ON;`
>
> — TiDB-documentatie, voorbeeld voor het activeren en registreren van CHECK-constraints.[2]

## Goedgekeurde oplossing

Trimilix gebruikt CHECK-constraints uitsluitend wanneer de database aantoonbaar enforcement ondersteunt. De migratie-/recoveryrehearsal schakelt de capability vóór het aanmaken van de geïsoleerde databases in. De productieomgeving krijgt de capability expliciet geactiveerd en de negen constraints worden opnieuw aangebracht. Runtime en CI voeren een fail-closed preflight uit die minimaal controleert:

| Contract | Verwachting |
|---|---|
| Capability | `tidb_enable_check_constraint = ON` voor de actieve sessie |
| Constraintset | Exact de negen door Trimilix vereiste namen aanwezig |
| Enforcement | Een geïsoleerde ongeldige write wordt in de recoveryrehearsal geweigerd |
| Foutgedrag | Startup/migratie stopt met een geheimveilige, actiegerichte fout |

## Veiligheidsstatus

De mislukte eerste rehearsal gebruikte twee tijdelijke databases. Productietabellen of productierijen zijn niet gewijzigd; beide tijdelijke databases zijn in de `finally`-cleanup verwijderd.

## References

[1]: https://docs.pingcap.com/tidb/stable/constraints/ "TiDB Docs — Constraints"
[2]: https://docs.pingcap.com/tidb/stable/information-schema-tidb-check-constraints/ "TiDB Docs — TIDB_CHECK_CONSTRAINTS"

## Aanvullende DDL-validatiebevinding — 16 juli 2026

De officiële TiDB-documentatie bepaalt dat een CHECK-expressie `TRUE`, `FALSE` of `UNKNOWN` kan opleveren en dat uitsluitend `FALSE` een overtreding is. Bij het toevoegen of opnieuw inschakelen van een CHECK valideert TiDB alle bestaande rijen en stopt de DDL zodra één rij de expressie als `FALSE` evalueert.[3]

De live read-only diagnose op alle vijf ETF-rijen rapporteerde voor zowel `ter IS NULL OR ter >= 0` als de risicoscore-expressie uitsluitend `TRUE`: nul `FALSE`- en nul `UNKNOWN`-resultaten. Toch weigerde TiDB `etfs_ter_nonnegative` met fout 3819. Dat gedrag strookt dus niet met de gedocumenteerde data-evaluatie. TiDB issue #47632 beschrijft historische CHECK-DDL-validatieproblemen tot en met 7.5; de actuele projectdatabase rapporteerde eerder TiDB 8.5, waardoor die historische versiebug geen voldoende verklaring is en nader engine-/snapshotonderzoek vereist.[4]

De gecontroleerde remediateur heeft op dit foutpad geen migratiejournalrecords gewijzigd. Journalreconciliatie blijft fail-closed geblokkeerd.

[3]: https://docs.pingcap.com/tidb/stable/constraints/ "TiDB Constraints — CHECK"
[4]: https://github.com/pingcap/tidb/issues/47632 "TiDB issue 47632 — check constraints DDL can't return forever"

## Goedgekeurde standaardexpressie en convergente vervanging — 16 juli 2026

De officiële TiDB-documentatie bevestigt dat een `CHECK` alleen wordt overtreden wanneer de expressie `FALSE` oplevert; `UNKNOWN` door een `NULL`-waarde blijft geldig. Daarom behouden `CHECK (ter >= 0)` en `CHECK (riskScore BETWEEN 1 AND 5)` exact de bedoelde nullable businesssemantiek, zonder de in TiDB 8.5 problematische expliciete vorm `IS NULL OR ...`.[3]

TiDB documenteert voor het verwijderen van een benoemde CHECK-constraint de syntax `ALTER TABLE t DROP CONSTRAINT constraint_name;`. Migratie `0007_enforce_tidb_checks.sql` gebruikt deze officiële vorm om uitsluitend de twee eventueel eerder geregistreerde ETF-constraints gecontroleerd te vervangen, waarna zij met de standaardexpressie opnieuw worden toegevoegd.[5]

De volledige geïsoleerde rehearsal met alle acht migraties is geslaagd. Zij bewees negen geregistreerde CHECKs, vier verwachte indexen, acceptatie van `NULL` voor beide ETF-velden, afwijzing van negatieve TER en risicoscore buiten 1–5, unieke holdings, atomische subscription-upsert, transactierollback en identieke restorechecksums voor alle zes tabellen. Productiedata is daarbij niet aangeraakt.

[5]: https://docs.pingcap.com/tidb/stable/sql-statement-alter-table/ "TiDB Docs — ALTER TABLE"
