# P06.3 + mower progression foundation – implementert status

P06 viderefører P05.1 i samme statiske Canvas-spill. Grunnfysikk, baneformatet 900×580, kollisjonsmodell, scoring og fullføringskravet på 99,5 % videreføres. Ingen backend eller økonomi. Lokale klipperprofiler er tilgjengelige via Art QA; vanlig spill starter med standardklipperen.

## Karriere

Hvert nivå har eksplisitte mekanikkflagg. De tre testhagene er separate fra karrieren og beholder sine kombinasjoner av mekanikker.

| Nivå | Ny utfordring | Geometri og miljø |
|---|---|---|
| 1 – Den lille hagen | Vanlig plen og faste hindringer | Rektangel, terrasse, potter og hekk |
| 2 – L-hagen | Tungt gress | L-form med hekk, terrasse og parasoll i innhakket |
| 3 – Kurvehagen | Katt | Organisk plen, busker, terrasse og parasoll |
| 4 – Blomsterhagen | Markblomster som skal skånes | Egen åpen åttekant, to blomsterøyer og kantdekor |
| 5 – Sommerhagen | Skjulte jordvepsbol | Egen større, åpen sekskant, basseng, terrasse og parasoll |

Nivå 1 har ingen katt, veps, markblomster eller tungt gress. Nivå 2–5 aktiverer bare den nye terreng-/faretypen i tabellen; de kombinerer ikke alle tidligere utfordringer. Pickups, skjult energifunn og plenskade ved stillstand er deaktivert i karrieren. Boost er fortsatt tilgjengelig. Miljødekor utenfor plenen påvirker ikke kollisjon, coverage eller scoring.

Fullført, opplåst karrierenivå i normalmodus åpner neste nivå, maksimalt nivå 5. Tap og Tidspress låser ikke opp nivåer. Valgt nivå og låste valg vises i menyen; resultatkortet tilbyr neste nivå etter fullføring.

## Terreng og farer

- Tungt, uklippet gress gir opptil **25 % lavere fart**. Belastningen måles foran aggregatet; styreresponsen er beholdt. Ferdigklippet gress bremser ikke.
- Markblomster er kjørbare, men skal skånes. De inngår ikke i nødvendig plenareal; skade telles én gang per celle og gir opptil 180 poeng i trekk. Små bier er dekor.
- Kattetreff gir umiddelbart game over, uten automatisk bremsing eller unnamanøver. Første ankomst er ved 18 sekunder; etter passeringen følger 13,5 sekunders pause før neste 1,5-sekunders varsel. Variant, fart og rute beholdes gjennom runden. Kontrollen av relativ bevegelse mellom fysikksteg er beholdt.
- Katt og jordveps deler en enkel faresperre: én dynamisk fare om gangen, inkludert kattens varsling. Etter avsluttet fare er det minst tre sekunders mellomrom. En utsatt katt beholder 1,5 sekunders forvarsel.
- Jordveps kommer fra 2–4 skjulte, seedede bol per relevant runde/nivå. Aggregatets passering gjennom uklippet gress utløser bolet én gang; tid alene utløser ingen hendelse. Bol venter i kø ved katt eller aktiv sverm. Maks fire hendelser, 0,9 sekunders varsel, seks sekunders pause mellom svermer og 200 poeng per stikk / 400 samlet. Plassering holder minst 56 verdensenheter fra kanter/hindringer, 110 fra start og 130 mellom bol, og unngår blomster.

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
- Holdt mus overtar kjøre-/styreaksene; tastaturets kjøretaster avslutter museholdet. Ellers videreføres keyboard/touch/gamepad-prioriteten og kombinerbare boosts. HUD-klikk og touch starter ikke musestyring. Høyreknappen er utvidet med revers i P06.2.
- Fysikk, fixed timestep, coverage, farer, scoring, nivå-ID-er og profile/localStorage-format er uendret fra P05.1.

### P06-validering

