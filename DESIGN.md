# Prototype 03 – endringer og videre retning

## Hva som er implementert

Prototype 02 er videreført, med samme grunnfart, akselerasjon, bremsing, normal svingradius og kjøretøystyring. Klipperen kan fortsatt kjøre utenfor gresset, med en hard yttergrense på belegget. Coverage-grid, visuell maske, overlapp, 99,5 %-grense, restmarkering, begge boostere, pickups, Tidspress, veps, lyd, partikler og gamepad er beholdt.

1. **Startmeny:** Karriere åpner originalhagen. Tidspress bruker den valgte hagen. Testhage 2 åpner den ekstra testbanen. «Karriere» er en inngang til dagens vanlige fullføringsmodus, ikke et progresjonssystem. Veiledningen viser tastene i seks kompakte felt. Innstillinger gir lyd av/på, volum og redusert bevegelse. De to ønskede lenkene finnes diskret i startmenyen.
2. **Eksplisitt plenskade:** Nesten stillestående klipper over plen får et varsel etter 1,8 s og en brun flekk etter 3,6 s. Klipperen må være i et påbegynt forsøk. Fart på minst 6 enheter/s eller mer enn 8 enheters bevegelse fra ankeret nullstiller oppbyggingen. Kollisjonskontakt og sikkerhetsstopp holder skade tilbake, med 1,2 s beskyttelse etterpå. Pause/meny stopper aggregatet. Samme flekk kan ikke gi gjentatt skade; en ny flekk må ligge minst 24 enheter unna. Brun flekk har radius 12. Skade endrer ikke dekningen og kan ikke stoppe fullføring.
3. **Rettede klippestriper:** P02 hadde ikke beregnet plenskade. Retningsfargen kunne bygges opp ved overlappende tegnesteg. Nå farges hver logisk celle én gang ved førstegangsklipping. Brune skader er dermed en egen mekanikk, ikke en tilfeldig tegningsartefakt.
4. **Boostfeedback:** Tydelig AKTIV/KLAR/TOM-status, opplyst måler og ring rundt klipperen. De to boosterne har ulik subtil kontinuerlig tone. Pickups gir kort klang og ring. Startklipperens kapasitet og fysikk er uendret; kapasiteten ligger også i en enkel klipperkonfigurasjon for senere variasjon.
5. **Resultat og replay:** Score, rang, råverdier, alle straffer, tydelige rekordmerker og topp fem vises samlet. «Prøv igjen» og «Meny» er synlige. Rekordene holdes separat per hage/modus. «NY BESTE TID» gjelder bare faktisk fullført plen; en delvis Tidspress-runde skal ikke bli raskeste fullføring. Lik verdi utløser ikke ny rekord.
6. **L-formet Testhage 2:** Samme overflate og mekanikk, men plenpolygonet har et stort innhakk. Bed og én pickup er flyttet inn på gresset. Det avskårne området er kjørbart belegg og teller ikke som gress. Begge hager kan spilles i de eksisterende to modusene.
7. **Én positiv overraskelse:** En liten energireserve under gresset, på fast plass. Avsløres ved klipping og fyller inntil 0,6 s i begge målere én gang. Ved fulle målere ligger den igjen synlig til den kan brukes. Ingen penger eller inventory.
8. **Én katt:** Varsel ved 16,5 s, kryssing fra 18 s, fart 180 enheter/s. Katten tar en liten omvei rundt en klipper nær ruten. Ved fare innen 88 enheter stopper klipperen automatisk, aggregatet beskyttes og boostenergi spares. Katten fortsetter. Ett sikkerhetsstopp kan telles per kryssing. Ingen skade på dyr, helse eller combat.
9. **Klippefølelse:** Eksisterende lyd er videreført med litt dempet klippestøy og en visuell aggregatvibrasjon på opptil 0,4 enheter når nytt gress klippes. Bevegelsen påvirker bare tegningen, aldri kjørefysikken. Milepæler og fullføringsklang er beholdt, med en kort innblending av resultatkortet. Ingen konfetti eller skjermristing.

## Fysikk og boost

| Verdi | Prototype 03 |
|---|---:|
| Toppfart frem / revers | 112 / 53 enheter/s |
| Akselerasjon | 155 enheter/s² |
| Brems ved retningsbytte | 290 enheter/s² |
| Brems uten gass | 195 enheter/s² |
| Akselavstand / maks styrevinkel | 32 / 0,62 rad |
| Normal svingradius | ca. 44,8 enheter |
| Klippebredde / gridcelle | 46 / 2 × 2 enheter |
| Fartsboost | ×1,65, maks 184,8 frem / 87,45 revers |
| Boostakselerasjon | 240 enheter/s² |
| Manøverboost | ×1,85 krumning, radius ca. 24,2 |
| Energi ved start / kapasitet | 2,5 / 3,0 s per boost |
| Fast pickup / skjult reserve | inntil 1,2 s i én / 0,6 s i begge |
| Fysikksteg | 1/120 s |

