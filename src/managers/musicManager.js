// 🎧 musicManager.js – SnowCone Music Controls with MobX
import { appState } from '../data/appState.js';
import { Howl, Howler } from 'howler';

let currentTrack = null;
let trackIndex = 0;

const trackList = [
  { title: "Cone Vibes Vol. 1", file: "cone_vibes_1.mp3" },
  { title: "Ice Chill Nocturne", file: "ice_chill_nocturne.mp3" },
  { title: "Frosted Frequencies", file: "frosted_frequencies.mp3" }
];

function loadTrack(index) {
  if (currentTrack) currentTrack.stop();

  const track = trackList[index];
  currentTrack = new Howl({
    src: [`assets/audio/${track.file}`],
    loop: appState.settings.loop,
    volume: appState.settings.mute ? 0 : 1,
    onend: () => {
      if (!appState.settings.loop) skipNext();
    }
  });

  currentTrack.play();
  updateTrackInfo(track.title);
}

function updateTrackInfo(title) {
  const label = document.getElementById('currentTrack');
  if (label) label.textContent = title || '(none)';
}

// === PUBLIC CONTROLS ===

export function playTrack(index = trackIndex) {
  trackIndex = index;
  loadTrack(trackIndex);
}

export function stopTrack() {
  if (currentTrack) currentTrack.stop();
  currentTrack = null;
  updateTrackInfo('(none)');
}

export function togglePlayPause() {
  if (!currentTrack) return playTrack();
  currentTrack.playing() ? currentTrack.pause() : currentTrack.play();
}

export function skipNext() {
  trackIndex = appState.settings.shuffle
    ? Math.floor(Math.random() * trackList.length)
    : (trackIndex + 1) % trackList.length;
  playTrack(trackIndex);
}

export function skipPrev() {
  trackIndex = (trackIndex - 1 + trackList.length) % trackList.length;
  playTrack(trackIndex);
}

export function toggleShuffle() {
  const newShuffle = !appState.settings.shuffle;
  appState.setSetting('shuffle', newShuffle);
  return newShuffle;
}

export function setLoop(state) {
  appState.setSetting('loop', state);
  if (currentTrack) currentTrack.loop(state);
  return state;
}

export function getLooping() {
  return appState.settings.loop;
}

export function getShuffling() {
  return appState.settings.shuffle;
}

export function initMusicPlayer() {
  if (!currentTrack) updateTrackInfo('(none)');
}

// 🛑 Catch mute changes outside player
window.addEventListener('settingChanged', (e) => {
  const { key, value } = e.detail;
  if (key === 'mute') Howler.volume(value ? 0 : 1);
});
