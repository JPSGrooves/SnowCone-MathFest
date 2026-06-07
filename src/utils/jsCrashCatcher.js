// src/utils/jsCrashCatcher.js
export function installJsCrashCatcher() {
  try {
    window.addEventListener('error', (e) => {
      console.error('[SCMF][JS-ERROR]', {
        message: e?.message,
        file: e?.filename,
        line: e?.lineno,
        col: e?.colno,
        error: e?.error
      });
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('[SCMF][JS-UNHANDLED-REJECTION]', e?.reason || e);
    });

    console.log('[SCMF] JS crash catcher installed ✅');
  } catch (err) {
    console.warn('[SCMF] JS crash catcher failed', err);
  }
}
