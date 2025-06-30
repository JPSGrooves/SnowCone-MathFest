// ======================
// 🌲 Dialogue Manager
// ======================

export const dialogueTree = {
  opening: {
    label: 'Start the Story',
    line: "Yo traveler... Welcome to SnowCone MathFest... or, well... it WOULD be, except... bruh... it's SOLD OUT.",
    next: ['ask_how', 'ask_what_now']
  },
  ask_how: {
    label: 'How did that happen?',
    line: "Bro... scalpers. Triangle syndicate. Bots bought every single cone pass.",
    next: ['ask_what_now', 'ask_who_are_you']
  },
  ask_what_now: {
    label: 'So... what now?',
    line: "WELL... lucky for you... the SnowCone truck always needs a backup server. You in?",
    next: ['accept_job', 'decline_job']
  },
  accept_job: {
    label: 'Yeah, I’m in.',
    line: "Bet. You’re officially on cone duty. Grab the apron, stack the syrup, and brace yourself... the math ghosts are restless tonight.",
    next: ['job_intro']
  },
  decline_job: {
    label: 'Nah, I’ll pass.',
    line: "Bruh... no vibe. No cones. No math. No festival. Peace ✌️.",
    next: ['farewell']
  },
  job_intro: {
    label: 'What’s the job?',
    line: "Simple. You serve cones... BUT... every customer pays with MATH. Solve the orders right, get XP, earn badges... maybe unlock a real festival pass.",
    next: ['start_quickserve', 'ask_who_are_you']
  },
  ask_who_are_you: {
    label: 'Who even are you?',
    line: "Me? I'm Pythagorus Cat. Triangle sorcerer. Festival concierge. Quesadilla enthusiast. Welcome to the edge of the math multiverse.",
    next: ['ask_how', 'ask_what_now']
  },
  start_quickserve: {
    label: 'Let’s serve some cones.',
    line: "Truck’s open. Cones are stacked. Let’s GOOOOOO. 🚚🍧",
    next: [] // This could launch QuickServe mode
  },
  farewell: {
    label: 'Bye.',
    line: "Catch ya on the flip side, traveler. 🌌🍧",
    next: []
  }
};

////////////////////////////////////////////////////
// 🔥 Dialogue Engine Logic
////////////////////////////////////////////////////

let currentNode = 'opening';

export function getDialogue() {
  const node = dialogueTree[currentNode];
  const line = node.line;
  const options = node.next;
  return { line, options };
}

export function chooseOption(optionKey) {
  if (dialogueTree[optionKey]) {
    currentNode = optionKey;
  } else {
    console.warn('Invalid dialogue option:', optionKey);
  }
}

export function resetDialogue() {
  currentNode = 'opening';
}