Energien brukes bare mens knappen holdes inne under kjøring. Meny, pause, vanlig stillstand og sikkerhetsstopp bruker ikke energi. Ingen automatisk opplading. Grunnfysikken er uendret fra P02.

## Scoreformel

La C være dekningsandelen (0–1), O overlappsandelen og t brukt tid i sekunder. Ved faktisk dekning på minst 0,995 brukes C = 1 i resultatet.

- Full plen: grunnpoeng = C × [8 500 + 1 500 × clamp((T − t)/(T − 60), 0, 1)]. T er 240 s i originalhagen og 200 s i den mindre L-hagen.
- Tidspress: grunnpoeng = C × 10 000. Klokken stopper nøyaktig på 60 s, eller tidligere ved full dekning.
- Overlapp: trekk 1 500 × O.
- Kollisjoner: trekk 25 per tydelig treff, maks 250.
- Plenskade: trekk 60 per flekk, maks 300.
- Vepsestikk: trekk 200, én gang. Redusert fra P02s 600 slik at hendelsen ikke dominerer.
- Kattens sikkerhetsstopp: trekk 40 per stopp, maks 120; dagens ene kryssing kan gi høyst ett.

Grunnpoeng og overlappstrekk avrundes til heltall før summering. Totalscore har nedre grense 0. Boostbruk gir ingen egen bonus eller straff. Rang: S ≥ 9 000, A ≥ 7 500, B ≥ 5 500, C ≥ 3 500, ellers D. Alle bidrag vises under «Slik ble poengene regnet» i resultatet. Råverdiene vises alltid.

## Testing og gjenstående vurdering

Automatiske tester dekker uendret kjøring, kollisjoner, boostenergi, pickups, fullføringsgrense, begge masker, skadevarsling og unntak, skjult reserve, katteavstand/sikkerhetsstopp, veps, score, rekordgrenser og gamepad-mapping. En geometrisk prøve av lovlige klipperposisjoner når 100 % av begge plenmasker. Dette er ikke det samme som å bevise at siste rest er lett for et menneske.

Nettleseren er brukt til startmeny, veiledning, L-hage, tastaturstart og en ekte 60-sekunders Tidspress-avslutning med plenskade, rådata og rekordmerker. Lydinnstillinger og redusert bevegelse ble også kontrollert etter omlasting. Totalt består 39 automatiske tester. Den visuelle testen fant og rettet at tegningen først var koblet til menyens forhåndsvisningscanvas i stedet for spillcanvaset.

Lydopplevelse og fysisk gamepad er ikke verifisert med maskinvare. En full menneskelig klipperunde er ikke gjennomspilt her. Viktigste manuelle spørsmål: Er 3,6 s før skade romslig nok? Er sidehendelsene tydelige og rettferdige? Gir L-hagen interessante sporvalg? Er rangene motiverende? Er boostlydene behagelige over flere runder?

## Framtidig retning – dokumentert, ikke bygget

- **Karriere:** Fra liten hage via nabolag, villaer, gårder/landsteder, herskapshus og gods til slottshager. Ingen slik progresjon er implementert.
- **Klippere som valg:** Bred klipper for flater, kompakt for hjørner, zero-turn for svinging og rask klipper med større presisjonskrav. Senere klippere skal ha avveininger, ikke bare høyere tall. Enkel konfigurasjon av boostkapasitet finnes; øvrige kjøretøyvarianter venter.
- **Framtidige moduser:** Effektivitet, Klippekaos/stress og Zen er bare ideer. Dagens spill har fortsatt full plen og Tidspress.
- **Touch:** Tastatur og gamepad leverer samme kommandoobjekt til fysikken. En senere virtuell joystick og touchknapper kan legges til som en ny inputadapter. Responsive elementer finnes, men touchkontroller, landscape/fullscreen-flyt, PWA og app-store-versjon er ikke implementert.
- **Utelatt med vilje:** Økonomi, shop, coins/XP, mange nivåer/dyr/boostere, kontoer, backend, online leaderboard, achievements, streaks, inventory, ferdig spritebibliotek og eget domene. Dette ville overskride Prototype 03. GitHub-push og offentlig Vercel-publisering er heller ikke utført; prosjektpakken er klar for neste steg.

Ingen Prototype 04 er påbegynt. Neste beslutning bør tas etter manuell testing av denne versjonen.

