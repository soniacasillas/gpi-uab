# GPI · Genòmica a la UAB

Materials docents de Genòmica, Proteòmica i Interactòmica, grau en Genètica. Presentacions Quarto/Reveal.js per revisar amb Sònia Casillas.

## Presentacions disponibles

- `t0.qmd`: presentació de l’assignatura, 2026–27.
- `t1.qmd`: tema 1, genomes nuclears eucariotes.
- `questions/t1-wooclap.md`: vuit preguntes distribuïdes i vuit de recapitulació.
- `index.qmd`: prototip del tema 3 sobre cobertura, continuïtat i repeticions.

## Prototip inicial

`index.qmd`: **Cobertura, continuïtat i repeticions** (10 diapositives; 20–25 minuts). Parteix de T3_Diapos, diapositives 7–18, i connecta amb les 23–30. Inclou les 24 longituds de contigs de la diapositiva 9 (188,1 Mb; N50=9,7 Mb; L50=8), un model de cobertura i un esquema de lectura que travessa una repetició. La fitxa docent és a `docs/pilot.md`.

## Generació i consulta

Cal [Quarto](https://quarto.org/docs/get-started/) (provat amb 1.10.18). Node.js només és necessari per als tests.

```sh
quarto render
quarto preview
node tests/models.test.cjs
```

Les sortides són `_site/t0.html`, `_site/t1.html` i `_site/index.html`, amb els seus recursos locals. Es pot copiar **tota** la carpeta `_site` a DreamHost. No cal servidor de càlcul. Les fonts enllaçades i Wooclap requereixen Internet. No s’ha desplegat a DreamHost.

Fletxes: navegar; O: vista general; S: notes docents. Els controls admeten teclat. La versió HTML conté notes i respostes docents; no és un examen segur. La interfície està pensada per projectar; cal revisar l’ús en mòbils petits abans de distribuir-la com a material principal d’estudi.

## Estructura editable

- `t0.qmd`, `t1.qmd` i `index.qmd`: discurs, activitats, notes i fonts.
- `assets/theme.css`: disseny compartit.
- `assets/data.js`: dades i procedència.
- `assets/models.js`: càlculs independents de la interfície.
- `assets/interactives.js`: gràfics i controls.
- `assets/wooclap-config.js`: punts de connexió, buits fins a disposar de preguntes reals.
- `questions/t1-wooclap.md` i `questions/wooclap.md`: preguntes i respostes per traslladar a Wooclap; no són fitxers d’importació.
- `docs/`: procedència, decisions i registre de canvis.

## Wooclap

No s’ha creat ni migrat cap sessió. Introduïu l’URL real a `assets/wooclap-config.js`; opcionalment, el `src` HTTPS del codi d’incrustació oficial a `embedUrl`. Només s’accepta `wooclap.com` o un subdomini. Els botons obren Wooclap en una altra pestanya. La integració incrustada és experimental i s’ha de validar amb el compte UAB. No inventeu codis, no publiqueu credencials i no pressuposeu sincronització de notes. La presentació no recull dades personals ni envia les interaccions dels simuladors.

## Actualització amb IA

1. Proposar el canvi i identificar l’afirmació, la font i la diapositiva afectades.
2. Modificar les dades o el contingut; registrar-ho a `docs/changes.md`.
3. Executar tests, regenerar i revisar visualment la presentació.
4. Revisió científica docent abans de donar la versió per aprovada o desplegar-la.

Els problemes setmanals continuen a Moodle i l’examen a Offline Quiz. Les guies antigues no determinen lliuraments ni rúbriques nous.

## Llicència i materials originals

Es conserva la llicència GPL-3.0 del repositori. Els PPTX/PDF originals i les figures de tercers no s’han incorporat: no es pressuposa que aquesta llicència cobreixi materials externs. Els diagrames del pilot són esquemes didàctics nous; l’exemple numèric de N50 s’atribueix al material docent. Les fonts científiques mantenen les seves llicències.
