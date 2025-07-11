import { Howl, Howler } from 'howler';


let currentTrack = null;
let rafId = null;
const fadeDuration = 1000;

// 🔥 Track List
const tracks = [
  { id: 'quikserve', name: 'QuikServe OG', file: 'quikserveST_OG.mp3' },
  { id: 'kktribute', name: 'KK Tribute', file: 'KKtribute.mp3' },
  { id: 'softdown', name: 'Soft Down Math Vibes', file: 'softDownMathVibes.mp3' },
  { id: 'infadd', name: 'Infinity Addition', file: 'InfinityAddition.mp3' },
  { id: 'sc90', name: 'SnowCone 90', file: 'sc_90.mp3' },
  { id: 'nothingorg', name: 'Nothing Organic', file: 'nothing_organic.mp3' },
  { id: 'secrets', name: 'Secrets of Math', file: 'secretsOfMath.mp3' },
];

let looping = false;
let shuffling = false;
let currentIndex = 0;
let trackLoop = null;


//////////////////////////////
// 🚀 Play Track
//////////////////////////////
export function playTrack(id = getFirstTrackId()) {
  const track = tracks.find(t => t.id === id);
  if (!track) {
    console.warn(`⚠️ Track "${id}" not found.`);
    return;
  }

  stopTrack(() => {
    currentTrack = new Howl({
      src: [`${import.meta.env.BASE_URL}assets/audio/tracks/${track.file}`],
      loop: looping,
      volume: Howler._muted ? 0 : 1,
      html5: true,

      onplay: () => {
        updateTrackLabel(track.name);
        startProgressUpdater();
      },
      onend: () => {
        if (looping) return;

        if (shuffling) {
          playRandomTrack();
        } else {
          skipNext(); // <-- this line makes it play next normally
        }
      },
      onplayerror: (_, err) => {
        console.warn('⚠️ Play error:', err);
        currentTrack.once('unlock', () => currentTrack.play());
      }
    });

    currentTrack.play();
    startProgressUpdater(); // don't wait for onplay
  });
}

//////////////////////////////
// 🛑 Stop Track (with Fade)
//////////////////////////////
export function stopTrack(callback) {
  if (!currentTrack) {
    callback?.();
    return;
  }

  currentTrack.fade(currentTrack.volume(), 0, fadeDuration);
  setTimeout(() => {
    currentTrack.stop();
    currentTrack.unload();
    currentTrack = null;
    updateTrackLabel('(none)');
    callback?.();
  }, fadeDuration);

  cancelAnimationFrame(rafId);
}

//////////////////////////////
// 🔀 True Random Track
//////////////////////////////
export function playRandomTrack() {
  const currentIndex = getCurrentTrackIndex();
  let randomIndex;

  do {
    randomIndex = Math.floor(Math.random() * tracks.length);
  } while (tracks.length > 1 && randomIndex === currentIndex);

  stopTrack(() => {
    playTrack(tracks[randomIndex].id);
  });
}

//////////////////////////////
// ⏭️ Skip Next (Respects Shuffle)
//////////////////////////////
export function skipNext() {
  if (shuffling) {
    playRandomTrack();
    return;
  }

  const index = getCurrentTrackIndex();
  const next = (index + 1) % tracks.length;
  stopTrack(() => {
    playTrack(tracks[next].id);
  });
}

//////////////////////////////
// ⏮️ Skip Prev (Respects Shuffle)
//////////////////////////////
export function skipPrev() {
  if (shuffling) {
    playRandomTrack();
    return;
  }

  const index = getCurrentTrackIndex();
  const prev = (index - 1 + tracks.length) % tracks.length;
  stopTrack(() => {
    playTrack(tracks[prev].id);
  });
}

//////////////////////////////
// ⏯️ Play / Pause Toggle
//////////////////////////////
export function togglePlayPause() {
  if (!currentTrack) {
    playTrack();
    return;
  }

  if (currentTrack.playing()) {
    currentTrack.pause();
    cancelAnimationFrame(rafId);
  } else {
    currentTrack.play();
    startProgressUpdater();
  }
}

