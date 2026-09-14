# Prototype 04 – implementert status

KlippeKaos – Gressklipperspillet viderefører Prototype 03 i samme statiske kodebase. Ingen backend, full karriere eller økonomi er bygget. «Karriere» er fortsatt inngangen til vanlig fullføringsmodus.

## Beholdt grunnlag

Grunnstyring, akselerasjon, bremsing, normal svingradius, kjøring utenfor plenkanten, harde yttergrenser, objektkollisjoner, coverage-grid, separat visuell klippemask, overlapp og 99,5 % fullføringsgrense er beholdt. Originalhagen og L-hagen, restmarkering, plenskade, boosts, pickups, skjult energireserve, lyd, gamepad, pause og lokale rekorder er videreført.

| Grunnparameter | Verdi |
|---|---:|
| Frem / revers | 112 / 53 enheter/s |
| Akselerasjon / retningsbrems / frirulling | 155 / 290 / 195 enheter/s² |
| Akselavstand / maks styrevinkel | 32 / 0,62 rad |
| Klippebredde / gridcelle | 46 / 2 × 2 enheter |
| Fartsboost / manøverboost | ×1,65 fart / ×1,85 krumning |
| Boostenergi ved start / kapasitet | 2,5 / 3,0 s per boost |
| Fysikksteg | 1/120 s |

Plenskade varsles etter 1,8 s nesten stillstand og oppstår etter 3,6 s. Kollisjonskontakt gir kort beskyttelse mot slik skade. Den tidligere katt-assistenten og sikkerhetsstoppen er fjernet.

## P04-innhold

- **Branding:** «KlippeKaos – Gressklipperspillet» i title og metadata, med «Gressklipperspillet» som sekundær undertittel. Plenen.no og Swane Creative ligger i startmenyen.
- **Tidspress:** Klipp mest mulig på 60 sekunder; delvis dekning er gyldig. Runden kan slutte tidligere ved fullført plen eller kattetreff. Resultatkortet fremhever dekning og tid, med egne rekorder per hage/modus.
- **Kurvehagen:** Én ny organisk plen, beskrevet av et polygon med 96 punkter. Området utenfor plenen er fortsatt kjørbart.
- **Tungt gress:** Et mørkere felt i Kurvehagen. Uklippet tungt gress foran aggregatet gir opptil 22 % lavere målfart og tyngre motorlyd. Én bevegelig passering klipper normalt; ferdigklippet område gir ikke terrengbrems. `heavyHandling` i klipperkonfigurasjonen kan brukes senere. Ingen nye klippere er laget.
- **Blomster:** Sparsomme små ugressblomster klippes normalt uten straff. Kurvehagens markblomstfelt er kjørbart, men skal skånes. Det er utelatt fra nødvendig plenareal. Hver skadet celle telles bare én gang. Biene rundt feltet er rent dekorative.
- **Katt:** Enkel løpeanimasjon og fire ruter: venstre–høyre, høyre–venstre, topp–bunn og diagonal. Varsel ved 16,5 s, kryssing fra 18 s, fart 180 enheter/s. Samlet kollisjonsradius er 30 enheter, og relativ bevegelse mellom fysikksteg kontrolleres. Treff gir umiddelbart tap, fryser forsøket og viser restart/meny. Ingen automatisk bremsing, unnamanøver eller rekordlagring ved tap.
- **Jordveps:** Tilfeldige, seed-styrte plasseringer; første hendelse etter 12–18 s påbegynt spill, deretter 18–26 s cooldown etter avsluttet hendelse. Én sverm om gangen. Plasseringen må ligge på gyldig plen, 90–240 enheter fra klipperen og minst 80 fra tidligere spawnsteder. Inntil 80 kandidater prøves; ved manglende plass prøves igjen etter 3 s. Svermen varsler i 0,9 s før forfølgelse med fart 82, og varer høyst 4,5 s eller til stikk. Dette erstatter P03s faste bol og engangshendelse.

Hendelser bruker runde-seed. Katteruten kan også velges eksplisitt med `catRoute` i `Game`-konstruktørens fjerde argument. Vanlige runder får ny seed ved restart; testsuitene bruker faste seeds. Dette er grunnlag for reproduksjon, ikke et ferdig konkurransesystem.

## Touch og presentasjon

`dist/input.js` leverer samme throttle/steering/boost-kommandoer som tastatur og gamepad. Pointer-ID-er holdes adskilt for multitouch. Input tømmes ved pause, restart, fokus-/synlighetstap og relevant rotasjon.

