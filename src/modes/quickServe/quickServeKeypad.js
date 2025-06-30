export function generateKeypadHTML() {
  const rows = [
    // Top Row: Functions
    [
      { id: 'plusMinus', label: '+/-<br>Mode' },
      { id: 'seven', label: '7' },
      { id: 'eight', label: '8' },
      { id: 'nine', label: '9' },
      { id: 'enter', label: 'Enter' },
    ],
    // Second Row
    [
      { id: 'multiplyDivide', label: '×/÷<br>Mode' },
      { id: 'four', label: '4' },
      { id: 'five', label: '5' },
      { id: 'six', label: '6' },
      { id: 'clear', label: 'Clear' },
    ],
    // Third Row
    [
      { id: 'algMode', label: 'Alg<br>Mode' },
      { id: 'one', label: '1' },
      { id: 'two', label: '2' },
      { id: 'three', label: '3' },
      { id: 'muteBtn', label: '🔊 Mute' },
    ],
    // Bottom Row
    [
      { id: 'menu', label: 'Main<br>Menu' },
      { id: 'neg', label: '±' },
      { id: 'zero', label: '0' },
      { id: 'decimal', label: '.' },
      { id: 'reset', label: 'Reset<br>Game' },
    ],
  ];

  const buttons = rows
    .map(row => 
      row
        .map(btn => `<button id="${btn.id}">${btn.label}</button>`)
        .join('\n')
    )
    .join('\n');

  return `
    <div class="qs-keypad">
      ${buttons}
    </div>
  `;
}
