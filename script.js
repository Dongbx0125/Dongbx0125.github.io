"use strict";

document.getElementById("year").textContent = new Date().getFullYear();
const media = JSON.parse(document.getElementById("media-data").textContent);

// Highlight section links without moving focus.
const navigation = [...document.querySelectorAll('nav a[href^="#"]')];
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.find((entry) => entry.isIntersecting);
    if (!visible) return;
    navigation.forEach((link) => {
      if (link.hash === `#${visible.target.id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-15% 0px -55% 0px", threshold: 0 });
  document.querySelectorAll("main section[id]").forEach((section) => observer.observe(section));
}

// Continuous gallery rotation, with manual arrows, keyboard, and touch navigation.
const gallery = document.getElementById("saya-gallery");
const galleryStage = document.getElementById("gallery-stage");
const slides = [...gallery.querySelectorAll(".gallery-slide")];
let slideIndex = 0;
let slideRequest = 0;
let galleryTimer = null;

gallery.querySelector(".gallery-arrows").hidden = false;
gallery.querySelector(".gallery-bottom").hidden = false;

function warmSlide(index) {
  const img = slides[index].querySelector("img");
  if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
  return img;
}
function syncRotation() {
  clearInterval(galleryTimer);
  galleryTimer = null;
  // Browsers throttle background tabs; resume automatically when visible.
  if (!document.hidden) galleryTimer = setInterval(() => showSlide(slideIndex + 1), 6000);
}
async function showSlide(requested, manual = false) {
  if (manual) syncRotation();
  const index = (requested + slides.length) % slides.length;
  const request = ++slideRequest;
  const img = warmSlide(index);
  try {
    if (img.decode) await img.decode();
    else if (!img.complete) await new Promise((resolve, reject) => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", reject, { once: true });
    });
  } catch {
    if (request === slideRequest && manual) document.getElementById("gallery-announcement").textContent = "Unable to load this illustration.";
    return;
  }
  if (request !== slideRequest) return;
  slideIndex = index;
  slides.forEach((slide, i) => {
    slide.classList.toggle("is-active", i === index);
    slide.setAttribute("aria-hidden", String(i !== index));
  });
  document.getElementById("art-source").href = media.slides[index].source;
  if (manual) document.getElementById("gallery-announcement").textContent = media.slides[index].title;
  warmSlide((index + 1) % slides.length);
}
document.getElementById("gallery-prev").addEventListener("click", () => showSlide(slideIndex - 1, true));
document.getElementById("gallery-next").addEventListener("click", () => showSlide(slideIndex + 1, true));
gallery.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    showSlide(slideIndex + (event.key === "ArrowLeft" ? -1 : 1), true);
  }
});
document.addEventListener("visibilitychange", syncRotation);
let swipeStart = null;
galleryStage.addEventListener("touchstart", event => {
  swipeStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
}, { passive: true });
galleryStage.addEventListener("touchend", event => {
  if (!swipeStart || !event.changedTouches.length) return;
  const dx = event.changedTouches[0].clientX - swipeStart.x;
  const dy = event.changedTouches[0].clientY - swipeStart.y;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) showSlide(slideIndex + (dx < 0 ? 1 : -1), true);
  swipeStart = null;
}, { passive: true });
galleryStage.addEventListener("touchcancel", () => { swipeStart = null; }, { passive: true });
warmSlide(1);
syncRotation();

// One shared audio element serves the header and full player. No audio is
// requested until the visitor explicitly presses play or selects a song.
const tracks = media.tracks;
const audio = document.getElementById("music-audio");
const musicCard = document.querySelector(".music-card");
const headerPlayer = document.querySelector(".header-player");
const playButtons = ["music-play", "header-play"].map(id => document.getElementById(id));
const muteButtons = ["music-mute", "header-mute"].map(id => document.getElementById(id));
const seek = document.getElementById("music-seek");
const volume = document.getElementById("music-volume");
const message = document.getElementById("player-message");
const playlist = document.getElementById("song-list");
const trackButtons = [...playlist.querySelectorAll(".track-button")];
let trackIndex = 0;
let playerRequest = 0;
let playRequested = false;
let loading = false;
let seeking = false;
let loadTimer = null;
let lastNonzeroVolume = .65;

musicCard.querySelector(".player-controls").hidden = false;
musicCard.querySelector(".playlist-search").hidden = false;
headerPlayer.hidden = false;
audio.volume = .65;

function setMessage(text = "") {
  message.textContent = text;
  message.hidden = !text;
}
function formatTime(seconds) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}
function duration() {
  return Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : tracks[trackIndex].duration;
}
function updateProgress() {
  const total = duration();
  if (!seeking) {
    seek.value = Math.round((audio.currentTime || 0) / total * 1000);
    seek.style.setProperty("--progress", `${Number(seek.value) / 10}%`);
    document.getElementById("current-time").textContent = formatTime(audio.currentTime);
  }
  document.getElementById("total-time").textContent = formatTime(total);
  seek.setAttribute("aria-valuetext", `${formatTime(Number(seek.value) / 1000 * total)} of ${formatTime(total)}`);
}
function updatePlayback() {
  const playing = !audio.paused && !audio.ended;
  for (const surface of [musicCard, headerPlayer]) {
    surface.classList.toggle("is-playing", playing);
    surface.classList.toggle("is-loading", loading && playRequested);
  }
  for (const button of playButtons) {
    button.setAttribute("aria-pressed", String(playRequested));
    button.setAttribute("aria-label", playRequested ? "Pause music" : `Play ${tracks[trackIndex].title}`);
  }
  trackButtons.forEach((button, index) => button.setAttribute("aria-label",
    index === trackIndex && playRequested ? `Pause ${tracks[index].title}` : `Play ${tracks[index].title}`));
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = playing ? "playing" : "paused";
}
function updateMediaSession() {
  if (!("mediaSession" in navigator) || !("MediaMetadata" in window)) return;
  const track = tracks[trackIndex];
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title, artist: track.artist, album: "BanG Dream! Girls Band Party!",
    artwork: [{ src: new URL(track.image, document.baseURI).href, sizes: "384x384", type: "image/webp" }]
  });
}
function revealSelection() {
  const row = trackButtons[trackIndex];
  if (row.parentElement.hidden) return;
  const bounds = playlist.getBoundingClientRect();
  const selected = row.getBoundingClientRect();
  if (selected.top < bounds.top) playlist.scrollTop += selected.top - bounds.top;
  else if (selected.bottom > bounds.bottom) playlist.scrollTop += selected.bottom - bounds.bottom;
}
function resetDisplay() {
  const track = tracks[trackIndex];
  document.getElementById("track-title").textContent = track.title;
  document.getElementById("header-track-title").textContent = track.title;
  const cover = document.getElementById("track-cover");
  cover.src = track.image;
  cover.alt = `${track.title} cover art`;
  document.getElementById("song-source").href = track.source;
  trackButtons.forEach((button, index) => {
    button.classList.toggle("is-selected", index === trackIndex);
    if (index === trackIndex) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
  seeking = false;
  seek.disabled = true;
  updateProgress();
  updatePlayback();
  revealSelection();
}
function failPlayback() {
  clearTimeout(loadTimer);
  ++playerRequest;
  playRequested = false;
  loading = false;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  seek.disabled = true;
  updatePlayback();
  setMessage("Unable to load this track. Press play to retry, or listen on Fandom.");
}
function pauseMusic() {
  clearTimeout(loadTimer);
  ++playerRequest;
  playRequested = false;
  loading = false;
  audio.pause();
  updatePlayback();
  setMessage();
}
async function playMusic() {
  clearTimeout(loadTimer);
  const request = ++playerRequest;
  playRequested = true;
  loading = true;
  setMessage();
  if (!audio.getAttribute("src") || audio.error) {
    audio.src = tracks[trackIndex].audio;
    audio.load();
  }
  if (audio.ended) audio.currentTime = 0;
  updateMediaSession();
  updatePlayback();
  loadTimer = setTimeout(() => {
    if (request === playerRequest && loading) failPlayback();
  }, 25000);
  try {
    await audio.play();
    if (request !== playerRequest) return;
    clearTimeout(loadTimer);
    loading = false;
    updatePlayback();
  } catch (error) {
    if (request !== playerRequest) return;
    // An interrupted request must not leave either control showing playback.
    if (error.name === "AbortError") pauseMusic();
    else failPlayback();
  }
}
function selectTrack(requested, autoplay = false) {
  const index = (requested + tracks.length) % tracks.length;
  if (index === trackIndex) {
    if (autoplay) playMusic();
    return;
  }
  clearTimeout(loadTimer);
  ++playerRequest;
  playRequested = false;
  loading = false;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  trackIndex = index;
  resetDisplay();
  setMessage();
  if (autoplay) playMusic();
}
function togglePlayback() {
  if (playRequested) pauseMusic();
  else playMusic();
}
playButtons.forEach(button => button.addEventListener("click", togglePlayback));
trackButtons.forEach((button, index) => button.addEventListener("click", () => {
  if (index === trackIndex && playRequested) pauseMusic();
  else selectTrack(index, true);
}));
for (const prefix of ["music", "header"]) {
  document.getElementById(`${prefix}-prev`).addEventListener("click", () => selectTrack(trackIndex - 1, playRequested));
  document.getElementById(`${prefix}-next`).addEventListener("click", () => selectTrack(trackIndex + 1, playRequested));
}
audio.addEventListener("loadedmetadata", () => { seek.disabled = false; updateProgress(); });
audio.addEventListener("durationchange", updateProgress);
audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("playing", () => {
  clearTimeout(loadTimer);
  if (!playRequested) { audio.pause(); return; }
  loading = false;
  setMessage();
  updatePlayback();
});
audio.addEventListener("pause", () => {
  // Source changes enqueue a pause event; it must not cancel the next song.
  if (audio.paused && !loading && !audio.ended) playRequested = false;
  updatePlayback();
});
audio.addEventListener("waiting", () => {
  if (playRequested && !audio.paused) { loading = true; updatePlayback(); }
});
audio.addEventListener("error", () => { if (audio.getAttribute("src") && audio.error) failPlayback(); });
audio.addEventListener("ended", () => {
  playRequested = false;
  loading = false;
  if (trackIndex < tracks.length - 1) selectTrack(trackIndex + 1, true);
  else updatePlayback();
});
seek.addEventListener("input", () => {
  seeking = true;
  const time = Number(seek.value) / 1000 * duration();
  seek.style.setProperty("--progress", `${Number(seek.value) / 10}%`);
  document.getElementById("current-time").textContent = formatTime(time);
  seek.setAttribute("aria-valuetext", `${formatTime(time)} of ${formatTime(duration())}`);
});
seek.addEventListener("change", () => {
  try { audio.currentTime = Number(seek.value) / 1000 * duration(); }
  catch { setMessage("This part of the track has not loaded yet."); }
  seeking = false;
  updateProgress();
});
audio.addEventListener("seeked", updateProgress);
function updateVolume() {
  const silent = audio.muted || audio.volume === 0;
  volume.value = Math.round(audio.volume * 100);
  volume.style.setProperty("--progress", `${volume.value}%`);
  volume.setAttribute("aria-valuetext", `${volume.value} percent`);
  for (const button of muteButtons) {
    button.setAttribute("aria-pressed", String(silent));
    button.setAttribute("aria-label", silent ? "Unmute music" : "Mute music");
  }
}
volume.addEventListener("input", () => {
  audio.volume = Number(volume.value) / 100;
  if (audio.volume > 0) { lastNonzeroVolume = audio.volume; audio.muted = false; }
  updateVolume();
});
muteButtons.forEach(button => button.addEventListener("click", () => {
  if (audio.volume === 0) { audio.volume = lastNonzeroVolume; audio.muted = false; }
  else audio.muted = !audio.muted;
  updateVolume();
}));
audio.addEventListener("volumechange", updateVolume);
const normalize = text => text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
document.getElementById("song-search").addEventListener("input", event => {
  const query = normalize(event.target.value.trim());
  let matches = 0;
  trackButtons.forEach((button, index) => {
    const match = normalize(tracks[index].title).includes(query);
    button.parentElement.hidden = !match;
    if (match) ++matches;
  });
  document.getElementById("empty-playlist").hidden = matches > 0;
  playlist.scrollTop = 0;
});
if ("mediaSession" in navigator) {
  const actions = {
    play: playMusic, pause: pauseMusic,
    previoustrack: () => selectTrack(trackIndex - 1, true),
    nexttrack: () => selectTrack(trackIndex + 1, true),
    seekto: details => {
      if (Number.isFinite(details.seekTime) && !seek.disabled) audio.currentTime = details.seekTime;
    }
  };
  Object.entries(actions).forEach(([action, handler]) => {
    try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* Unsupported action. */ }
  });
}
window.addEventListener("pagehide", () => { pauseMusic(); clearInterval(galleryTimer); });
window.addEventListener("pageshow", syncRotation);
updateVolume();
updatePlayback();
