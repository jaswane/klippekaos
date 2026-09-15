# KlippeKaos – Gressklipperspillet

**Prototype 06.2** er et gratis nettspill om å klippe plenen, laget av Swane Creative med HTML, CSS og Canvas/JavaScript.

Karriere har fem nivåer: Den lille hagen (styring og vanlig plen), L-hagen (tungt gress), Kurvehagen (katt), Blomsterhagen (markblomster) og Sommerhagen (jordveps). Fullføring låser opp neste nivå lokalt. Testhagene og Tidspress på 60 sekunder er separate valg.

## Kjør lokalt

Krever Node.js 20 eller nyere. Ingen eksterne pakkeavhengigheter.

```sh
npm run dev
```

Åpne http://127.0.0.1:4173. Hold venstre museknapp for å kjøre fremover mot pekeren, eller høyre for å rygge bakenden mot pekeren. Slipp for vanlig oppbremsing. Nær peker gir skarpere sving enn fjern peker. W/S eller opp/ned kjører frem og rygger; A/D eller venstre/høyre svinger. Shift gir fartsboost, E/Space gir manøverboost og Esc pauser. Standard gamepad støttes.

Mobil/nettbrett spilles liggende med joystick og gass/revers. Musestyrte hybrider får touchkontroller først ved faktisk berøring. Portrait viser rotasjonsvarsel og pauser pågående spill.

## Test og bygg

```sh
npm test
npm run build
```

P06.2 har **141/141 beståtte tester**, inkludert tidligere regresjoner og tester for miljø, mobil viewport, sprite-anchor, revers og native musehendelser. Byggkommandoen validerer JavaScript, HTML-ID-er og lokale ressursreferanser. Se [DESIGN.md](DESIGN.md) for implementert mekanikk og QA-status.

## P06 – visual foundation

Rendering er delt i viewport, scene, plen, aktører og enkle Canvas-assets i `dist/render/`. Én world↔screen-transformasjon bevarer banens proporsjoner og brukes også av musestyringen. HUD ligger som DOM/CSS-overlay over scenen. `scene-data.js` beskriver dekor separat fra spillgeometri; statisk dekor caches, og foreground tones ned nær klipper eller aktive farer. Fysikk, scoring, nivåer og lagringsformat er uendret.

Musestyringen er fysisk testet og godkjent av prosjekteier for P06-release.

## P06.1 – plen og klipper

Plenrendereren cacher seedet tekstur for kort, høyt og tungt gress. Klippet plen beholder gresstrå, med subtil retningstoning fra en separat stripe-direction-buffer og organisk visuell klippekant. Overlapp legger ikke på stadig nye fargelag. Gresspartikler oppstår bare ved nytt gress og respekterer redusert bevegelse. Klipperen har tydeligere hjul, motor, lys og kontaktskygge, uten fører eller endret gameplay-footprint. Gress-cache følger viewport/DPR med faktor maks 2 og bevarer klippestatus ved resize.

P06.1 er visuelt godkjent av prosjekteier mot designreferansen. Gameplay fra P06.1 videreføres; miljø og aktiv klipper er oppdatert i P06.2.

## P06.2 – miljø og kontroller

Karrierehagene har et sammenhengende miljøsett med trær/busker, terrasse, huskant, møbler, hekk/gjerde/mur, blomster, basseng og trampoline. Eksisterende trecollidere har separate, større foreground-kroner som tones ned nær klipper, person, katt og veps.

Aktiv klipper er en transparent push-mower med person bak. PNG-en bruker aggregat-anchor (625, 890), skala 0,105 og vinkeloffset −π/2; Canvas-klipperen er fallback. Personen er visuell og har ingen collider.

Mobil landscape har kompakt HUD, mindre touch-overlays og tilpasning til visualViewport/safe areas. Høyre museknapp rygger; siste trykte museknapp overtar, og slipp/cancel/blur/pause rydder input. Native høyreklikk og dragging undertrykkes på gameplay-flaten, med avgrenset vern for avslutningen av en påbegynt høyreklikkssekvens.

Prosjekteier har fysisk testet og godkjent høyreknapp-revers og godkjent den samlede P06.2-releasen. Fysikk, coverage, scoring, progresjon og lagring er uendret.

## Lagring og støtte

Nivåopplåsing og topp fem per bane/modus lagres i localStorage under `klippekaos-p05`. Kvalifiserende forsøk registreres med nøyaktig tre initialer (A–Z/0–9). P04-data migreres ikke og overskrives ikke. Innstillinger bruker `klippekaos-settings`. Data følger ikke automatisk med til en annen nettleser eller adresse.

«Om & støtte» finnes i hovedmenyen og pausemenyen: kontakt@swanecreative.no, Vipps #63338 og [Swane Creatives støtteside](https://www.swanecreative.no/stott). Støttelenken åpner separat; runden forblir pauset. QR-koden er en lokal kopi av originalen, ikke en hotlink.

## Vercel og filer

Importer repoets rot i Vercel. `vercel.json` angir `npm run build` og output-mappen `dist`. Ingen backend, database eller miljøvariabler kreves.

- `dist/`: redigerbare statiske spillfiler, inkludert `input.js`, `mouse-input.js`, `profile.js`, `scene-data.js` og `render/`.
- `scripts/`, `tests/`: lokal server, byggvalidering og P01–P06.2-tester.
- `public/art/mowers/mower-01-push.png`: kopieres til `dist/assets/mowers/` ved build.
- `app/icon.png`, `public/klippe-kaos-logo.png`, `public/vippsqr.png`: kopieres til `dist/assets/` ved build. HTML refererer eksplisitt til PNG-logo, favicon/apple-touch-icon og QR. Ingen Next.js metadata-routing brukes.

Fysisk mobil/iPad, multitouch, virtuelt tastatur, QR-skanning og menneskelig fullføring rundt markblomstene bør fortsatt testes på maskinvare.