**97/97 tester**: 80 tidligere regresjoner og 17 nye tester for transformasjoner, musestyring, inputlivssyklus, prioritet og skillet mellom rendering/dekor og modell. Build og `git diff --check` består. Nettleser-QA omfatter 1440×900, 1280×720, 1024×768, 844×390, portrait/rotasjon og pause/resultat, uten registrerte konsollfeil. En 180-sekunders automatisert museinputkjøring ga null kollisjoner; oppbremsing fra toppfart tok omtrent 0,59 sekunder etter release.

Prosjekteier har deretter fysisk testet P06 med mus, vurdert styringen som veldig bra og godkjent P06 for release. De øvrige maskinvarekontrollene nevnt over er fortsatt relevante.

## P06.1 – plen, klippestriper og klipper

- Seedet, cached plen med naturlig variasjon i uklippet gress, tett kortgresstekstur og tydelig lengre/tettere tungt gress. Markblomster forblir lesbare. Organiske kantdetaljer påvirker bare den visuelle masken.
- render/stripes.js lagrer første klipperetning per 6×6 verdensenheter (58 200 byte). Nye gameplay-celler får subtil kontinuerlig lysrefleksjon; overlapp mørkner ikke plenen. Bufferen brukes ikke av coverage eller scoring.
- render/particles.js gir korte gresspartikler bare ved nytt gress: maks 80 på desktop, 32 ved touch og ingen med redusert bevegelse. Egen tilfeldig sekvens påvirker ikke spillhendelser.
- render/mower.js tegner en kompakt gul/oransje klipper med fire hjul, motor og kontaktskygge. Lys kommer fra øvre venstre. En senere transparent sprite kan bruke samme 48×48 visuelle ramme uten å endre hitbox eller klipperadius; ingen fører er lagt til.
- Gress-cache oppgraderes ved behov i halve oppløsningstrinn til maks faktor 2, med bevart klippemaske/retning og ingen konstant rebuild. De fire gresslagrene bruker maksimalt 5 220 000 piksler. P06s DPR- og pikselgrense for skjermcanvas er beholdt.
- **109/109 tester** (97 eksisterende + 12 P06.1), build og diffkontroll består. Nettleser-QA dekker parallelle/motsatte/kryssende spor, U-sving, hindring, overlapp, tungt gress og blomster ved desktop/laptop/tablet/mobil-størrelser og DPR 1–2; ingen registrerte konsollfeil. Rundt 60 FPS i testnettleseren er ikke en måling av fysisk mobilmaskinvare.

Prosjekteier har visuelt godkjent P06.1 mot designreferansen. Fysikk, styring, farer, scoring, blomsterregler, nivågeometri og lagring er uendret. Miljøgrafikken er videreført i P06.2 nedenfor. Fysisk mobil/iPad-kontroll av skarphet og ytelse gjenstår.

## P06.2 – environment art, sprite og kontroller

