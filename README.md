# chenyichen-vercel

Personal static publishing hub deployed with Vercel.

## Structure

- `index.html`: homepage matching the ChenYichen Lab reference layout.
- `assets/home-cards.json`: data source for the dynamic homepage collection cards.
- `assets/site.js`: client-side renderer for homepage collection cards.
- `articles/`: standalone articles and essays.
- `prototypes/`: interactive prototypes and product demos.
- `sites/`: independent static websites, one folder per site.
- `sites/english-level-up-tips/`: focused English learning guide page with the selected 8 articles from `docs/threads/part-1` and `docs/threads/part-2/x-misc.md`.
- `assets/`: shared visual assets and CSS.

## Publish

Push to `main`; Vercel deploys automatically through the connected GitHub project.
