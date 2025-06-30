// 🌌 Fallback Logger — Dev Console Only (Optional)
class FallbackLogger {
  log = [];

  constructor() {
    if (import.meta.env.MODE === 'development') {
      console.log('%c🪐 Fallback Logger active...', 'color: cyan;');
      window.fallbackLogger = this; // 🧠 God mode in console for dev only
    }
  }

  // ➕ Log an entry
  add(input) {
    const cleanInput = input.trim().toLowerCase();
    if (!this.log.includes(cleanInput)) {
      this.log.push(cleanInput);
      if (import.meta.env.MODE === 'development') {
        console.log(`%c🚨 Fallback logged: "${cleanInput}"`, 'color: orange;');
      }
    }
  }

  // 🗒️ View log
  get() {
    console.log('%c🗒️ Current Fallback Log:', 'color: lightgreen;');
    console.table(this.log);
    return this.log;
  }

  // 📤 Export log as JSON
  export() {
    const json = JSON.stringify(this.log, null, 2);
    console.log('%c📤 JSON Export Ready:', 'color: lightblue;');
    console.log(json);
    return json;
  }

  // 🧹 Clear the log
  clear() {
    this.log = [];
    console.log('%c🧹 Fallback log cleared.', 'color: red;');
  }
}

export const fallbackLogger = new FallbackLogger();