- Konsistent Canvas-miljøsett med tre foliage-varianter, separate stammer/kroner, busker, hekk, gjerde, mur, huskant, terrasse, møbler, parasoll, potter/bed, basseng, trampoline og heller. Karriere 1–5 har egne miljøprofiler; collider- og nivågeometri er uendret.
- Foreground sprites caches og kan henge over klippbar plen. Opasitet faller gradvis til 35 % nær klipper, person eller aktiv katt/veps; solide stammer beholdes.
- Tier 1-visual: public/art/mowers/mower-01-push.png (1254×1254). Aggregat-anchor (625, 890), skala 0,105, rotasjon game.angle − π/2. Person/håndtak/klipper roteres samlet; ingen personcollider eller ekstra PNG-skygge. Metadata beskriver dimensjoner og anchor; eksisterende Canvas-grafikk er fallback. Ingen shop eller nye klipperstatistikker.
- Kompakt touch-landscape bruker 34 px HUD uten safe-area-tillegg, joystick på 92 px og knapper på minst 44 px. Kontrollene ligger over ytterområdene; visualViewport begrenser spillehøyden og dialogene. Sceneareal ved 844×390 økte omtrent 56 %, ved 844×300 omtrent 89 %, uten endret aspect ratio.
- Venstre musehold kjører fremover; høyre rygger bakenden mot pekeren. Ønsket chassis-heading ved revers er pekerretning + π, med invertert steering for eksisterende negativ-fart-kinematikk. Siste trykte knapp overtar. Release/cancel/lost capture/blur/pause rydder musegass.
- Aktiv scene undertrykker contextmenu, høyre auxclick, native drag og markering. Avslutningen av samme høyreklikkssekvens beskyttes i opptil 500 ms etter slipp; nytt trykk nullstiller dette. Vanlige høyreklikk i HUD/meny/dialoger beholdes.
- **141/141 tester**, build og diffkontroll består. Nettleser-QA omfatter desktop/laptop, mobil landscape ned til 260 px effektiv høyde, safe areas, sprite/rotasjon, foreground-fade, pause/restart og event-kansellering, uten registrerte konsollfeil. Prosjekteier har fysisk godkjent høyreknapp-revers og samlet release.
- Gjenstående maskinvare-QA: iPhone/iPad multitouch, Safari-chrome/rotasjon, lav skjermhøyde og ytelse. Personen er et statisk bilde og kan visuelt overlappe faste objekter ved tett manøvrering; dette endrer ikke kollisjon.

## Klipperprofiler og lokal art-integrasjon

| Profil | Fart | Klippebredde | Styring |
|---|---:|---:|---:|
| Standard skyveklipper | 1,00 | 1,00 | 1,00 |
| Gul skyveklipper | 1,04 | 1,03 | 1,00 |
| Premium skyveklipper | 1,10 | 1,08 | 1,02 |
| Kompakt sitteklipper | 1,18 | 1,18 | 0,98 |
| Hagetraktor | 1,24 | 1,26 | 0,96 |
| Zero-turn | 1,30 | 1,32 | 1,08 |

Klippe-radius er 23 × breddefaktor, uavhengig av kollisjonsradius 14. Fartsmultiplikatoren gjelder frem og revers; akselerasjon, input, scoring, 99,5 %-krav, Ferdig nå, progresjon og lagringsformat videreføres. Art QA bytter profil og utseende samlet uten å nullstille runden.

Sitteklippernes world-scale er økt 10/14/16 %. Separate rider-overlays har kildepikselbaserte anchors, grep, diskret bevegelse og visuell forkorting av underkroppen. Godkjent mapping følger motivet: `mower-05-zero-turn-yellow.png` brukes av hagetraktor med `rider-04-ride-tractor.png`; `mower-04-ride-tractor-yellow.png` brukes av zero-turn med `rider-05-zero-turn.png`. Filnavn og PNG-er er urørt. Tre skyveklippere bruker den eksisterende gåsyklusen; Canvas-klipper er fallback.

Ni lokale environment-assets dekker trær, busker, hekk, potte, stol, parasoll og steinbed. Metadata bestemmer utsnitt, størrelse og variasjon; cache oppdateres når bilder lastes. Foreground-fade omfatter også rider. Banegeometri og solide hindringer er uendret.

Art QA (`npm run art:qa`, port 4191) viser profil, seed, bol/hendelser og valgfrie bolmarkører, samt kjøre-, canopy- og rider-testscener. Det injiseres bare av lokal QA-server, ikke produksjonsbygget.

**180/180 tester**, build og diffkontroll består. Nettleser-QA ved 1440×900, 1280×720 og 844×390 viste ingen sidescroll eller konsollfeil; rider-plassering, varsler, bolutløsning og mobilpause er kontrollert. Bredeste aggregat når 99,81279150460759 % i geometrisk blomstersikker test uten skade. Prosjekteier har fysisk godkjent klipperprofiler, større sitteklippere, gjentakende katt, skjulte bol og Art QA. Fysisk Safari/iPad-ytelse og multitouch er fortsatt relevante maskinvarekontroller.
