"use strict";

document.getElementById("year").textContent = new Date().getFullYear();
const media = JSON.parse(document.getElementById("media-data").textContent);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

// Gallery: lazy loading, keyboard/swipe navigation, and explicit rotation control.
const gallery = document.getElementById("saya-gallery");
const galleryStage = document.getElementById("gallery-stage");
const slides = [...gallery.querySelectorAll(".gallery-slide")];
const dots = [...gallery.querySelectorAll(".gallery-dot")];
const rotationButton = document.getElementById("gallery-toggle");
let slideIndex = 0;
let slideRequest = 0;
let rotationEnabled = !reducedMotion.matches;
let galleryVisible = false;
let galleryHovered = false;
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
  rotationButton.setAttribute("aria-pressed", String(rotationEnabled));
  const label = rotationEnabled ? "Pause slideshow" : "Play slideshow";
  rotationButton.setAttribute("aria-label", label);
  rotationButton.querySelector("span").textContent = label;
  const focused = gallery.contains(document.activeElement) && document.activeElement !== rotationButton;
  if (rotationEnabled && galleryVisible && !document.hidden && !galleryHovered && !focused) {
    galleryTimer = setInterval(() => showSlide(slideIndex + 1), 7000);
  }
}

async function showSlide(requested, manual = false) {
  if (manual) { rotationEnabled = false; syncRotation(); }
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
    document.getElementById("gallery-announcement").textContent = "This illustration could not load. Please try another one.";
    return;
  }
  if (request !== slideRequest) return;
  slideIndex = index;
  slides.forEach((slide, i) => {
    slide.classList.toggle("is-active", i === index);
    slide.setAttribute("aria-hidden", String(i !== index));
    dots[i].classList.toggle("is-active", i === index);
    dots[i].setAttribute("aria-pressed", String(i === index));
  });
  const info = media.slides[index];
  document.getElementById("art-title").textContent = info.title;
  document.getElementById("art-source").href = info.source;
  if (manual) document.getElementById("gallery-announcement").textContent = info.title;
  warmSlide((index + 1) % slides.length);
}

document.getElementById("gallery-prev").addEventListener("click", () => showSlide(slideIndex - 1, true));
document.getElementById("gallery-next").addEventListener("click", () => showSlide(slideIndex + 1, true));
dots.forEach((dot, i) => dot.addEventListener("click", () => showSlide(i, true)));
rotationButton.addEventListener("click", () => { rotationEnabled = !rotationEnabled; syncRotation(); });
gallery.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault(); showSlide(slideIndex + (event.key === "ArrowLeft" ? -1 : 1), true);
  }
});
gallery.addEventListener("mouseenter", () => { galleryHovered = true; syncRotation(); });
gallery.addEventListener("mouseleave", () => { galleryHovered = false; syncRotation(); });
gallery.addEventListener("focusin", syncRotation);
gallery.addEventListener("focusout", () => setTimeout(syncRotation, 0));
document.addEventListener("visibilitychange", syncRotation);
reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) rotationEnabled = false; syncRotation(); });
let swipeStart = null;
galleryStage.addEventListener("touchstart", (event) => {
  swipeStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
}, { passive: true });
galleryStage.addEventListener("touchend", (event) => {
  if (!swipeStart || !event.changedTouches.length) return;
  const dx = event.changedTouches[0].clientX - swipeStart.x;
  const dy = event.changedTouches[0].clientY - swipeStart.y;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) showSlide(slideIndex + (dx < 0 ? 1 : -1), true);
  swipeStart = null;
}, { passive: true });
galleryStage.addEventListener("touchcancel", () => { swipeStart = null; }, { passive: true });
if ("IntersectionObserver" in window) {
  new IntersectionObserver((entries) => {
    galleryVisible = entries[0].isIntersecting;
    if (galleryVisible) warmSlide((slideIndex + 1) % slides.length);
    syncRotation();
  }, { threshold: .15 }).observe(gallery);
} else { galleryVisible = true; syncRotation(); }
syncRotation();

