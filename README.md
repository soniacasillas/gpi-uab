# GPI · Genòmica a la UAB

Materials docents de la part de Genòmica de l’assignatura Genòmica, Proteòmica i Interactòmica, del grau en Genètica de la UAB.

## Web publicada

La portada de GitHub Pages és <https://soniacasillas.github.io/gpi-uab/>. Des d’allà es pot accedir a la presentació de l’assignatura, els temes 1–6 i la pàgina d’actualitzacions científiques.

## Contingut

- `t0.qmd`: presentació de l’assignatura.
- `t1.qmd`–`t6.qmd`: presentacions Quarto/Reveal.js dels sis temes.
- `assets/`: disseny, dades i simulacions interactives.
- `questions/wooclap-gpi-t1-t6.xlsx`: 76 preguntes en el format d’importació de Wooclap.
- `questions/t1-wooclap.md`–`t6-wooclap.md`: banc llegible amb respostes per al professorat.
- `questions/index.qmd`: portada web del banc de preguntes.
- `actualitzacions.qmd`: registre de canvis científics i índex dels butlletins setmanals.
- `updates/`: un butlletí immutable per setmana, identificat per la data.
- `destacades.qmd`: selecció acumulativa de les actualitzacions més rellevants per a l’assignatura.
- `scripts/update_publications.py`: consulta reproductible a Europe PMC.

## Generació local

Cal [Quarto](https://quarto.org/docs/get-started/). Per generar tot el lloc:

```sh
python scripts/update_publications.py
quarto render
```

Les sortides es creen a `_site`. Les tecles de Reveal.js són: fletxes per navegar, **O** per a la vista general i **S** per a les notes docents.

## Publicació i actualització setmanal

El workflow `.github/workflows/pages.yml` publica automàticament la branca `main` a GitHub Pages. També s’executa cada dilluns a les 06:15 UTC i es pot llançar manualment des d’**Actions**. Abans de renderitzar, actualitza `data/weekly-publications.md`, crea `updates/AAAA-MM-DD.qmd`, regenera l’índex i desa aquests canvis a `main`. El missatge del commit automàtic inclou `[skip ci]` per evitar un bucle de desplegaments.

El radar automàtic és una preselecció per títol i data. Cada article rep un resum extractiu de 3–4 frases de l’abstract en anglès. Els recursos complementaris es detecten en fonts científiques de confiança mitjançant coincidència de DOI o títol, i també es poden incorporar a `data/related-resources.json`. Les actualitzacions destacades es decideixen de manera conservadora a `data/highlights.json` i s’acumulen a `data/highlighted-publications.json`; no cal que cada setmana n’hi hagi cap.

## Wooclap

L’Excel conserva l’esquema de la plantilla institucional: `Type`, `Title`, `Correct` i set columnes `Choice`. Els codis `[Tn-Qnn]` i `[Tn-Rnn]` identifiquen el tema i si la pregunta és de classe o de recapitulació. Les URL reals de les activitats es poden afegir a `assets/wooclap-config.js`.

## Materials originals i llicència

Els PPTX/PDF originals i les figures de tercers no s’han incorporat al repositori. Es conserva la llicència GPL-3.0; les fonts científiques mantenen les seves llicències.
