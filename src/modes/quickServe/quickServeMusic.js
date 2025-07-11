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
export async function playQSRandomTrack() {
  await stopQS(); // 🌟 WAIT until the current track fully fades + unloads

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
