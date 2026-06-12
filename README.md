# chenyichen-vercel

Personal static publishing hub deployed with Vercel.

## Structure

- `index.html`: homepage for the publishing hub.
- `articles/`: standalone articles and essays.
- `prototypes/`: interactive prototypes and product demos.
- `sites/`: independent static websites, one folder per site.
- `assets/`: shared homepage and reader assets.
- `scripts/`: local generation scripts.

## Included Sites

- `sites/english-level-up-tips/`: single-page reading edition of `byoungd/English-level-up-tips`.

## Rebuild English Guide

Clone the source project and rebuild:

```bash
git clone --depth 1 https://github.com/byoungd/English-level-up-tips.git /tmp/English-level-up-tips
node scripts/build-english-guide.mjs /tmp/English-level-up-tips
```

The generated page keeps source attribution and the original CC BY-NC 4.0 notice.
