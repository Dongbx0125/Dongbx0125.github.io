# Boxuan Dong · Research & Rhythm

Personal academic homepage for **Boxuan Dong (董博瑄)**, a PhD student at the School of AI for Science, Peking University, advised by Prof. Weihao Yu in IPP Lab.

**Website:** [dongbx0125.github.io](https://dongbx0125.github.io/)

The site uses plain HTML, CSS, and JavaScript, optimized local images, and system fonts. There is no build step, package dependency, analytics, site cookie, or external font request. Audio streams directly from Bestdori after a visitor chooses to play it. All page text is in English except real people's Chinese names.

## Local preview

From this directory, run `python -m http.server 8000` and open [localhost:8000](http://localhost:8000). You can also open `index.html` directly.

## Publishing

In this repository, open **Settings → Pages**, select **Deploy from a branch**, then choose **main / (root)**. The `.nojekyll` file allows the static files to be served directly. No Actions workflow or package installation is required.

## Editing

- `index.html`: biography, research, education, hobbies, image credits, search and social metadata.
- `styles.css`: palette and responsive layouts, with print and reduced-motion styles.
- `script.js`: navigation highlighting, the Sāya gallery, and the Poppin’Party audio player.
- `assets/`: optimized local images, official chibi sprite crops, cover artwork, favicon, and social sharing image. Original photo metadata is not included.
- `assets/bestdori-manifest.json`: source URLs, card IDs, song IDs, English display titles, and image dimensions for the Bestdori resources.

## Gallery and player

The gallery contains five Sāya Yamabuki illustrations. It changes every seven seconds while visible; hovering, focusing a gallery control, or hiding the tab suspends rotation. Selecting an illustration pauses automatic rotation until **Play slideshow** is pressed. Previous/next buttons, accessible dot buttons, arrow keys, and horizontal touch swipes are supported. The system's reduced-motion preference disables automatic rotation on first load and removes animation.

The playlist contains **Star Beat!**, **Tear Drops**, **Time Lapse**, **CiRCLING**, and **Sunflower Dreams**, all by Poppin’Party. These are the game versions provided by Bestdori, not full-length album tracks. Their MP3 files are streamed from the original source and are not distributed in this repository. The player supports play/pause, track selection, previous/next, seeking, volume, mute, automatic progression through the playlist, and supported device media controls. Music continues while the visitor explores the page; it does not start on its own. The playlist stops after its final song.

The audio element has no source and requests no audio on initial page load. A source outage produces an inline retry message and a working Bestdori link. With JavaScript disabled, the biography and first illustration remain readable and a link to Bestdori's player is available.

To edit the playlist or gallery, update both the `media-data` JSON block and its corresponding initial HTML in `index.html`; keep the provenance manifest in sync. No live API calls are required to render the page.

When the **HOG WAM** preprint is available, replace `arXiv forthcoming` with its link, and update the description and publication status. The current label is **Submitted to CVPR 2027**.

## Research sources

- **ET-SEED: Efficient Trajectory-Level SE(3) Equivariant Diffusion Policy**, ICLR 2025. [Paper](https://arxiv.org/abs/2411.03990) · [Project](https://et-seed.github.io/) · [Code](https://github.com/yuechen0614/ET-SEED).
- **HOG WAM**. Submitted to CVPR 2027; arXiv forthcoming. No unpublished paper files or results are included in this repository.

## Image sources and rights

- **Personal photograph:** supplied by Boxuan Dong; resized and encoded to WebP. The original photograph is not committed.
- **Sāya Yamabuki artwork:** BanG Dream! Girls Band Party! after-training illustrations, cards [2220](https://bestdori.com/info/cards/2220), [16](https://bestdori.com/info/cards/16), [1540](https://bestdori.com/info/cards/1540), [1056](https://bestdori.com/info/cards/1056), and [2414](https://bestdori.com/info/cards/2414). The faint hero background uses card 1540.
- **Poppin’Party chibis:** official character sprite sheets `sd001004` through `sd005004`, from Bestdori's `characters/livesd` assets. Each decoration is a cropped, transparent first pose from its original sheet. The Sāya sprite also supplies the site icon. No generated character artwork is used.
- **Music, covers, and band logo:** Bestdori songs [2](https://bestdori.com/info/songs/2), [4](https://bestdori.com/info/songs/4), [73](https://bestdori.com/info/songs/73), [95](https://bestdori.com/info/songs/95), and [45](https://bestdori.com/info/songs/45), plus the official `band/logo/001` image. Full source URLs are recorded in `assets/bestdori-manifest.json`.
- **ET-SEED thumbnail:** from the [official project website](https://et-seed.github.io/static/images/teaser_v14-1.png), illustrating the owner's coauthored work. Rights remain with the authors.
- **HOG WAM thumbnail:** decorative HTML/CSS/SVG art created for this site, not a technical diagram or research result.

All BanG Dream! material is presented as a personal fan tribute. Rights remain with their respective owners; this site is not affiliated with or endorsed by BanG Dream! or Bestdori. Source attribution does not grant a general reuse license.

## Verification

The site has been rendered in Chromium at widths of 320, 390, 768, 1024, and 1440 pixels with no horizontal overflow. Browser checks cover real Bestdori audio playback, seeking, pause, volume, mute, track selection, gallery controls and keyboard navigation, reduced-motion behavior, and the JavaScript-disabled fallback. Image paths, internal anchors, and English-only page text (except real Chinese names) are also checked.

An optional GitHub account profile README is in `extras/PROFILE_README.md`. To use it at `github.com/Dongbx0125`, place its contents in `README.md` of a public repository named `Dongbx0125`. This repository serves the independent GitHub Pages website.
