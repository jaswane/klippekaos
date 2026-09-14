# Prototype 06 – implementert status

P06 viderefører P05.1 i samme statiske Canvas-spill. Grunnfysikk, baneformatet 900×580, kollisjonsmodell, scoring og fullføringskravet på 99,5 % videreføres. Ingen backend, økonomi eller nye klippere.

## Karriere

Hvert nivå har eksplisitte mekanikkflagg. De tre testhagene er separate fra karrieren og beholder sine kombinasjoner av mekanikker.

| Nivå | Ny utfordring | Geometri og miljø |
|---|---|---|
| 1 – Den lille hagen | Vanlig plen og faste hindringer | Rektangel, terrasse, potter og hekk |
| 2 – L-hagen | Tungt gress | L-form med hekk, terrasse og parasoll i innhakket |
| 3 – Kurvehagen | Katt | Organisk plen, busker, terrasse og parasoll |
| 4 – Blomsterhagen | Markblomster som skal skånes | Egen åpen åttekant, to blomsterøyer og kantdekor |
| 5 – Sommerhagen | Gjentakende jordveps | Egen større, åpen sekskant, basseng, terrasse og parasoll |

Nivå 1 har ingen katt, veps, markblomster eller tungt gress. Nivå 2–5 aktiverer bare den nye terreng-/faretypen i tabellen; de kombinerer ikke alle tidligere utfordringer. Pickups, skjult energifunn og plenskade ved stillstand er deaktivert i karrieren. Boost er fortsatt tilgjengelig. Miljødekor utenfor plenen påvirker ikke kollisjon, coverage eller scoring.

Fullført, opplåst karrierenivå i normalmodus åpner neste nivå, maksimalt nivå 5. Tap og Tidspress låser ikke opp nivåer. Valgt nivå og låste valg vises i menyen; resultatkortet tilbyr neste nivå etter fullføring.

## Terreng og farer

- Tungt, uklippet gress gir opptil **25 % lavere fart**. Belastningen måles foran aggregatet; styreresponsen er beholdt. Ferdigklippet gress bremser ikke.
- Markblomster er kjørbare, men skal skånes. De inngår ikke i nødvendig plenareal; skade telles én gang per celle og gir opptil 180 poeng i trekk. Små bier er dekor.
- Kattetreff gir umiddelbart game over, uten automatisk bremsing eller unnamanøver. Den eksisterende kontrollen av relativ bevegelse mellom fysikksteg er beholdt.
- Katt og jordveps deler en enkel faresperre: én dynamisk fare om gangen, inkludert kattens varsling. Etter avsluttet fare er det minst tre sekunders mellomrom. En utsatt katt beholder 1,5 sekunders forvarsel.
- Jordveps bruker tilfeldige gyldige steder utenfor klipperen: første hendelse etter 12–18 sekunder, deretter 18–26 sekunders cooldown. Varsling før forfølgelse er fortsatt 0,9 sekunder. Maks samlet vepsestraff er 400 poeng.

## Presentasjon og lagring

«KlippeKaos – Gressklipperspillet» profileres som et gratis nettspill. PNG-logo på forsiden og kvadratisk ikon i spillheaderen. HUD og sidebakgrunn beholder den mørkegrønne paletten; selve scenen har nivåspesifikk bakke og dekor. Pickupgrafikken er 30 % større med tydeligere kant; pickup-radius er uendret.

Små transparente varsler øverst viser «PASS PÅ KATTEN!» og «JORDVEPS!» i hvitt med mørk skygge. «HALVVEIS!» erstatter 50 %-meldingen med samme 1,8 sekunders varighet. Øvrig fremdriftslogikk er uendret.

Topp fem lagres separat per bane/modus med nøyaktig tre initialer (A–Z/0–9). Profilen og nivåopplåsingen bruker `klippekaos-p05`; P04-data forblir urørt. Uten tilgjengelig lagring beholdes data bare i økten. Resultatkortet tilpasses visual viewport når skjermtastaturet reduserer høyden.

Touchdeteksjon, hybrid-desktop, portrait-pause, rotasjonsvarsel og safe areas videreføres. Dialoger/resultatkort kan scrolles på lave skjermer.

«Om & støtte» bruker eksisterende dialogsystem fra hovedmeny og pause: kontakt@swanecreative.no, Vipps #63338 og støttelenke i ny fane. `public/vippsqr.png` er byte-identisk med originalen på swanecreative.no/stott (SHA-256 `cef2e22b891830eb9182d3665a5370763c04076f8b01c2fe3d9fc5b8574c6e2a`). QR vises diskret på større skjermer og skjules ved lav skjermhøyde.

## Tidligere QA (P05)

