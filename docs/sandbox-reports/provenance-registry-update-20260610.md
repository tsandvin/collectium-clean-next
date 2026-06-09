# Collectium Proveniens Registry Update

Dato: 2026-06-10  
Database: Neon Postgres  
Scope: Control registry only  
Source data migration: false  
Status: OK

## Kontrollresultat fra Neon

```json
[
  {
    "check_name": "provenance_registry_update",
    "definition_rows_active": 1,
    "scope_rows_active": 9,
    "event_type_rows_active": 15,
    "visibility_rows_active": 5,
    "provenance_period_active": 1
  }
]
```

## Bekreftet aktivt i Neon

| Kontroll | Resultat |
|---|---:|
| Proveniens-definisjon | 1 |
| Proveniens scope-register | 9 |
| Proveniens event type-register | 15 |
| Proveniens visibility-register | 5 |
| Proveniensperiode i periodefilter | 1 |

## Definisjon

Proveniens i Collectium er strukturert dokumentasjon av objektets opprinnelse, eierskap, hendelser, verdi, omsetning og relasjoner til andre objekter.

Proveniens skal ikke bare vÃ¦re et tekstfelt. Det skal vÃ¦re en strukturert modul som kan vise hvor objektet kommer fra, hvem eller hva det har vÃ¦rt knyttet til, nÃ¥r hendelser skjedde, hvilken verdi eller omsetning som er dokumentert, og hvilke andre objekter som deler samme provenienskilde.

## Felt Proveniens mÃ¥ stÃ¸tte

- Ã¥rstall / periode
- dato eller estimert dato
- presisjon/usikkerhet
- estimert pris
- faktisk transaksjonspris
- omsetning / samlet verdi
- valuta
- antall objekter
- transaksjonstype
- relaterte objekter
- proveniensgruppe
- kilde / dokumentasjon
- synlighet og samtykke

## Privat proveniens

Privat proveniens gjelder eierskap, samling, kjÃ¸p, salg, innlevering, forhandlerhistorikk eller privat transaksjon.

Denne informasjonen eies og kontrolleres av den som har lagt den inn og den eller de som informasjonen berÃ¸rer.

Selger, forhandler, andre brukere eller offentligheten skal ikke kunne se identitet, eierskap, transaksjon, verdi, omsetning eller relaterte objekter uten godkjenning.

## Offentlig proveniens

Offentlig proveniens gjelder historisk eller allment kjent opprinnelse, for eksempel:

- skipsvrak
- forlist bÃ¥t
- vikingegrav
- depotfunn
- skattefunn
- museumsfunn
- arkeologisk funn
- kjent historisk eier
- offentlig dokumentert samling

Slik proveniens kan vises som Proveniensperiode nÃ¥r informasjonen er allment kjent eller dokumentert.

## Proveniensgrupper

Flere objekter kan ha samme proveniens. Collectium mÃ¥ derfor stÃ¸tte proveniensgrupper, for eksempel:

- samling etter en person
- funn fra vikingegrav
- skatt fra skipsvrak
- objekter fra samme auksjon
- objekter fra samme forhandlerinnlevering
- objekter fra samme museumskontekst
- objekter fra samme historiske eier

## Neste steg

1. Opprette API-kontroll: `GET /api/system/provenance-check`
2. Lage faktiske datatabeller for provenienshendelser senere:
   - `ct_provenance_group_registry`
   - `ct_object_provenance_events`
   - `ct_object_provenance_links`
   - `ct_provenance_consent_log`
3. Ikke migrere private brukerdata fÃ¸r samtykke-/tilgangsmodell er kontrollert.
