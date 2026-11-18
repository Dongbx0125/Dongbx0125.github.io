# Boxuan Dong · Peking University

Personal academic homepage for **Boxuan Dong (董博瑄)**, a PhD student at the School of AI for Science, Peking University, advised by Prof. Weihao Yu in IPP Lab. Research interests: embodied AI, multimodal large language models, and AI agents.

**Website:** [dongbx0125.github.io](https://dongbx0125.github.io/) · **Email:** [dobx2622@stu.pku.edu.cn](mailto:dobx2622@stu.pku.edu.cn) · **bilibili:** [356554489](https://space.bilibili.com/356554489)

The site uses plain HTML, CSS, JavaScript, optimized local images, and system fonts. There is no build step, package dependency, analytics, site cookie, or external font request. All page text is in English except real people's Chinese names.

## Local preview

Run `python -m http.server 8000` from this directory and open [localhost:8000](http://localhost:8000). The site also works when opening `index.html` directly.

## Publishing

GitHub Pages serves the `main` branch from the repository root. The `.nojekyll` file enables direct static-file serving.

## Editing

- `index.html`: biography, contact links, education, research, interests, media data, and search/social metadata.
- `styles.css`: responsive layout, typography, player states, print, and reduced-motion styles.
- `script.js`: navigation highlighting, gallery, shared audio controls, and playlist search.
- `assets/`: local photographs, official character sprites, covers, and social sharing image.
- `assets/bestdori-manifest.json`: source URLs, card and song IDs, display titles, sprite crops, and image dimensions.

To change the playlist or gallery, update the `media-data` JSON block and corresponding initial HTML in `index.html`, then update the manifest. Page rendering does not depend on live API calls.

When the **HOG WAM** preprint becomes available, replace `arXiv forthcoming` with its link and update the publication status. The current status is **Submitted to CVPR 2027**.

## Gallery and player

The gallery contains five Sāya Yamabuki illustrations. It rotates every seven seconds while visible, pauses on hover or focus, and suspends when the tab is hidden. Manual selection pauses rotation until the slideshow play button is pressed. Previous/next buttons, keyboard arrows, accessible dots, and touch swipes are supported. Reduced-motion preferences disable automatic rotation on initial load.

The playlist contains **28 Poppin’Party original songs**, including Star Beat!, Tear Drops, Time Lapse, CiRCLING, Sunflower Dreams, KIZUNA MUSIC♪, Returns, and Initial. These are game versions provided by Bestdori. The MP3 files stream from Bestdori after explicit visitor interaction and are not stored in this repository.

The header and full player control the same audio element. Both support play/pause, previous/next, and mute; the full player also provides seeking, volume adjustment, and song search. Playback advances through the playlist and stops after the final song. Supported device media controls are connected through the Media Session API.

The audio element has no source on initial load. Network errors display a concise retry message and a Bestdori link. With JavaScript disabled, the biography, images, and external listening link remain available.

## Sources

- **Portrait:** supplied by Boxuan Dong; taken at Peking University on 27 March 2026. The optimized image excludes original file metadata.
- **ET-SEED:** [paper](https://arxiv.org/abs/2411.03990), [project](https://et-seed.github.io/), and [code](https://github.com/yuechen0614/ET-SEED). The research thumbnail comes from the official project website. ICLR 2025.
- **HOG WAM:** submitted to CVPR 2027; arXiv forthcoming. The title tile is a typographic placeholder, not a research diagram.
- **Sāya gallery:** after-training cards [2220](https://bestdori.com/info/cards/2220), [16](https://bestdori.com/info/cards/16), [1540](https://bestdori.com/info/cards/1540), [1056](https://bestdori.com/info/cards/1056), and [2414](https://bestdori.com/info/cards/2414). Card 1540 also appears in the faint hero background.
- **Poppin’Party group image:** [A Sparkly Smile, card 491](https://bestdori.com/info/cards/491), before training; all five members are retained.
- **Chibis:** official Bestdori sprite sheets `sd001004` through `sd005004`. Sāya decorates the portrait, Rimi the education section, Tae the research heading, Kasumi the interests heading, and Arisa the player. Arisa uses the smiling upper-right pose; the other sprites use their first poses. Sāya also supplies the header icon and favicon.
- **Music, covers, and band logo:** Bestdori. Complete source URLs and the 28-song list are in `assets/bestdori-manifest.json`.

BanG Dream! material is used as a personal fan tribute. Rights remain with their respective owners. This site is not affiliated with BanG Dream! or Bestdori.

## Verification

Chromium checks cover widths of 320, 390, 768, 1024, and 1440 pixels; contact links and section order; all five body decorations; English-only text except Chinese names; real audio playback; synchronized header controls; seeking, volume, and mute; song search; rapid switching; automatic progression and final-song stop; network-error retry; gallery navigation; reduced motion; and the JavaScript-disabled fallback.

`extras/PROFILE_README.md` is an optional GitHub account profile README. To display it on `github.com/Dongbx0125`, use its contents in a public repository named `Dongbx0125`. This repository hosts the standalone GitHub Pages website.
