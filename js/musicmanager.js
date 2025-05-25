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
  if (music) {
    music.stop();
  }

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
      if (progressInterval) clearInterval(progressInterval);
      progressInterval = setInterval(updateProgress, 1000);
    },
    onend: () => {
      isPlaying = false;
    }
  });

  music.play();
}

function stopTrack() {
  if (music) {
    music.stop();
    isPlaying = false;
    clearInterval(progressInterval);
    updateProgress();
  }
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
  if (music) {
    const newTime = Math.max(0, music.seek() - 5);
    music.seek(newTime);
    updateProgress();
  }
}

function fastForwardTrack() {
  if (music) {
    const duration = music.duration();
    const newTime = Math.min(duration, music.seek() + 5);
    music.seek(newTime);
    updateProgress();
  }
}

function toggleLoop() {
  isLooping = !isLooping;
  if (music) {
    music.loop(isLooping);
  }
  alert("Looping is now " + (isLooping ? "ON" : "OFF"));
}

function updateTrackTitle(title) {
  const el = document.getElementById("currentTrack");
  if (el) el.textContent = title;
}

function updateProgress() {
  if (!music) return;
  const progress = document.getElementById("trackProgress");
  const timer = document.getElementById("trackTimer");
  const pos = music.seek();
  const dur = music.duration();
  if (progress) {
    progress.value = (pos / dur) * 100;
  }
  if (timer) {
    timer.textContent = formatTime(pos) + " / " + formatTime(dur);
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ":" + (s < 10 ? "0" + s : s);
}

window.playTrack = playTrack;
window.stopTrack = stopTrack;
window.togglePlayPause = togglePlayPause;
window.nextTrack = nextTrack;
window.prevTrack = prevTrack;
window.rewindTrack = rewindTrack;
window.fastForwardTrack = fastForwardTrack;
window.toggleLoop = toggleLoop;
