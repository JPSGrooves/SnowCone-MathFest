// /js/musicManager.js

let currentTrackIndex = 0;

const trackList = [
  {
    title: "Menu Theme",
    file: "assets/audio/menu-theme.mp3"
  },
  // Add more tracks here later!
];

let music = null;

function playTrack(index = 0) {
  if (music) {
    music.stop();
  }

  const track = trackList[index];
  music = new Howl({
    src: [track.file],
    volume: getSetting("musicVolume") ?? 1.0,
    loop: true
  });

  music.play();
  updateTrackTitle(track.title);
}

function stopTrack() {
  if (music) music.stop();
}

function updateTrackTitle(title) {
  const el = document.getElementById("currentTrack");
  if (el) el.textContent = title;
}

function setMusicVolume(vol) {
  if (music) music.volume(vol);
  setSetting("musicVolume", vol);
}

window.playTrack = playTrack;
window.stopTrack = stopTrack;
window.setMusicVolume = setMusicVolume;
