# KlippeKaos – Gressklipperspillet

**Prototype 04** er et lite plenklippespill sett ovenfra, laget med HTML, CSS og Canvas/JavaScript. Et spillprosjekt fra Swane Creative.

Klipp tre ulike hager, bruk boost og slå egne rekorder. I Tidspress er målet: «Hvor mye klarer du å klippe på 60 sekunder?» Kurvehagen har tungt gress og markblomster som skal skånes. Styr unna katten – treff avslutter runden. Jordveps kan dukke opp flere ganger.

## Kjør lokalt

Krever Node.js 20 eller nyere. Ingen eksterne pakkeavhengigheter.

```sh
npm run dev
```

Åpne http://127.0.0.1:4173. W/S eller piltastene kjører frem og rygger; A/D eller venstre/høyre svinger. Shift gir fartsboost, E/Space gir manøverboost, Esc pauser. Standard gamepad støttes.

På mobil/nettbrett: hold enheten liggende, styr med venstre joystick og bruk gass/revers og boostknappene til høyre. Musestyrte hybrider viser ikke touchkontroller før faktisk berøring. Fullskjermknappen vises der nettleseren støtter det.

## Test og bygg

```sh
npm test
npm run build
```

P04 har **58 automatiske tester** for grunnmekanikk, terreng, hendelser og input. Byggkommandoen validerer JavaScript, HTML-ID-er og lokale ressursreferanser. Filene i `dist/` er redigerbare, ferdige statiske spillfiler.

Nettleser-QA dekker desktop, laptop og emulerte mobil-/nettbrettprofiler, rotasjon, safe-area-marger, pause, restart, tap og resultatkort. Fysisk mobil/iPad, samtidig tommelstyring og menneskelig fullføring rundt markblomstene gjenstår. Se [DESIGN.md](DESIGN.md) for mekanikk og QA-detaljer.

## Vercel og filer

Importer repoets rot i Vercel. `vercel.json` angir `npm run build` og output-mappen `dist`. Ingen backend, database eller miljøvariabler kreves.

- `dist/`: HTML, CSS, spillkode og den separate touchadapteren `input.js`.
- `scripts/`, `tests/`: lokal server, validering og P01–P04-tester.
- `app/icon.png`, `public/klippe-kaos-logo.png`: medfølgende, uendrede grafikkfiler. De ligger utenfor `dist/` og brukes ikke automatisk av det statiske oppsettet; siden bruker tekstlogo og inline SVG-favicon.

Rekorder lagres separat per hage/modus i nettleseren under `klippekaos-p04`; innstillinger under `klippekaos-settings`. P03-data overskrives ikke. Rekorder følger ikke automatisk med til en annen nettleser eller adresse. Tap ved katt gir ingen rekordlagring.
