# KlippeKaos – Gressklipperspillet

**P06.3 + Karriere-klipperprogresjon** er et gratis nettspill om å klippe plenen, laget av Swane Creative med HTML, CSS og Canvas/JavaScript.

Karriere har fem nivåer: Den lille hagen (styring og vanlig plen), L-hagen (tungt gress), Kurvehagen (hyppigere katt), Blomsterhagen (markblomster) og Sommerhagen (jordveps). Katt kan forekomme på alle fem nivåer, med senere og færre passeringer i starten. Fullføring låser opp neste nivå og en ny klipper lokalt. Testhagene og Tidspress på 60 sekunder er separate valg.

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

Denne iterasjonen har **196/196 beståtte tester**, inkludert tidligere regresjoner, klipperopplåsing/valg, profilmigrering, nivåspesifikk katt og blomsterbed uten endret kollisjon. Byggkommandoen validerer JavaScript, HTML-ID-er og lokale ressursreferanser. Se [DESIGN.md](DESIGN.md) for implementert mekanikk og QA-status.

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

## Klipperprofiler, art og farer

Seks lokale klipperprofiler gir gradvis høyere fart og bredere klipping, med separat styringsmultiplikator. Kollisjonsradius er uendret; større klippebredde brukes av både klippeberegning og plenrendering. De tre sitteklipperne er visuelt økt 10/14/16 % og har separate rider-overlays med grep tilpasset ratt eller spaker. PNG-originalene er urørt. Miljøsettet bruker lokale bilder for trær, busker, hekk, potter, stol, parasoll og steinbed, med Canvas-fallback og foreground-fade.

Karriere har nivåspesifikk kattfrekvens: første ankomst etter 30/25/18/18/18 sekunder, pause før neste varsel på 28/22/17/16/13,5 sekunder og maks 2/2/3/3/4 passeringer. Varslet varer fortsatt 1,5 sekunder. Jordveps introduseres på Karriere-nivå 5 og kommer fra 2–4 skjulte, seedede bol som klippeaggregatet må passere. Hvert bol brukes én gang; maks fire hendelser, 0,9 sekunders varsel og seks sekunders pause mellom svermer. Katt og veps koordineres fortsatt; samlet vepsestraff er maks 400.

`npm run art:qa` åpner en lokal server på http://127.0.0.1:4191 med klippervalg, profilverdier, seed, boltellere og testscener. Verktøyet leveres ikke i produksjons-UI. QA-profilen bruker separat sessionStorage og påvirker ikke vanlig profil. Ingen butikk eller økonomi er innført.

Karriere starter med standardklipper. Fullføring av nivå 1–5 låser opp gul skyveklipper, premium, kompakt sitteklipper, hagetraktor og zero-turn. Kravene ligger i `unlockAfterCareerLevel`; alle seks klippere vises i menyen, og alle opplåste kan velges fritt. Førstegangsopplåsing vises på resultatkortet med «Bruk denne» / «Fortsett med nåværende». Stats og godkjent rider-/bilde-mapping er beholdt.

Eksisterende blomsterbed bruker `public/art/environment/flower-bed-stone-01.png` med uendret collider. Gammel rektangulær prototypegrafikk er fjernet; collider-outline finnes bare i Art QA. Prosjekteier har fysisk testet og godkjent Karriere-progresjon, klipperopplåsing, kattfrekvens og blomsterbed.

## Lagring og støtte

Nivåopplåsing, `selectedMower`, `unlockedMowers` og topp fem per bane/modus lagres i localStorage under `klippekaos-p05`. Eldre profiler beholder progresjon og rekorder; manglende klipperfelt utledes fra lagret Karriere-progresjon, med standardklipper som valgt. Zero-turn krever lagret nivå 5-fullføring eller ny fullføring. Kvalifiserende forsøk registreres med nøyaktig tre initialer (A–Z/0–9). P04-data migreres ikke og overskrives ikke. Innstillinger bruker `klippekaos-settings`. Data følger ikke automatisk med til en annen nettleser eller adresse.

«Om & støtte» finnes i hovedmenyen og pausemenyen: kontakt@swanecreative.no, Vipps #63338 og [Swane Creatives støtteside](https://www.swanecreative.no/stott). Støttelenken åpner separat; runden forblir pauset. QR-koden er en lokal kopi av originalen, ikke en hotlink.

## Vercel og filer

Importer repoets rot i Vercel. `vercel.json` angir `npm run build` og output-mappen `dist`. Ingen backend, database eller miljøvariabler kreves.

- `dist/`: redigerbare statiske spillfiler, inkludert `input.js`, `mouse-input.js`, `profile.js`, `scene-data.js` og `render/`.
- `scripts/`, `tests/`: lokal server, Art QA, byggvalidering og regresjonstester.
- `public/art/`: lokale mower-, rider- og environment-PNG-er kopieres til `dist/assets/` etter render-metadata ved build.
- `app/icon.png`, `public/klippe-kaos-logo.png`, `public/vippsqr.png`: kopieres til `dist/assets/` ved build. HTML refererer eksplisitt til PNG-logo, favicon/apple-touch-icon og QR. Ingen Next.js metadata-routing brukes.

Fysisk mobil/iPad, multitouch, virtuelt tastatur, QR-skanning og menneskelig fullføring rundt markblomstene bør fortsatt testes på maskinvare.
