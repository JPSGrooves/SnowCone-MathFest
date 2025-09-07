// scripts/dom-shim.mjs
import { JSDOM } from "jsdom";

// minimal DOM
const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
  url: "https://local.test",
});
const win = dom.window;

// expose window/document
globalThis.window = win;
globalThis.document = win.document;

// define read-only browser-ish globals via getters (Node 22 safe)
for (const [name, getter] of Object.entries({
  navigator: () => win.navigator,
  location: () => win.location,
  self: () => win,
  top: () => win,
  parent: () => win,
})) {
  Object.defineProperty(globalThis, name, { configurable: true, get: getter });
}

// copy other window props onto global (lazy via getters)
for (const prop of Object.getOwnPropertyNames(win)) {
  if (prop in globalThis) continue;
  try {
    Object.defineProperty(globalThis, prop, {
      configurable: true,
      get: () => win[prop],
    });
  } catch {}
}

// atob/btoa
globalThis.atob = (s) => Buffer.from(s, "base64").toString("binary");
globalThis.btoa = (s) => Buffer.from(s, "binary").toString("base64");

// matchMedia stub
if (!win.matchMedia) {
  win.matchMedia = (q) => ({
    matches: false,
    media: String(q),
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false; },
  });
}

// rAF/cAF
if (!win.requestAnimationFrame) {
  win.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
  win.cancelAnimationFrame = (id) => clearTimeout(id);
}
Object.defineProperty(globalThis, "requestAnimationFrame", {
  configurable: true,
  get: () => win.requestAnimationFrame,
});
Object.defineProperty(globalThis, "cancelAnimationFrame", {
  configurable: true,
  get: () => win.cancelAnimationFrame,
});

// Optional: ResizeObserver + CustomEvent stubs (some libs expect these)
if (!win.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  win.ResizeObserver = ResizeObserver;
}
if (typeof win.CustomEvent !== "function") {
  win.CustomEvent = class CustomEvent extends win.Event {
    constructor(event, params = {}) { super(event, params); this.detail = params.detail ?? null; }
  };
}