- **72/72 automatiske tester**: P01–P04-regresjoner og 14 P05-tester for mekanikkflagg, geometri, farekoordinering, tungt gress, initialer, lagring og opplåsing. Eldre katterutetester isolerer veps; samlet koordinering testes i P05.
- Build og `git diff --check` består.
- Blomsterhagen: **61 815 / 61 963 = 99,76114778174072 %**, null markblomstskade. Testhage 3: **58 386 / 58 480 = 99,83926128590971 %**, null markblomstskade. Fullføringskravet er ikke senket.
- Nettleser-QA: desktop 1440×900, laptop 1280×720, tablet landscape/portrait og mobil landscape/portrait. Kontroller inkluderer nivåmiljøer, HUD, farer, initialfelt, pause/resultat, rotasjon, simulerte safe areas og støtte-dialog. Bakgrunnen er kontrollert ved 1100, 1024 og begge sider av 901 px. Ingen observerte konsollfeil.
- «Halveis!» er utløst gjennom faktisk klipping med automatiserte tastaturinput. Posisjon, tid og coverage er kontrollert uendret gjennom støtte-dialog og tilbake til pause.

Gjenstående fysisk QA: iPhone/iPad multitouch og virtuelt tastatur, safe areas/rotasjon i Safari, lyd/gamepad, QR-skanning og menneskelig reaksjon/fullføring rundt farer og markblomster. Emulering og geometriske tester beviser ikke spillkomfort på maskinvare.

## P05.1 – game feel

- Alle hendelsesvarsler er hvite og transparente, 28 px på desktop og 20 px på mobil/lave skjermer. «HALVVEIS!» beholder 1,8 sekunders varighet.
- Live POENG bruker samme `Game.result()` som sluttscoren.
- Beige Blender, grå og svart/hvit katt velges fra rundens seed. Varianten er stabil gjennom runden; hitbox, fart og ruter er like. Blender varsles med «PASS DEG FOR BLENDER!».
- Karriere tilbyr «Ferdig nå» fra 95 % til 99,5 %. Trekk: `max(0, round((99.5 - dekning_i_prosent) * 200))`. Faktisk dekning og trekket vises i resultatet; nivået fullføres og neste nivå kan låses opp. Tidspress og testhagene får ikke knappen. Normal automatisk fullføring er uendret.
- Eksisterende halvveis-/kattlyd har egne korte toner; jordveps har fått syntetisk buzz. Én lyd per hendelse, via eksisterende AudioContext og lydinnstillinger.
- 80/80 tester, build og diffkontroll består. Desktop/laptop/mobil landscape er kontrollert i nettleser, inkludert 95/97/99 % og normal fullføring. Fysisk lydnivå og touchfølelse gjenstår.

## P06 – visual foundation og musestyring

- `render/viewport.js` har én world↔screen-transformasjon med proporsjonal contain-fit og plass til HUD/touchkontroller. Overskytende areal viser miljø, ikke beskåret plen. Canvas-oppløsningen begrenses til DPR 2 og fire millioner piksler.
- `render/scene.js`, `lawn.js`, `actors.js` og `assets.js` skiller cached miljø, klippestatus, dynamiske aktører og enkel Canvas-grafikk. `scene-data.js` beskriver terrasse, potter, hekk, tre/parasoll og basseng med anchors, skalering og lag. Hindringsgrafikk refererer eksisterende collidere; dekor lager ingen kollisjon eller coverage.
- Tegnerekkefølge: bakgrunn → cached dekor → plen/klippestatus → bakkehindringer → aktører → foreground → partikler → DOM-HUD. Foreground-transparency varierer ned til 35 % opasitet nær klipper, aktiv katt eller veps.
- `render/scene.css` legger ikon/nivå og KLIPPET/TID/POENG/OVERLAPP over scenen. Boost, pause, Ferdig nå, touch og eksisterende dialoger beholdes.
- `mouse-input.js` bruker venstre musehold, viewportens inverse transformasjon og korteste vinkelfeil til vanlig throttle/steering. Ingen direkte posisjons-/vinkelendring. Authority faller lineært fra 1,00 ved 40 verdensenheter til 0,55 ved 280; grunnstyringen mettes ved 60°. Vinkeldødsone 0,025 rad; avstandsdemping fra 8 til 18 enheter. Release/cancel/blur avslutter museinput, med eksisterende oppbremsing.
- Holdt mus overtar kjøre-/styreaksene; tastaturets kjøretaster avslutter museholdet. Ellers videreføres keyboard/touch/gamepad-prioriteten og kombinerbare boosts. HUD-klikk, høyreknapp og touch starter ikke musestyring.
- Fysikk, fixed timestep, coverage, farer, scoring, nivå-ID-er og profile/localStorage-format er uendret fra P05.1. Nytt gress, striper og endelig artkit til P06.1 er ikke implementert.

### P06-validering

**97/97 tester**: 80 tidligere regresjoner og 17 nye tester for transformasjoner, musestyring, inputlivssyklus, prioritet og skillet mellom rendering/dekor og modell. Build og `git diff --check` består. Nettleser-QA omfatter 1440×900, 1280×720, 1024×768, 844×390, portrait/rotasjon og pause/resultat, uten registrerte konsollfeil. En 180-sekunders automatisert museinputkjøring ga null kollisjoner; oppbremsing fra toppfart tok omtrent 0,59 sekunder etter release.

Prosjekteier har deretter fysisk testet P06 med mus, vurdert styringen som veldig bra og godkjent P06 for release. De øvrige maskinvarekontrollene nevnt over er fortsatt relevante.
