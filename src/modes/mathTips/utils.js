// 🎲 Simple Picker
export function pick(arr) {
  if (!arr?.length) {
    console.warn('💀 Picker error — empty array!');
    return '💀 Yo... my brain just snowfroze.';
  }
  return arr[Math.floor(Math.random() * arr.length)];
}