// Music is streamed from Bestdori only after user interaction; the audio element
// remains source-free on initial load. Keeping one element prevents overlap.
const tracks = media.tracks;
const audio = document.getElementById("music-audio");
const musicCard = document.querySelector(".music-card");
const playButton = document.getElementById("music-play");
const seek = document.getElementById("music-seek");
const volume = document.getElementById("music-volume");
const muteButton = document.getElementById("music-mute");
const message = document.getElementById("player-message");
const trackButtons = [...document.querySelectorAll(".track-button")];
const playbackState = document.getElementById("playback-state");
let trackIndex = 0;
let playerRequest = 0;
let playRequested = false;
let seeking = false;
let waitingForSeek = false;
let lastNonzeroVolume = .65;

musicCard.querySelector(".player-controls").hidden = false;
audio.volume = .65;

function formatTime(seconds) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}
function duration() { return Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : tracks[trackIndex].duration; }
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
  musicCard.classList.toggle("is-playing", playing);
  if (!playing) musicCard.classList.remove("is-loading");
  playButton.setAttribute("aria-pressed", String(playing || playRequested));
  playButton.setAttribute("aria-label", playing || playRequested ? "Pause music" : `Play ${tracks[trackIndex].title}`);
  playbackState.textContent = playing ? "NOW PLAYING" : audio.currentTime > 0 ? "TAKING A BREATHER" : "READY WHEN YOU ARE";
}
function updateMediaSession() {
  if (!("mediaSession" in navigator) || !("MediaMetadata" in window)) return;
  const track = tracks[trackIndex];
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title, artist: track.artist, album: "BanG Dream! Girls Band Party!",
    artwork: [{ src: new URL(track.image, document.baseURI).href, sizes: "384x384", type: "image/webp" }]
  });
}
function resetDisplay() {
  const track = tracks[trackIndex];
  document.getElementById("track-title").textContent = track.title;
  const cover = document.getElementById("track-cover"); cover.src = track.image; cover.alt = `${track.title} cover art`;
  document.getElementById("song-source").href = track.source;
  trackButtons.forEach((button, index) => {
    button.classList.toggle("is-selected", index === trackIndex);
    if (index === trackIndex) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
  seek.value = 0; seek.disabled = true; seeking = false; waitingForSeek = false;
  seek.style.setProperty("--progress", "0%");
  document.getElementById("current-time").textContent = "0:00";
  document.getElementById("total-time").textContent = formatTime(track.duration);
  seek.setAttribute("aria-valuetext", `0:00 of ${formatTime(track.duration)}`);
  updatePlayback();
}
function failPlayback() {
  playRequested = false;
  musicCard.classList.remove("is-loading"); updatePlayback();
  playbackState.textContent = "LET’S TRY THAT AGAIN";
  message.textContent = "This track could not load. Retry, choose another, or listen on Bestdori.";
}
function pauseMusic() {
  ++playerRequest; playRequested = false; audio.pause(); updatePlayback();
  message.textContent = "Paused. Pick up whenever you like.";
}
async function playMusic() {
  const request = ++playerRequest;
  playRequested = true; musicCard.classList.add("is-loading");
  playButton.setAttribute("aria-pressed", "true"); playButton.setAttribute("aria-label", "Pause music");
  message.textContent = "Loading music…";
  if (!audio.getAttribute("src") || audio.error) {
    audio.src = tracks[trackIndex].audio;
    audio.load();
  }
  if (audio.ended) audio.currentTime = 0;
  updateMediaSession();
  try {
    await audio.play();
    if (request !== playerRequest) return;
    musicCard.classList.remove("is-loading");
    message.textContent = "A little music, while you explore.";
    updatePlayback();
  } catch (error) {
    if (request !== playerRequest || error.name === "AbortError") return;
    failPlayback();
  }
}
function selectTrack(requested, autoplay = false) {
  const index = (requested + tracks.length) % tracks.length;
  if (index === trackIndex) {
    if (autoplay) playMusic();
    return;
  }
  ++playerRequest; playRequested = false; audio.pause();
  audio.removeAttribute("src"); audio.load();
  trackIndex = index; resetDisplay();
  message.textContent = "Press play for a little background music.";
  if (autoplay) playMusic();
}

playButton.addEventListener("click", () => { if (playRequested || !audio.paused) pauseMusic(); else playMusic(); });
trackButtons.forEach((button, index) => button.addEventListener("click", () => {
  if (index === trackIndex && (playRequested || !audio.paused)) pauseMusic();
  else selectTrack(index, true);
}));
document.getElementById("music-prev").addEventListener("click", () => selectTrack(trackIndex - 1, playRequested || !audio.paused));
document.getElementById("music-next").addEventListener("click", () => selectTrack(trackIndex + 1, playRequested || !audio.paused));
audio.addEventListener("loadedmetadata", () => { seek.disabled = false; updateProgress(); });
audio.addEventListener("durationchange", updateProgress);
audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("playing", () => {
  musicCard.classList.remove("is-loading"); message.textContent = "A little music, while you explore."; updatePlayback();
});
audio.addEventListener("pause", () => {
  if (!waitingForSeek) playRequested = false;
  updatePlayback();
});
audio.addEventListener("waiting", () => { if (playRequested) { musicCard.classList.add("is-loading"); message.textContent = "Buffering music…"; } });
audio.addEventListener("error", () => { if (audio.getAttribute("src")) failPlayback(); });
audio.addEventListener("ended", () => {
  playRequested = false;
  if (trackIndex < tracks.length - 1) selectTrack(trackIndex + 1, true);
  else { updatePlayback(); playbackState.textContent = "THANKS FOR LISTENING"; message.textContent = "That’s the playlist. Pick a song to listen again."; }
});
seek.addEventListener("input", () => {
  seeking = true;
  const time = Number(seek.value) / 1000 * duration();
  seek.style.setProperty("--progress", `${Number(seek.value) / 10}%`);
  document.getElementById("current-time").textContent = formatTime(time);
  seek.setAttribute("aria-valuetext", `${formatTime(time)} of ${formatTime(duration())}`);
});
seek.addEventListener("change", () => {
  const time = Number(seek.value) / 1000 * duration();
  waitingForSeek = true;
  try { audio.currentTime = time; } catch { message.textContent = "This part of the track is not ready yet."; }
  seeking = false; updateProgress();
});
audio.addEventListener("seeked", () => { waitingForSeek = false; updateProgress(); });
function updateVolume() {
  const silent = audio.muted || audio.volume === 0;
  volume.value = Math.round(audio.volume * 100);
  volume.style.setProperty("--progress", `${volume.value}%`);
  volume.setAttribute("aria-valuetext", `${volume.value} percent`);
  muteButton.setAttribute("aria-pressed", String(silent));
  muteButton.setAttribute("aria-label", silent ? "Unmute music" : "Mute music");
}
volume.addEventListener("input", () => {
  audio.volume = Number(volume.value) / 100;
  if (audio.volume > 0) { lastNonzeroVolume = audio.volume; audio.muted = false; }
  updateVolume();
});
muteButton.addEventListener("click", () => {
  if (audio.volume === 0) { audio.volume = lastNonzeroVolume; audio.muted = false; }
  else audio.muted = !audio.muted;
  updateVolume();
});
audio.addEventListener("volumechange", updateVolume);
if ("mediaSession" in navigator) {
  const actions = {
    play: playMusic, pause: pauseMusic,
    previoustrack: () => selectTrack(trackIndex - 1, true),
    nexttrack: () => selectTrack(trackIndex + 1, true),
    seekto: (details) => { if (Number.isFinite(details.seekTime)) audio.currentTime = details.seekTime; }
  };
  Object.entries(actions).forEach(([action, handler]) => { try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* Unsupported action. */ } });
}
window.addEventListener("pagehide", () => { pauseMusic(); clearInterval(galleryTimer); });
window.addEventListener("pageshow", syncRotation);
updateVolume();