Touchoppsett aktiveres ved grov peker, touchkapasitet uten hover eller faktisk berøring. En hybrid-desktop med mus/hover får derfor ikke store touchkontroller bare fordi `maxTouchPoints` er positiv. Kontrollene er skjult i HTML fra start; det finnes ingen hydration-fase.

Touch uten hover i portrait viser «Snu enheten». Bakgrunnen blir inert og låst mot scrolling. Åpne dialoger lukkes, og en pågående runde pauser. Landscape fjerner rotasjonsvarslet; spilleren fortsetter fra pause. HUD og kontroller bruker tilgjengelig skjermplass og safe-area-insets. Resultat/dialoger kan scrolles; resultatkortet åpner øverst med overskriften synlig. Fullskjerm brukes bare der nettleseren støtter det.

Feedback er større og kortvarig, med uttoning. Katten har kropp-/hale-/løpebevegelse. Plenen har små fargevariasjoner og blomster; ingen ny art pipeline eller klipperdesign er innført.

## Score og lagring

Grunnpoeng: full plen bruker C × [8 500 + 1 500 × clamp((T − t)/(T − 60), 0, 1)], der T er 240/200/210 s for hage 1/2/3. Tidspress bruker C × 10 000. Ved minst 99,5 % dekning brukes C = 1.

Trekk: overlapp 1 500 × andelen; objektkollisjon 25 per treff, maks 250; plenskade 60 per flekk, maks 300; veps 200 per stikk, maks 400 totalt; markblomster 180 × skadet andel, maks 180. Tungt gress gir ikke trekk. Kattetreff er tap, ikke poengstraff. Totalscore er minst 0. Grunnpoeng og beregnede andelstrekk avrundes til heltall. Rang: S ≥ 9 000, A ≥ 7 500, B ≥ 5 500, C ≥ 3 500, ellers D.

Resultatkortet viser relevante råverdier og poengforklaring, med nullhendelser skjult. Topp fem og personlige rekorder lagres per hage/modus under `klippekaos-p04`; P03-nøkkelen beholdes urørt. Raskeste fullføring gjelder bare fullført plen.

## QA-status

- **58/58 automatiske tester**: P01–P03-regresjoner og 19 P04-tester. Tester som krevde gammel katt-assistanse eller fast vepsebol er oppdatert til de nye produktkravene. Build og `git diff --check` består.
- **Geometri:** Kurvehagen når 58 386 / 58 480 celler = **99,83926128590971 %**, med 0 / 1 823 markblomstceller skadet. 99,5 %-kravet er uendret. Den første testen brukte feil ellipseutvidelse; faktisk korteste avstand til ellipsegrensen erstattet denne. Detaljer finnes i testen.
- **Visuell QA:** Desktop 1440×900, laptop 1280×720, tablet 1180×820/820×1180 og mobil 390×844/844×390 med emulerte capabilities. Logo/undertittel, bane, HUD, pause, restart, katt/tap, markblomster, jordveps, score/resultat og dialoger er kontrollert. Safe areas ble simulert. Ingen observerte konsollfeil.
- **Rettelser fra QA:** Hybrid-touchdeteksjon, resultatkortets fokus/scroll, portrait-bakgrunnslås og dialoghåndtering ved rotasjon, samt ordavstand i mobilintro.
- **Løpende kjøreprøve:** Omtrent 50 s med tastaturhendelser gjennom faktisk inputadapter, uten forhåndssatt rundetilstand. To jordvepshendelser ved 12,7 og 39,9 s, totalt 400 poeng i trekk, katt uten assistanse og urørte markblomster. Gass/revers er også kontrollert gjennom pointer-handlerne.

Fysisk iPhone/iPad, samtidig styring med to tomler, lyd/gamepad på maskinvare, opplevd reaksjonstid og menneskelig fullføring av 99,5 % rundt markblomstene gjenstår. Geometrisk tilgjengelighet er ikke en bekreftelse på menneskelig spillkomfort. QA førte ikke til ny balansering.

## Senere – ikke implementert

Full karriere, økonomi/shop, oppgraderinger, ulike klippere og større boostkapasitet, flere terrengtyper/vått gress/vær, flere dyr (inkludert rotter), større markblomstfelt, stress/KlippeKaos-modus, Zen, Effektivitet, online leaderboards, konto/backend, full PWA/hjemskjerminstallasjon, eget domene og ferdig art pipeline er framtidsretning. Ingen Prototype 05 startes før manuell testing.
