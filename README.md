# Antigen Density Calculator

Part of [Ligant Bench Tools](https://benchtools.ligant.ai/): free, open-source calculators for the laboratory bench. This repository holds the source of **Antigen Density Calculator** so you can download it and run it on your own computer. The hosted version is at https://benchtools.ligant.ai/antigen-density-calculator/

## Research use only

Research use only. Not qualified for GxP decision-making.

Antigen Density Calculator is a standalone calculator for research use, not for use in a GxP setting. For GxP work, Ligant offers a separate enterprise product. If your lab needs that, contact us at hello@ligant.ai.

## Run it on your computer

You need [Node.js](https://nodejs.org/) 22 or later.

```sh
npm ci          # install the exact dependencies
npm run dev     # start it, then open the address it prints
```

To build the static site instead:

```sh
npm run build   # writes the site to dist/
npm run preview # serves dist/ locally
```

Everything runs in your browser. Nothing you enter into the calculator, and no result, is sent anywhere.

## Cite

If you use Antigen Density Calculator in your work, please cite it. The citation is in [CITATION.cff](CITATION.cff) (GitHub shows it under "Cite this repository").

## Licence

Apache License 2.0, see [LICENSE](LICENSE). The bundled fonts (Inter, IBM Plex Mono) are under the SIL Open Font License 1.1.

Antigen Density Calculator v1.1.0. © Ligant AI Incorporated.