//////////////////////////////
// 🔇 Mute Controls
//////////////////////////////
export function toggleMute() {
  const muted = !Howler._muted;
  Howler.mute(muted);
  return muted;
}

export function isMuted() {
  return Howler._muted;
}

//////////////////////////////
// 🔁 Loop / 🔀 Shuffle
//////////////////////////////
export function toggleLoop() {
  looping = !looping;
  if (currentTrack) currentTrack.loop(looping);
  return looping;
}

export function getLooping() {
  return looping;
}

export function toggleShuffle() {
  shuffling = !shuffling;
  return shuffling;
}

export function getShuffling() {
  return shuffling;
}

//////////////////////////////
// 🔢 Get Current Index
//////////////////////////////
function getCurrentTrackIndex() {
  if (!currentTrack) return 0;
  const src = currentTrack._src;
  return tracks.findIndex(t => src.includes(t.file)) || 0;
}

//////////////////////////////
// ⏳ Progress Updater
//////////////////////////////
function startProgressUpdater() {
  const bar = document.getElementById('trackProgress');
  const timer = document.getElementById('trackTimer');

  if (!bar || !timer || !currentTrack) return;

  function update() {
    if (!currentTrack) return; // allow paused seek to show

    const seek = currentTrack.seek() || 0;
    const duration = currentTrack.duration() || 1;
    const percent = (seek / duration) * 100;

    bar.value = percent.toFixed(1);
    bar.max = 100;

    const format = (n) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
    timer.textContent = `${format(seek)} / ${format(duration)}`;

    rafId = requestAnimationFrame(update);
  }

  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(update);
}

//////////////////////////////
// 🎯 Getters
//////////////////////////////
export function isPlaying() {
  return currentTrack?.playing() ?? false;
}

export function currentTrackName() {
  if (!currentTrack) return '(none)';
  const src = currentTrack._src;
  const track = tracks.find(t => src.includes(t.file));
  return track?.name || '(unknown)';
}

export function currentTrackId() {
  if (!currentTrack) return '';
  const src = currentTrack._src;
  const track = tracks.find(t => src.includes(t.file));
  return track?.id ?? '';
}

export function getTrackList() {
  return tracks;
}

//////////////////////////////
// 🌌 Init (optional)
//////////////////////////////
export function initMusicPlayer() {
  updateTrackLabel('(none)');
}

//////////////////////////////
// 🌠 Fallback
//////////////////////////////
function getFirstTrackId() {
  return tracks[0]?.id ?? '';
}

//////////////////////////////
// 💫 Label Updater (Internal)
//////////////////////////////
function updateTrackLabel(name = currentTrackName()) {
  const label = document.getElementById('currentTrack');
  if (label) {
    label.textContent = name;
  }
}
export function scrubTo(percent) {
  if (!currentTrack) return;
  const duration = currentTrack.duration();
  if (duration && percent >= 0 && percent <= 1) {
    currentTrack.seek(percent * duration);
  }
}

export function getCurrentSeekPercent() {
  if (!currentTrack) return 0;
  const duration = currentTrack.duration();
  if (!duration) return 0;
  return (currentTrack.seek() || 0) / duration;
}

const infinityTrackIds = ['infadd', 'sc90', 'nothingorg', 'secrets'];

function shuffleInfinityTrackList() {
  return infinityTrackIds
    .map(id => ({ id, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(obj => obj.id);
}

let infQueue = shuffleInfinityTrackList();
let infIndex = 0;

export function playInfinityLoop() {
  const nextId = infQueue[infIndex];

  playTrack(nextId);

  infIndex = (infIndex + 1) % infQueue.length;
  if (infIndex === 0) {
    infQueue = shuffleInfinityTrackList(); // reshuffle after full loop
  }
}

export function stopInfinityLoop() {
  if (trackLoop) {
    trackLoop.stop();
    isPlaying = false;
  }
}
