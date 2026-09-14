# KlippeKaos – Gressklipperspillet

**Prototype 05** er et gratis nettspill om å klippe plenen, laget av Swane Creative med HTML, CSS og Canvas/JavaScript.

Karriere har fem nivåer: Den lille hagen (styring og vanlig plen), L-hagen (tungt gress), Kurvehagen (katt), Blomsterhagen (markblomster) og Sommerhagen (jordveps). Fullføring låser opp neste nivå lokalt. Testhagene og Tidspress på 60 sekunder er separate valg.

## Kjør lokalt

Krever Node.js 20 eller nyere. Ingen eksterne pakkeavhengigheter.

```sh
npm run dev
```

Åpne http://127.0.0.1:4173. W/S eller opp/ned kjører frem og rygger; A/D eller venstre/høyre svinger. Shift gir fartsboost, E/Space gir manøverboost og Esc pauser. Standard gamepad støttes.

Mobil/nettbrett spilles liggende med joystick og gass/revers. Musestyrte hybrider får touchkontroller først ved faktisk berøring. Portrait viser rotasjonsvarsel og pauser pågående spill.

## Test og bygg

```sh
npm test
npm run build
```

P05 har **72/72 beståtte tester**: 7 P01, 17 P02, 15 P03, 19 P04 og 14 P05. Byggkommandoen validerer JavaScript, HTML-ID-er og lokale ressursreferanser. Se [DESIGN.md](DESIGN.md) for implementert mekanikk og QA-status.

## Lagring og støtte

Nivåopplåsing og topp fem per bane/modus lagres i localStorage under `klippekaos-p05`. Kvalifiserende forsøk registreres med nøyaktig tre initialer (A–Z/0–9). P04-data migreres ikke og overskrives ikke. Innstillinger bruker `klippekaos-settings`. Data følger ikke automatisk med til en annen nettleser eller adresse.

«Om & støtte» finnes i hovedmenyen og pausemenyen: kontakt@swanecreative.no, Vipps #63338 og [Swane Creatives støtteside](https://www.swanecreative.no/stott). Støttelenken åpner separat; runden forblir pauset. QR-koden er en lokal kopi av originalen, ikke en hotlink.

## Vercel og filer

Importer repoets rot i Vercel. `vercel.json` angir `npm run build` og output-mappen `dist`. Ingen backend, database eller miljøvariabler kreves.

- `dist/`: redigerbare statiske spillfiler, inkludert `input.js` og `profile.js`.
- `scripts/`, `tests/`: lokal server, byggvalidering og P01–P05-tester.
- `app/icon.png`, `public/klippe-kaos-logo.png`, `public/vippsqr.png`: kopieres til `dist/assets/` ved build. HTML refererer eksplisitt til PNG-logo, favicon/apple-touch-icon og QR. Ingen Next.js metadata-routing brukes.

Fysisk mobil/iPad, multitouch, virtuelt tastatur, QR-skanning og menneskelig fullføring rundt markblomstene bør fortsatt testes på maskinvare.
