// 🎧 quickServeMusic.js — QuickServe's Private DJ Booth (iOS silent-switch friendly) 🍧
// Key fix: html5:false => WebAudio, which matches Story Mode behavior.

import { Howl } from 'howler';

let qsTrack = null;
let currentFile = null;

// 🌈 NEW: track state for visibility guard
let qsWasPlayingOnHide = false;
let qsVisibilityGuardAttached = false;

const qsTracks = [
  'quikserveST_OG.mp3',
  'KKtribute.mp3',
  'softDownMathVibes.mp3'
];

const basePath = `${import.meta.env.BASE_URL}assets/audio/tracks/`;
const fadeDuration = 1000;

// Optional: match musicManager's global ceiling vibe (you set 0.7 there)
const DEFAULT_QS_VOL = 0.7;

//////////////////////////////
// 🧬 Attach QS Visibility Guard (once)
//////////////////////////////
function attachQuickServeVisibilityGuard() {
  if (qsVisibilityGuardAttached) return;
  qsVisibilityGuardAttached = true;

  document.addEventListener('visibilitychange', () => {
    // If there's no QS track loaded, nothing to do
    if (!qsTrack) {
      qsWasPlayingOnHide = false;
      return;
    }

    try {
      if (document.hidden) {
        // On hide: remember if we were playing and pause
        if (qsTrack.playing()) {
          qsWasPlayingOnHide = true;
          qsTrack.pause();
          console.log('👻 QS paused on tab hide');
        } else {
          qsWasPlayingOnHide = false;
        }
      } else {
        // On show: only resume if we paused it ourselves
        if (qsWasPlayingOnHide && !qsTrack.playing()) {
          qsTrack.play();
          console.log('🌞 QS resumed on tab show');
        }
        qsWasPlayingOnHide = false;
      }
    } catch (err) {
      console.warn('⚠️ QS visibility handler error:', err);
    }
  });
}

//////////////////////////////
// 🚀 Start a Random Track
//////////////////////////////
export async function playQSRandomTrack() {
  await stopQS(); // 🌟 WAIT until the current track fully fades + unloads

  const random = Math.floor(Math.random() * qsTracks.length);
  const file = qsTracks[random];
  currentFile = file;

  qsTrack = new Howl({
    src: [`${basePath}${file}`],
    loop: false,
    volume: DEFAULT_QS_VOL,

    // ✅ THE FIX:
    // html5:true uses <audio> (often ignores iOS silent switch)
    // html5:false uses WebAudio (matches Story Mode behavior)
    html5: false,

    onend: () => {
      console.log(`🛑 QS Track finished: ${file}`);
      qsTrack = null;
      currentFile = null;
      qsWasPlayingOnHide = false; // 🧹 safety
    },

    onplayerror: (_, err) => {
      console.warn('⚠️ QS Play error:', err);
      qsTrack.once('unlock', () => qsTrack.play());
    }
  });

  // 🌈 make sure our visibility guard is watching
  attachQuickServeVisibilityGuard();

  qsTrack.play();
  console.log(`🎧 QS Track started: ${file}`);
}

//////////////////////////////
// 🛑 Stop Current Track
//////////////////////////////
export function stopQS() {
  return new Promise((resolve) => {
    if (!qsTrack) {
      qsWasPlayingOnHide = false;
      return resolve();
    }

    try {
      qsTrack.fade(qsTrack.volume(), 0, fadeDuration);
    } catch (err) {
      console.warn('⚠️ Fade error:', err);
    }

    setTimeout(() => {
      if (qsTrack) {
        try {
          qsTrack.stop();
          qsTrack.unload();
          console.log('🛑 QS Track stopped and unloaded');
        } catch (err) {
          console.warn('⚠️ Stop/unload error:', err);
        }
      }

      qsTrack = null;
      currentFile = null;
      qsWasPlayingOnHide = false; // 🧹 don't try to resume a dead track
      resolve();
    }, fadeDuration);
  });
}

//////////////////////////////
// 🔥 Status Checkers
//////////////////////////////
export function isQSPlaying() {
  return qsTrack?.playing() ?? false;
}

export function currentQSFile() {
  return currentFile ?? '(none)';
}