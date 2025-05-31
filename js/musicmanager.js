// /js/musicManager.js

let currentTrackIndex = 0;
let isPlaying = false;
let isLooping = true;
let music = null;
let progressInterval = null;

const trackList = [
  {
    title: "Infinity Addition",
    file: "assets/audio/Infinity Addition.mp3"
  }
];

function playTrack(index = 0) {
  if (music) music.stop();

  currentTrackIndex = index;
  const track = trackList[currentTrackIndex];

  music = new Howl({
    src: [track.file],
    volume: 1.0,
    loop: isLooping,
    onplay: () => {
      isPlaying = true;
      updateTrackTitle(track.title);
      updateProgress();
      clearInterval(progressInterval);
      progressInterval = setInterval(updateProgress, 1000);
    },
    onend: () => {
      isPlaying = false;
    }
  });

  music.play();
}

function stopTrack() {
  if (!music) return;
  music.stop();
  isPlaying = false;
  clearInterval(progressInterval);
  updateProgress();
}

function togglePlayPause() {
  if (!music) return playTrack(currentTrackIndex);
  if (isPlaying) {
    music.pause();
    isPlaying = false;
    clearInterval(progressInterval);
  } else {
    music.play();
    isPlaying = true;
    clearInterval(progressInterval);
    progressInterval = setInterval(updateProgress, 1000);
  }
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % trackList.length;
  playTrack(currentTrackIndex);
}

function prevTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length;
  playTrack(currentTrackIndex);
}

function rewindTrack() {
  if (!music) return;
  music.seek(Math.max(0, music.seek() - 5));
  updateProgress();
}

function fastForwardTrack() {
  if (!music) return;
  const newTime = Math.min(music.duration(), music.seek() + 5);
  music.seek(newTime);
  updateProgress();
}

function toggleLoop() {
  isLooping = !isLooping;
  if (music) music.loop(isLooping);
  alert(`Looping is now ${isLooping ? "ON" : "OFF"}`);
}

function updateTrackTitle(title) {
  const el = document.getElementById("currentTrack");
  if (el) el.textContent = title;
}

function updateProgress() {
  if (!music) return;

  const pos = music.seek();
  const dur = music.duration();

  const progress = document.getElementById("trackProgress");
  if (progress) progress.value = (pos / dur) * 100;

  const timer = document.getElementById("trackTimer");
  if (timer) timer.textContent = `${formatTime(pos)} / ${formatTime(dur)}`;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// 🔊 Expose globally
window.playTrack = playTrack;
window.stopTrack = stopTrack;
window.togglePlayPause = togglePlayPause;
window.nextTrack = nextTrack;
window.prevTrack = prevTrack;
window.rewindTrack = rewindTrack;
window.fastForwardTrack = fastForwardTrack;
window.toggleLoop = toggleLoop;
