// /src/modes/mathTips/modes/calculator.js
import { composeReply } from '../conversationPolicy.js';
import { makeSession, helpCard } from './_kit.js';

const S = makeSession({ capMin: 3, capMax: 4 });
const SAFE = /^[\d\s+\-*/^().]+$/;

function evalSafe(expr) {
  const raw = String(expr).trim();
  if (!raw || raw.length > 120) throw new Error('too long');
  if (!SAFE.test(raw)) throw new Error('unsafe chars');
  const js = raw.replaceAll('^', '**');
  if (/[*\/+]{2,}/.test(js)) throw new Error('bad ops');
  const val = Function(`"use strict";return(${js})`)();
  if (!Number.isFinite(val)) throw new Error('not finite');
  return val;
}
function tryPercentOf(text) {
  const m = /(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)/i.exec(text);
  if (!m) return null;
  const p = parseFloat(m[1]); const n = parseFloat(m[2]);
  return (p/100)*n;
}

export function start() {
  S.reset();
  const card = helpCard(
    'Calculator',
    [
      'type expressions like: (2+3)^3',
      'or percent: 15% of 80',
      'keep it simple & clean — no variables here'
    ],
    'tip: say "exit" to leave the calculator.'
  );
  return composeReply({ part: { html: card }, askAllowed: false });
}

export function handle(text='') {
  if (/^help\b/i.test(text)) {
    return { html: start() };
  }

  if (S.shouldBlock(text)) {
    return { html: composeReply({ part: { html: `<p>hang on, i’m crunching.</p>` }, askAllowed: false }) };
  }
  S.bump();

  // percent shortcut
  const p = tryPercentOf(text);
  if (p !== null) {
    const html = `<p>${text} = ${p}</p>`;
    if (S.isCapReached()) return { html: composeReply({ part: { html: `${html}<p>that’s plenty of math here. another booth?</p>` }, askAllowed: false }) };
    return { html: composeReply({ part: { kind:'answer', html }, askAllowed: true, askText: 'another calculation?' }) };
  }

  // normal eval
  try {
    const v = evalSafe(text);
    const html = `<p>${text} = ${v}</p>`;
    if (S.isCapReached()) return { html: composeReply({ part: { html: `${html}<p>calculator cool-down. try another booth?</p>` }, askAllowed: false }) };
    return { html: composeReply({ part: { html }, askAllowed: true, askText: 'feed me another?' }) };
  } catch {
    const html = `<p>couldn’t parse. try <code>15% of 80</code> or <code>(2+3)^3</code>.</p>`;
    return { html: composeReply({ part: { html }, askAllowed: true, askText: 'want help instead?' }) };
  }
}
