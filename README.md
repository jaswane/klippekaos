# Klippekaos – Prototype 03

Klippekaos er et lite plenklippespill sett ovenfra, laget med HTML, CSS og Canvas/JavaScript. Klipp hagen, bruk boost og prøv å slå dine egne rekorder. Dette er **Prototype 03**, et spillprosjekt fra Swane Creative.

## Kjør lokalt

Du trenger Node.js 20 eller nyere. Prosjektet har ingen eksterne pakkeavhengigheter.

```sh
npm run dev
```

Åpne http://127.0.0.1:4173 i nettleseren.

W/S eller piltastene kjører frem og rygger. A/D eller venstre/høyre svinger. Shift gir fartsboost, E/Space gir manøverboost, og Esc pauser.

## Test og bygg

```sh
npm test
npm run build
```

Testene dekker spillmekanikk fra Prototype 01–03. Byggkommandoen validerer JavaScript og lokale HTML-ressurser. Spillfilene i `dist/` er ferdige statiske filer og redigeres direkte.

## Deploy til Vercel

Importer GitHub-repoet i Vercel. `vercel.json` angir byggkommandoen `npm run build` og output-mappen `dist`. Bruk repoets rot som Root Directory. Ingen backend, database eller miljøvariabler kreves.

Rekorder og innstillinger lagres lokalt i nettleseren og følger ikke automatisk med til en ny adresse.

## Prosjektstruktur

- `dist/`: spillets HTML, CSS og JavaScript.
- `scripts/`: lokal server, byggvalidering og testkjøring.
- `tests/`: tester for Prototype 01–03.
- `DESIGN.md`: medfølgende designdokumentasjon.
- `vercel.json`: konfigurasjon for Vercel.
