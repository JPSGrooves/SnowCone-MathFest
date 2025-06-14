// /src/managers/musicManager.js 🎧 Music Logic Core
import { Howl, Howler } from 'howler';
import { getSetting } from '../data/cdms.js';

const tracks = [
  { id: 'infinity_addition', label: '♾️ Infinity Addition', file: 'assets/audio/tracks/InfinityAddition.mp3' },
  { id: 'kk_tribute', label: '🌀 KK Tribute', file: 'assets/audio/tracks/KKtribute.mp3' },
  { id: 'nothing_organic', label: '🌿 Nothing Organic', file: 'assets/audio/tracks/nothing_organic.mp3' },
  { id: 'quikserve_og', label: '🍦 Quick Serve OG', file: 'assets/audio/tracks/quikserveST_OG.mp3' },
  { id: 'sc_90', label: '💾 SnowCone ‘90', file: 'assets/audio/tracks/sc_90.mp3' },
  { id: 'secrets_math', label: '🧠 Secrets of Math', file: 'assets/audio/tracks/secretsOfMath.mp3' },
  { id: 'stoopid_electro', label: '🤪 Stoopid Electro', file: 'assets/audio/tracks/stoopid electro fixed.m4a' },
  { id: 'soft_down', label: '🌙 Soft Down Math Vibes', file: 'assets/audio/tracks/softDownMathVibes.mp3' }
];

let currentIndex = 0;
let currentTrack = null;
let isLooping = true;
let isShuffling = false;
let progressInterval = null;
let initialized = false;

export function initMusicPlayer() {
  if (!initialized) {
    Howler.volume(getSetting('mute') ? 0 : 1);
    updateUI(tracks[currentIndex]);
    initialized = true;
  }
}

export function playTrack(index = 0, muted = getSetting('mute')) {
  stopTrack();
  currentIndex = index;
  const track = tracks[currentIndex];

  currentTrack = new Howl({
    src: [track.file],
    loop: isLooping,
    volume: 1,
    onplay: () => {
      updateUI(track);
      progressInterval = setInterval(updateProgress, 1000);
    },
    onend: () => {
      if (!isLooping) {
        isShuffling ? shuffleNext() : skipNext();
      }
    }
  });

  currentTrack.play();
}

export function togglePlayPause() {
  if (!currentTrack) return playTrack(currentIndex);

  if (currentTrack.playing()) {
    currentTrack.pause();
    clearInterval(progressInterval);
  } else {
    currentTrack.play();
    progressInterval = setInterval(updateProgress, 1000);
  }
}

export function skipNext() {
  currentIndex = (currentIndex + 1) % tracks.length;
  playTrack(currentIndex);
}

export function skipPrev() {
  currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
  playTrack(currentIndex);
}

export function toggleShuffle() {
  isShuffling = !isShuffling;
  return isShuffling;
}

function shuffleNext() {
  let next;
  do {
    next = Math.floor(Math.random() * tracks.length);
  } while (next === currentIndex);

  currentIndex = next;
  playTrack(currentIndex);
}

export function stopTrack() {
  if (currentTrack) {
    currentTrack.stop();
    clearInterval(progressInterval);
    currentTrack = null;
  }
}

export function fadeOutMusic() {
  if (currentTrack) {
    currentTrack.fade(currentTrack.volume(), 0, 400);
    setTimeout(() => stopTrack(), 500);
  }
}

function updateUI(track) {
  const el = document.getElementById('currentTrack');
  if (el) el.textContent = track.label;
  updateProgress();
}

function updateProgress() {
  if (!currentTrack) return;

  const progress = document.getElementById('trackProgress');
  const timer = document.getElementById('trackTimer');
  const pos = currentTrack.seek();
  const dur = currentTrack.duration();

  if (progress) progress.value = (pos / dur) * 100;
  if (timer) timer.textContent = `${formatTime(pos)} / ${formatTime(dur)}`;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' + s : s);
}

export function setLoop(value) {
  isLooping = value;
  if (currentTrack) currentTrack.loop(value);
}

export function getLooping() {
  return isLooping;
}

export function getShuffling() {
  return isShuffling;
}
