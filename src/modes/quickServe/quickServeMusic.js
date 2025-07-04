// 🎧 quickServeMusic.js — QuickServe's Private DJ Booth
import { Howl } from 'howler';

let qsTrack = null;
let currentFile = null;

const qsTracks = [
  'quikserveST_OG.mp3',
  'KKtribute.mp3',
  'softDownMathVibes.mp3'
];

const basePath = `${import.meta.env.BASE_URL}assets/audio/tracks/`;
const fadeDuration = 1000;

//////////////////////////////
// 🚀 Start a Random Track
//////////////////////////////
export function playQSRandomTrack() {
  stopQS();

  const random = Math.floor(Math.random() * qsTracks.length);
  const file = qsTracks[random];
  currentFile = file;

  qsTrack = new Howl({
    src: [`${basePath}${file}`],
    loop: false,
    volume: 1.0,
    html5: true,

    onend: () => {
      console.log(`🛑 QS Track finished: ${file}`);
      qsTrack = null;
      currentFile = null;
    },

    onplayerror: (_, err) => {
      console.warn('⚠️ QS Play error:', err);
      qsTrack.once('unlock', () => qsTrack.play());
    }
  });

  qsTrack.play();
  console.log(`🎧 QS Track started: ${file}`);
}

//////////////////////////////
// 🛑 Stop Current Track
//////////////////////////////
export function stopQS() {
  return new Promise((resolve) => {
    if (!qsTrack) return resolve();

    qsTrack.fade(qsTrack.volume(), 0, fadeDuration);
    setTimeout(() => {
      qsTrack.stop();
      qsTrack.unload();
      qsTrack = null;
      currentFile = null;
      console.log('🛑 QS Track stopped and unloaded');
      resolve(); // ✅ only resolve once fully stopped
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
