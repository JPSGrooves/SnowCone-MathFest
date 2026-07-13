// /src/modes/kidsCamping/antAttack.js
// Ant Attack 1.6.0 — Choose Ant v1 + existing battle bridge
// Keeps the current tug-of-war core alive while adding the new setup screen.

import { gsap } from 'gsap';
import { appState } from '../../data/appState.js';
import { showRoundMessage } from './roundFeedback.js';

// ────────────────────────────────────────────────────────────────────────────────
// Runtime singletons / module state
// ────────────────────────────────────────────────────────────────────────────────
const ANT = (globalThis.__KC_ANT__ ||= { session: 0, alive: false, root: null });

const ASSET_BASE = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/`;
const MENU_PACKAGE_ASSET_BASE = `${import.meta.env.BASE_URL}assets/img/menu/packages/`;

const ANT_ATTACK_SAVE_KEY = 'scmf.kidsCamping.antAttack.v1';

const ANT_ROSTER = Object.freeze([
  {
    id: 'black',
    name: 'Night Ant',
    shortName: 'Night',
    waveName: 'Night Wave',
    wavePower: 3,
    unlockText: 'Starter ant',
    basePng: 'aa_ant_black_base.png',
    poweredPng: 'aa_ant_black_powered.png',
    wavePng: 'aa_wave_night.png',
    royalPng: 'aa_ant_black_royal.png',
    soldierPng: 'aa_blackAnt.png',
  },
  {
    id: 'blue',
    name: 'Water Ant',
    shortName: 'Water',
    waveName: 'Water Wave',
    wavePower: 4,
    unlockText: 'Beat Water Ant',
    basePng: 'aa_ant_blue_base.png',
    poweredPng: 'aa_ant_blue_powered.png',
    wavePng: 'aa_wave_water.png',
    royalPng: 'aa_ant_blue_royal.png',
    soldierPng: 'aa_blueAnt.png',
  },
  {
    id: 'pink',
    name: 'Flower Ant',
    shortName: 'Flower',
    waveName: 'Flower Wave',
    wavePower: 5,
    unlockText: 'Beat Flower Ant',
    basePng: 'aa_ant_pink_base.png',
    poweredPng: 'aa_ant_pink_powered.png',
    wavePng: 'aa_wave_flower.png',
    royalPng: 'aa_ant_pink_royal.png',
    soldierPng: 'aa_pinkAnt.png',
  },
  {
    id: 'white',
    name: 'Cloud Ant',
    shortName: 'Cloud',
    waveName: 'Cloud Wave',
    wavePower: 6,
    unlockText: 'Beat Cloud Ant',
    basePng: 'aa_ant_white_base.png',
    poweredPng: 'aa_ant_white_powered.png',
    wavePng: 'aa_wave_cloud.png',
    royalPng: 'aa_ant_white_royal.png',
    soldierPng: 'aa_whiteAnt.png',
  },
  {
    id: 'yellow',
    name: 'Sun Ant',
    shortName: 'Sun',
    waveName: 'Sun Wave',
    wavePower: 7,
    unlockText: 'Beat Sun Ant',
    basePng: 'aa_ant_yellow_base.png',
    poweredPng: 'aa_ant_yellow_powered.png',
    wavePng: 'aa_wave_sun.png',
    royalPng: 'aa_ant_yellow_royal.png',
    soldierPng: 'aa_yellowAnt.png',
  },
  {
    id: 'red',
    name: 'Fire Ant',
    shortName: 'Fire',
    waveName: 'Fire Wave',
    wavePower: 8,
    unlockText: 'Beat Fire Ant',
    basePng: 'aa_ant_red_base.png',
    poweredPng: 'aa_ant_red_powered.png',
    wavePng: 'aa_wave_fire.png',
    royalPng: 'aa_ant_red_royal.png',
    soldierPng: 'aa_redAnt.png',
  },
]);

const QUEEN_SNACKJACKET = Object.freeze({
  id: 'queen',
  name: 'Queen SnackJacket',
  shortName: 'Queen',
  waveName: 'Pollen Storm',
  wavePower: 9,
  basePng: 'aa_ant_queen_snackjacket_base.png',
  poweredPng: 'aa_ant_queen_snackjacket_powered.png',
  wavePng: 'aa_wave_pollen.png',
  soldierPng: 'aa_yellowjacket.png',
  fallbackSoldierPng: 'aa_yellowAnt.png',
});

const STORY_RIVAL_ORDER = Object.freeze(['blue', 'pink', 'white', 'yellow', 'red', 'queen']);
const STORY_UNLOCK_CHAIN = Object.freeze(['black', 'blue', 'pink', 'white', 'yellow', 'red', 'queen']);

const STORY_ROUTE_BY_ANT = Object.freeze({
  black: ['blue', 'pink', 'white', 'yellow', 'red', 'queen'],
  blue: ['black', 'pink', 'white', 'yellow', 'red', 'queen'],
  pink: ['black', 'blue', 'white', 'yellow', 'red', 'queen'],
  white: ['black', 'blue', 'pink', 'yellow', 'red', 'queen'],
  yellow: ['black', 'blue', 'pink', 'white', 'red', 'queen'],
  red: ['black', 'blue', 'pink', 'white', 'yellow', 'queen'],
  queen: ['black', 'blue', 'pink', 'white', 'yellow', 'red'],
});

const BATTLE_TARGET_SCORE = 10;
const BOSS_BATTLE_TARGET_SCORE = 20;
const WAVE_CHARGE_MAX = 3;
// Kept as a future fallback knob if we want optional auto-start again.
const VS_AUTO_START_MS = 4700;

// ─────────────────────────────────────────────────────────────
// Ant Attack Story Script v1
// Source: Jeremy edited haiku pass.
// Structure:
// - prologue[playerAntId] -> one-time royal/base intro
// - battles[playerAntId][rivalAntId] -> mission/player/reply/result
// - ending[playerAntId] -> story ending
// ─────────────────────────────────────────────────────────────
const ANT_STORY_SCRIPT = Object.freeze({
  "prologue": {
    "black": [
      "SnowCones feed the nest.",
      "Bring tasty snacks back home safe.",
      "We can’t sleep hungry!"
    ],
    "blue": [
      "Streams feed our halls.",
      "Carry snacks through strong currents.",
      "Leave no grapes behind!"
    ],
    "pink": [
      "The petals are young.",
      "Steal snacks for our larvae.",
      "Pizza with pollen!"
    ],
    "white": [
      "Carry the Orange.",
      "Lift the snacks above the grass.",
      "May clouds shade your path!"
    ],
    "yellow": [
      "Sun warms the picnic.",
      "Bring burgers before dusk falls.",
      "Feed the colony!"
    ],
    "red": [
      "Embers need to feast.",
      "Spark the trail and haul snacks home.",
      "No burnt eggs this time!"
    ],
    "queen": [
      "Crowns need tasty things.",
      "I will swarm through every plate",
      "To get my SnowCone!"
    ]
  },
  "ending": {
    "black": [
      "Food fills every hall.",
      "The moon pats its belly full.",
      "Stars aligned for snacks!"
    ],
    "blue": [
      "Currents brought snacks home.",
      "Grapes bob in happy rivers.",
      "Smiles ‘round the bend!"
    ],
    "pink": [
      "Flowers fed the hive",
      "With more than beauty today.",
      "Pizza crust for lunch!"
    ],
    "white": [
      "Happy Puffy Clouds",
      "Rolled in to reward us snacks,",
      "And stayed for a while!"
    ],
    "yellow": [
      "Warm up every plate;",
      "Golden snacks shine so bright,",
      "The hive needs shades!"
    ],
    "red": [
      "Hungry elements",
      "Get the most snacks by design.",
      "Fire consumed all!"
    ],
    "queen": [
      "Queens count every crumb.",
      "Royal snacks are everywhere.",
      "Let’s begin the feast!"
    ]
  },
  "battles": {
    "black": {
      "blue": {
        "mission": [
          "Water guards the grapes",
          "Moonshine slips from the lake’s edge",
          "Snacks drift down the stream"
        ],
        "player": [
          "The Snack moon rises!",
          "Ants of the night, raid the plate",
          "And eat every crumb!"
        ],
        "reply": [
          "Water rolls straight through the night.",
          "Your snacks will float to my queen!"
        ],
        "result": [
          "Tides reflect the moon.",
          "The night places the disc there",
          "As a plate for snacks."
        ]
      },
      "pink": {
        "mission": [
          "Flowers work at night",
          "To obscure the picnic trail.",
          "Snacks prefer perfume!"
        ],
        "player": [
          "Petals fear the night.",
          "My shadows push back the bloom",
          "And snatch every bite!"
        ],
        "reply": [
          "Flowers grow where darkness naps.",
          "Night will sneeze from the pollen!"
        ],
        "result": [
          "Night folds every bloom",
          "And naps under stars and crumbs.",
          "Flowers lost the snacks!"
        ]
      },
      "white": {
        "mission": [
          "Clouds cover the plate",
          "Moonlight fades in cotton mist",
          "Snacks vanish below"
        ],
        "player": [
          "Clouds can’t hide pizza!",
          "We can smell it through the mist,",
          "Crumbs lead us like stars!"
        ],
        "reply": [
          "Fog can swallow every trail,",
          "Leaving night with empty hands!"
        ],
        "result": [
          "Night snuck through the clouds.",
          "Moonlight found the hidden feast.",
          "Cloud lost every crumb!"
        ]
      },
      "yellow": {
        "mission": [
          "The night starts to sweat.",
          "Bright ants march with morning heat.",
          "Sun burns through the shade!"
        ],
        "player": [
          "Sun, your plate is high,",
          "But night waits for you to fall,",
          "Then steals all your lunch!"
        ],
        "reply": [
          "Sunlight will burn sneaky feet",
          "And rays will melt the shadows!"
        ],
        "result": [
          "Night cools down the sun",
          "And crumbs rest in moonlit bags.",
          "Sun blinked…snackless now."
        ]
      },
      "red": {
        "mission": [
          "Fire sparks the Night",
          "Smoke curls over picnic cloths",
          "Night must dodge the heat"
        ],
        "player": [
          "Fire fades by night,",
          "And we’ll snack between the sparks.",
          "A blaze won’t stop lunch!"
        ],
        "reply": [
          "Fire shines through midnight trails.",
          "Your moon boots will smell like toast!"
        ],
        "result": [
          "Night smothered the flames.",
          "The cool crumbs settle back down",
          "On the moon’s cool plate."
        ]
      },
      "queen": {
        "mission": [
          "Stars shake at the point",
          "Of Queen SnackJacket’s stinger.",
          "Bow! Puny Night Ant!"
        ],
        "player": [
          "Your stinger is sharp!",
          "Watch us tiptoe past your swarm",
          "To steal royal snacks!"
        ],
        "reply": [
          "My crown buzzes over all!",
          "My worker wasps don’t sleep!"
        ],
        "result": [
          "Queen checks empty plates",
          "And curses the ants that won.",
          "We stole all her snacks!"
        ]
      }
    },
    "blue": {
      "black": {
        "mission": [
          "Night pulls on your tide.",
          "Moonlight prepares all the snacks.",
          "Like thieves in the night!"
        ],
        "player": [
          "Moonlight cannot swim.",
          "Rivers steal reflected plates.",
          "Ants drift home laughing!"
        ],
        "reply": [
          "Night is the true horizon.",
          "Lunchtime is set in the stars!"
        ],
        "result": [
          "Water will survive",
          "Night and day and find a way",
          "Every single time."
        ]
      },
      "pink": {
        "mission": [
          "Flowers drink the stream.",
          "Roots can sense the planned attack.",
          "Water forms a moat!"
        ],
        "player": [
          "Petals feel the flood.",
          "The rivers rise to the plate.",
          "Grapes will float with me!"
        ],
        "reply": [
          "Seeds are planted by your waves.",
          "We will spread like pretty weeds!"
        ],
        "result": [
          "Blooms overwatered",
          "Learned to bow beside the stream.",
          "Grapes, sail safely home!"
        ]
      },
      "white": {
        "mission": [
          "Clouds blanket the lake.",
          "Ants can’t find their tasty snacks",
          "And march somewhere else!"
        ],
        "player": [
          "Water blankets the globe.",
          "Lakes stay when clouds fade away,",
          "Give me back my grapes!"
        ],
        "reply": [
          "Clouds pick you up and slam you",
          "Back down before you can eat!"
        ],
        "result": [
          "Water outweighed clouds.",
          "Tides rose to claim tasty snacks,",
          "Especially grapes!"
        ]
      },
      "yellow": {
        "mission": [
          "Sun dries every drop.",
          "The rivers yield to the sun.",
          "Turn grapes to raisins!"
        ],
        "player": [
          "Sun, you thirsty lamp.",
          "My river cools every vine.",
          "Snacks float past your heat!"
        ],
        "reply": [
          "Sunbeams invade the cool stream.",
          "Your grapes boil in the light!"
        ],
        "result": [
          "Water cooled the sun.",
          "Steam curls off the picnic cloth,",
          "Lunch floats home laughing."
        ]
      },
      "red": {
        "mission": [
          "Hear fire sizzle,",
          "As steam puffs above the plate,",
          "Stealing the burgers!"
        ],
        "player": [
          "Fire, take a bath!",
          "My waves carry the burgers.",
          "Give your sparks a nap!"
        ],
        "reply": [
          "Fire boils your brave little wave.",
          "You will be soup by sundown!"
        ],
        "result": [
          "Water snuffed fire.",
          "Embers fade beside the grapes.",
          "Steam signs the scorecard!"
        ]
      },
      "queen": {
        "mission": [
          "The Queen dams the stream.",
          "Yellow jackets drink the shore",
          "SnackJacket arrives!"
        ],
        "player": [
          "Queen, your crown will float.",
          "Water ants flood every moat.",
          "Jackets drift away!"
        ],
        "reply": [
          "My jackets do not fear rain.",
          "We drink tribute through a straw!"
        ],
        "result": [
          "Water rose above.",
          "Queen SnackJacket checks her snacks,",
          "Crying out for grapes!"
        ]
      }
    },
    "pink": {
      "black": {
        "mission": [
          "Night folds petals shut.",
          "If you get your beauty sleep,",
          "We can have the snacks!"
        ],
        "player": [
          "Night smells every bloom",
          "And the pollen makes you sneeze.",
          "The we steal the eggs!"
        ],
        "reply": [
          "Darkness keeps the garden still.",
          "Your flowers will rest in peace!"
        ],
        "result": [
          "Flowers beat the night",
          "And woke early to sweet snacks.",
          "Spring lasts all season!"
        ]
      },
      "blue": {
        "mission": [
          "Streams flood through pink roots.",
          "Petals slip on river rocks.",
          "Flowers have no flow!"
        ],
        "player": [
          "Water, watch us bloom.",
          "Our flow drinks up your best",
          "Soldiers for the win!"
        ],
        "reply": [
          "Water feeds your hungry roots.",
          "Now experience a drought!"
        ],
        "result": [
          "Flowers drank the flood.",
          "Roots curled tight around the grapes",
          "And water lost lunch!"
        ]
      },
      "white": {
        "mission": [
          "Clouds block morning blooms.",
          "Petals cry for borrowed light.",
          "Snacks snatched in the shade!"
        ],
        "player": [
          "Move your puffy face!",
          "Flowers cower in the shade.",
          "We will have pizza!"
        ],
        "reply": [
          "Clouds will blanket every bloom.",
          "Petals power through the mist!"
        ],
        "result": [
          "Flowers fanned the clouds.",
          "Petals gleam with stolen snacks;",
          "It smells like pollen…"
        ]
      },
      "yellow": {
        "mission": [
          "Sun dries every bloom.",
          "Petals curl around the crumbs.",
          "The flowers will roast!"
        ],
        "player": [
          "Your lunch is too burnt.",
          "Flower ants shade every snack",
          "Under their beauty."
        ],
        "reply": [
          "Sunlight controls all that blooms.",
          "Your petals bow to my heat!"
        ],
        "result": [
          "Flowers tamed the sun.",
          "Pink Beauties saved every snack",
          "And crumbs smell like spring!"
        ]
      },
      "red": {
        "mission": [
          "Fire licks the weeds.",
          "Ants guarding the picnic edge.",
          "Flowers don’t bloom here!"
        ],
        "player": [
          "You with your hot breath,",
          "Fire is suffocated",
          "By bright pink pollen!"
        ],
        "reply": [
          "Fire roasts your tiny garden",
          "While your petals curl to chips!"
        ],
        "result": [
          "Flowers smothered smoke!",
          "Petals waved through the cooled ash",
          "And we stole the grapes!"
        ]
      },
      "queen": {
        "mission": [
          "The Queen raids the bloom.",
          "Yellow jackets shake the roots",
          "Of all the SnowCones!"
        ],
        "player": [
          "Queen, buzz somewhere else.",
          "Pollen is what feeds the crown!",
          "Snacks belong to us!"
        ],
        "reply": [
          "My swarm owns the picnic field.",
          "I pollinate the flowers!"
        ],
        "result": [
          "Flowers swarmed the crown.",
          "Queen SnackJacket sneezed two times;",
          "Petals kept the snacks!"
        ]
      }
    },
    "white": {
      "black": {
        "mission": [
          "Night swallows the sky.",
          "We hide crumbs beneath your fog.",
          "Clouds, pass by the snacks!"
        ],
        "player": [
          "The moon gives us light",
          "And it lets us shine at night.",
          "Clouds see all the snacks!"
        ],
        "reply": [
          "Night crawls higher than your mist.",
          "Stars poke holes in all your clouds!"
        ],
        "result": [
          "Clouds blanket the night.",
          "No one notices stolen snacks.",
          "Stars ask where lunch went!"
        ]
      },
      "blue": {
        "mission": [
          "Water calls clouds down.",
          "Rain returns to hungry streams.",
          "Snacks sink as you fall!"
        ],
        "player": [
          "Water, look up now.",
          "Clouds lift the snacks from rivers.",
          "Now you’ll have no lunch!"
        ],
        "reply": [
          "Water surfs below your fluff.",
          "Every cloud becomes my stream!"
        ],
        "result": [
          "Clouds rose from the stream.",
          "Snacks rode mist to puffy heights.",
          "Water is washed up!"
        ]
      },
      "pink": {
        "mission": [
          "Flowers trap the mist.",
          "Petals drink up cloudy snacks.",
          "Roots never let go!"
        ],
        "player": [
          "Flowers, chase my shade",
          "As snacks bloom above your reach.",
          "Cloudy with meatballs!"
        ],
        "reply": [
          "Petals climb through cloudy air.",
          "Your mist smells like flower food!"
        ],
        "result": [
          "Clouds crowded the bloom.",
          "Petals waved for stolen snacks.",
          "Flowers missed the plate!"
        ]
      },
      "yellow": {
        "mission": [
          "Sun beams through the mist",
          "While clouds guard tasty snacks.",
          "Forecast calls for sun!"
        ],
        "player": [
          "We’ll cover you up",
          "While snacks dance around your plate.",
          "We reflect your heat!"
        ],
        "reply": [
          "Sunlight cuts through every cloud.",
          "Your puffy clouds cannot hide!"
        ],
        "result": [
          "Clouds covered the sun.",
          "Shady crumbs were found above",
          "But not on his plate."
        ]
      },
      "red": {
        "mission": [
          "We make our own clouds.",
          "You’ll cough over and over",
          "At the clouds of smoke!"
        ],
        "player": [
          "Fire, you are burnt out!",
          "Smoke still comes before fire",
          "And we own that too!"
        ],
        "reply": [
          "You will see the smoke signals",
          "Before mist can hide the snacks!"
        ],
        "result": [
          "Clouds overcame flames.",
          "Smoke fades from their puffy paws.",
          "Fire lost the bun!"
        ]
      },
      "queen": {
        "mission": [
          "The Queen rules the sky.",
          "Yellow jackets buzz through mist.",
          "Make way for the Queen!"
        ],
        "player": [
          "Queen, your wings are loud.",
          "Under the cover of clouds",
          "We will steal the snacks!"
        ],
        "reply": [
          "My swarm cuts through puffy skies.",
          "Misty clouds will pay tribute!"
        ],
        "result": [
          "Clouds covered the snacks.",
          "The Queen is still lost the fog",
          "Buzz with empty hands!"
        ]
      }
    },
    "yellow": {
      "black": {
        "mission": [
          "Night cools every trail.",
          "The moon waits for daylight’s fall,",
          "Then we steal the snacks!"
        ],
        "player": [
          "Night, wake up and squint.",
          "Solar beams light every crumb.",
          "Snacks shine for my hive!"
        ],
        "reply": [
          "Night eats lunch when daylight fades.",
          "Your bright crumbs burn out by dusk!"
        ],
        "result": [
          "Light cracked open night.",
          "Moon snacks glowed like tiny grills.",
          "Darkness dropped the plate!"
        ]
      },
      "blue": {
        "mission": [
          "Water chills in sun.",
          "Streams hide grapes from summer months",
          "To keep all the snacks fresh!"
        ],
        "player": [
          "Water, steam away.",
          "The sun brings a drought on you",
          "Until snacks are won!"
        ],
        "reply": [
          "Water laughs with a loud splash.",
          "Your beams slip on river stones!"
        ],
        "result": [
          "Sun boiled water.",
          "Snacks turned sweet at the picnic.",
          "Water lost the shine!"
        ]
      },
      "pink": {
        "mission": [
          "Flowers chase the sun",
          "And lay claim to golden snacks.",
          "Heat feeds hungry blooms!"
        ],
        "player": [
          "Flowers, thank my light.",
          "The sun gives you snacks for lunch.",
          "But I want SnowCones!"
        ],
        "reply": [
          "Petals block your golden beams,",
          "While ants march in the shade!"
        ],
        "result": [
          "Sun fed, then outshined.",
          "Petals bowed beside warm snacks",
          "And offered them up!"
        ]
      },
      "white": {
        "mission": [
          "Storms provide cover",
          "And forecast no sun today.",
          "Clouds will fill the sky!"
        ],
        "player": [
          "Clouds, stop blocking lunch.",
          "Solar beams burn through your fluff.",
          "Snacks shine in my rays!"
        ],
        "reply": [
          "Clouds siesta during noon.",
          "Your sunlight will stay hungry!"
        ],
        "result": [
          "Sun splits every cloud.",
          "Memories of stolen snacks.",
          "Clouds lost their cover!"
        ]
      },
      "red": {
        "mission": [
          "Fire is hotter",
          "Now that you are near the blaze.",
          "Sun will feel the heat!"
        ],
        "player": [
          "You are crumbs to me.",
          "Solar beams are the real blaze",
          "That cooks all the snacks!"
        ],
        "reply": [
          "Fire dances without daylight;",
          "Your sun clocks out at dinner!"
        ],
        "result": [
          "Sol outshined the blaze.",
          "Fire is stuck with hunger",
          "For snacks that they lost!"
        ]
      },
      "queen": {
        "mission": [
          "Wings hiding the sun!",
          "Together, Yellow jackets",
          "Can steal all the snacks!"
        ],
        "player": [
          "Queen, face the daylight.",
          "Solar beams melt every wing",
          "Like summer SnowCones!"
        ],
        "reply": [
          "My crown shines brighter than noon.",
          "You will pay a royal toll!"
        ],
        "result": [
          "The sun blinds the crown.",
          "Queen SnackJacket drops her fork",
          "And cries for her snacks!"
        ]
      }
    },
    "red": {
      "black": {
        "mission": [
          "Night smothers the spark.",
          "Midnight chills the smoky grill",
          "And Fire loses!"
        ],
        "player": [
          "Night, fear my red glow.",
          "Fire ants light the snack road",
          "And can’t lose their way!"
        ],
        "reply": [
          "Night wraps fire in velvet dark.",
          "Flames get tired and burn out!"
        ],
        "result": [
          "Fire lit up night.",
          "The grill smoked through the twilight,",
          "Now we’ll have burgers!"
        ]
      },
      "blue": {
        "mission": [
          "Water hunts the flame.",
          "Waves hiss over burger grease.",
          "Fires get flooded!"
        ],
        "player": [
          "Water, pull back your tides.",
          "Hot fire steams every grape.",
          "For lunch we’ll have jam!"
        ],
        "reply": [
          "Water makes your hot feet hiss.",
          "Your coals will be put to rest!"
        ],
        "result": [
          "Fire boiled the tide.",
          "Steam bowed out beside the snacks.",
          "Water left hungry!"
        ]
      },
      "pink": {
        "mission": [
          "Flowers use the grill,",
          "Creating aromatic",
          "Dinners for the bloom!"
        ],
        "player": [
          "Flowers, toast with me.",
          "Fire ants roast your pollen shields.",
          "You’ll make us pizza!"
        ],
        "reply": [
          "Petals repel your sparks.",
          "Your flames are just a big sneeze!"
        ],
        "result": [
          "Fire scorched the blooms.",
          "Petals melted like SnowCones.",
          "Flowers dropped the snacks!"
        ]
      },
      "white": {
        "mission": [
          "Clouds rise above flames,",
          "Going back to the heavens.",
          "Stay here with burnt snacks!"
        ],
        "player": [
          "My smoke reaches you",
          "Like messages in the sky.",
          "I like crispy snacks!"
        ],
        "reply": [
          "Clouds will outgrow your fire",
          "And save themselves from burnt snacks!"
        ],
        "result": [
          "Fire in the sky.",
          "We brought coals to the feast",
          "It’s a job well done!"
        ]
      },
      "yellow": {
        "mission": [
          "Sun power is more",
          "Hot than any earthly blaze.",
          "SunBeams for the win!"
        ],
        "player": [
          "Sun, you clock out soon.",
          "My sparks dance after sundown.",
          "Snacks roast in my hands!"
        ],
        "reply": [
          "Sun made fire’s first orange spark.",
          "Your flames beg noon for power!"
        ],
        "result": [
          "Fire beat the sun.",
          "Gold crumbs turned extra crispy.",
          "Noon spilled the ketchup!"
        ]
      },
      "queen": {
        "mission": [
          "The queen hoards the heat.",
          "Yellow jackets guard the grill",
          "That fire calls home!"
        ],
        "player": [
          "Queen, your grill is mine.",
          "Fire ants circle ‘round like",
          "Great balls of fire!"
        ],
        "reply": [
          "My crown invented cookouts;",
          "Your flames need a permit first!"
        ],
        "result": [
          "Fire lit the grill!",
          "Queen SnackJacket fans her cape,",
          "Now, with crispy wings."
        ]
      }
    },
    "queen": {
      "black": {
        "mission": [
          "Your hive will not see",
          "The light of day before the night",
          "Steals food from your plate!"
        ],
        "player": [
          "Night hides from the crown.",
          "We fly higher than the moon",
          "We’ll eat stars as crumbs!"
        ],
        "reply": [
          "We don’t kneel to buzzing crowns.",
          "Under the veil, we’ll leave full."
        ],
        "result": [
          "Queen stung through the night.",
          "Yellow Jackets fly with snacks.",
          "Stars file complaints."
        ]
      },
      "blue": {
        "mission": [
          "Water guards the shores.",
          "Royal wings can’t fly in rain.",
          "Queens are forbidden!"
        ],
        "player": [
          "Water, bring tribute.",
          "My royal swarm drinks the stream.",
          "Cone taxes are due!"
        ],
        "reply": [
          "Water does not pay your toll.",
          "Your crown floats like soggy toast!"
        ],
        "result": [
          "With rivers parted,",
          "Water coughs up hidden grapes.",
          "Tribute tastes like juice!"
        ]
      },
      "pink": {
        "mission": [
          "Flowers guard our sweets.",
          "Petals crowd the royal path.",
          "Off-limits bouquet"
        ],
        "player": [
          "Flowers, bloom for me!",
          "We will wear pollen like gold",
          "And fill up on snacks."
        ],
        "reply": [
          "Flowers don’t bow to buzzing.",
          "Your crown makes the roses sneeze"
        ],
        "result": [
          "Wings shake every bloom.",
          "Petals drop their hidden snacks.",
          "Food tax has been paid."
        ]
      },
      "white": {
        "mission": [
          "Clouds hide royal snacks.",
          "Your wings falter in the mist.",
          "The crown stays hungry!"
        ],
        "player": [
          "Clear the royal skies.",
          "My jackets buzz through your fluff.",
          "Deliver snacks now!"
        ],
        "reply": [
          "We hide a thousand crumbs when",
          "Calling for cloudy weather!"
        ],
        "result": [
          "I parted the clouds!",
          "Mist covered snacks on my cape",
          "Breathing in clear air."
        ]
      },
      "yellow": {
        "mission": [
          "Sun guards golden goods.",
          "Royal wings melt in the heat.",
          "Queen won’t snack today!"
        ],
        "player": [
          "Dim for they ruler!",
          "My crown reflects light your way",
          "And remains untouched!"
        ],
        "reply": [
          "Sunlight creates all the snacks",
          "And thus we will take them back!"
        ],
        "result": [
          "The sun was no match",
          "For Yellow Jacket fury!",
          "The Queen rules the sky!"
        ]
      },
      "red": {
        "mission": [
          "Fire guards the grill.",
          "Royal wings face smoky ants.",
          "No fly zone here!"
        ],
        "player": [
          "Fire, hand me lunch!",
          "My royal cape fears no smoke.",
          "Burgers know my name."
        ],
        "reply": [
          "Fire does not serve your jacket",
          "Your crown smells like burnt mustard"
        ],
        "result": [
          "Queen controlled cinder.",
          "Fire dropped the final burger.",
          "We have all the snacks!"
        ]
      }
    }
  }
});
// End Ant Attack Story Script v1



const foodCatalog = Object.freeze([
  { name: 'grapes',   label: 'Grapes',   emoji: '🍇', weight: 2, src: 'aa_grapes.png',   fallback: 'grapes.png' },
  { name: 'orange',   label: 'Orange',   emoji: '🍊', weight: 3, src: 'aa_orange.png',   fallback: 'orange.png' },
  { name: 'egg',      label: 'Egg',      emoji: '🥚', weight: 4, src: 'aa_egg.png',      fallback: 'egg.png' },
  { name: 'pizza',    label: 'Pizza',    emoji: '🍕', weight: 5, src: 'aa_pizza.png',    fallback: 'pizza.png' },
  { name: 'snowcone', label: 'SnowCone', emoji: '🍧', weight: 6, src: () => getThemeSnowConeFoodPng(), fallback: ['aa_snowcone.png', 'snowcone.png'] },
  { name: 'burger',   label: 'Burger',   emoji: '🍔', weight: 7, src: 'aa_burger.png',   fallback: 'burger.png' },
]);

let playerAntPool = 10;
let aiAntPool      = Infinity;
let playerScore    = 0;
let aiScore        = 0;
let playerAntsAttached = 0;
let aiAntsAttached     = 0;
let currentFood        = null;
let previousFoodName   = null;
let roundInProgress    = false;
let currentDirection   = null; // 'player' | 'ai'
let foodTween          = null;

/*
  SCMF 1.6.0 — Food Rotation + Round Telemetry v1

  Food remains random, but the immediately previous food is
  excluded from the next draw.

  This prevents:
  - SnowCone followed by SnowCone
  - Burger followed by Burger
  - any other immediate duplicate

  Every other food keeps equal odds during that draw.
*/
function selectNextFoodForRound() {
  const eligibleFoods =
    previousFoodName
      ? foodCatalog.filter((food) => {
          return food.name === previousFoodName
            ? false
            : true;
        })
      : foodCatalog;

  const selectedFood =
    eligibleFoods[
      Math.floor(
        Math.random() *
        eligibleFoods.length
      )
    ] || foodCatalog[0];

  previousFoodName =
    selectedFood.name;

  return selectedFood;
}

let updatePopUICallback = null;

let currentPhase = 'choose'; // choose | storyIntro | versus | battle | results | ending
let selectedAntId = 'black';
let currentBattleMode = 'story';
let currentPlayerAnt = ANT_ROSTER[0];
let currentRivalAnt = ANT_ROSTER[1];
let currentStoryRunWasReplay = false;

let arcadeWaveRun = {
  active: false,
  playerAntId: null,
  charge: 0,
};

let waveInProgress = false;
let waveTimeline = null;
let waveStageEl = null;
let waveAnimationToken = 0;

const activeAnts = [];
let redAntTimeouts = [];
let phaseTimeouts = [];


let _resizeObs   = null;
let _domObs      = null;
const _boundHandlers = new WeakMap(); // container -> { onPointerDown, onBackCapture }

// ────────────────────────────────────────────────────────────────────────────────
// Utilities / guards
// ────────────────────────────────────────────────────────────────────────────────
function assetUrl(filename) {
  return `${ASSET_BASE}${filename}`;
}

function isResolvedAssetUrl(value) {
  const src = typeof value === 'function' ? value() : value;
  if (!src) return false;

  const text = String(src);
  return (
    text.startsWith('/') ||
    text.startsWith('http://') ||
    text.startsWith('https://') ||
    text.startsWith('capacitor://') ||
    text.startsWith('file://') ||
    text.startsWith('data:')
  );
}

function resolveAssetUrl(value, baseUrl = ASSET_BASE) {
  const raw = typeof value === 'function' ? value() : value;
  if (!raw) return '';

  const text = String(raw).trim();
  if (!text) return '';

  return isResolvedAssetUrl(text) ? text : `${baseUrl}${text}`;
}

function normalizeThemePackageId(rawTheme = 'default') {
  const raw = String(rawTheme || 'default').trim();
  const theme = raw
    .toLowerCase()
    .replaceAll(' ', '_')
    .replaceAll('-', '_');

  const aliases = {
    menubackground: 'default',
    menu_background: 'default',
    default_theme: 'default',
    standard: 'default',

    xmas: 'christmas',
    christmas_01: 'christmas',

    new_year: 'newyear',
    newyears: 'newyear',
    new_years: 'newyear',

    valentines: 'valentine',
    valentine_day: 'valentine',

    fourth: 'freedom',
    fourth_of_july: 'freedom',
    july4: 'freedom',
    july_4: 'freedom',

    autumn: 'fall',
  };

  if (aliases[theme]) return aliases[theme];

  const cosmicMatch = theme.match(/^cosmic_?0?([1-7])$/);
  if (cosmicMatch) return `cosmic_0${cosmicMatch[1]}`;

  const allowed = new Set([
    'default',
    'spring',
    'summer',
    'fall',
    'winter',
    'halloween',
    'harvest',
    'christmas',
    'freedom',
    'newyear',
    'valentine',
    'cosmic_01',
    'cosmic_02',
    'cosmic_03',
    'cosmic_04',
    'cosmic_05',
    'cosmic_06',
    'cosmic_07',
  ]);

  return allowed.has(theme) ? theme : 'default';
}

function getActiveThemePackageId() {
  const candidates = [
    appState?.settings?.theme,
    appState?.settings?.menuTheme,
    appState?.settings?.themeId,
    appState?.settings?.selectedTheme,
    appState?.settings?.visualPackage,
    appState?.settings?.visualTheme,
    appState?.profile?.theme,
    appState?.profile?.selectedTheme,
    appState?.theme,
    appState?.selectedTheme,
    globalThis.__SCMF_ACTIVE_THEME_ID,
    document?.documentElement?.dataset?.theme,
    document?.body?.dataset?.theme,
  ];

  const found = candidates.find((value) => {
    return typeof value === 'string' && value.trim().length > 0;
  });

  return normalizeThemePackageId(found || 'default');
}

function menuPackageAssetUrl(packageId, filename = 'centerCone.png') {
  return `${MENU_PACKAGE_ASSET_BASE}${normalizeThemePackageId(packageId)}/${filename}`;
}

function getThemeSnowConeFoodPng() {
  return menuPackageAssetUrl(getActiveThemePackageId(), 'centerCone.png');
}

function getFoodPrimarySrc(food) {
  if (food?.name === 'snowcone') {
    return getThemeSnowConeFoodPng();
  }

  return food?.src || '';
}

function getFoodFallbackSrc(food) {
  if (food?.name === 'snowcone') {
    return ['aa_snowcone.png', food?.fallback || 'snowcone.png'];
  }

  return food?.fallback || null;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function aliveGuard(container) {
  return ANT.alive && ANT.root === container && document.body.contains(container);
}

function markAntAttackShell(container) {
  container?.classList?.add('aa-ant-root');

  const stage = container?.closest?.('.kc-activity-stage');
  const grid = container?.closest?.('.kc-activity-grid');

  stage?.classList?.add('aa-ant-stage-root');
  grid?.classList?.add('aa-ant-grid-root');
}

function unmarkAntAttackShell(container) {
  container?.classList?.remove('aa-ant-root');

  const stage = container?.closest?.('.kc-activity-stage');
  const grid = container?.closest?.('.kc-activity-grid');

  stage?.classList?.remove('aa-ant-stage-root');
  grid?.classList?.remove('aa-ant-grid-root');
}



function getAntElementKey(antOrId) {
  const id = typeof antOrId === 'string'
    ? getAntById(antOrId).id
    : getAntById(antOrId?.id).id;

  const map = {
    black: 'night',
    blue: 'water',
    pink: 'flower',
    white: 'cloud',
    yellow: 'sun',
    red: 'fire',
    queen: 'queen',
  };

  return map[id] || 'night';
}

function getAntRoyalName(antOrId) {
  const ant = typeof antOrId === 'string'
    ? getAntById(antOrId)
    : getAntById(antOrId?.id);

  if (ant.id === 'queen') return 'Queen SnackJacket';

  return `Royal ${ant.name}`;
}

function getAntEndingPng(antOrId) {
  const ant = typeof antOrId === 'string'
    ? getAntById(antOrId)
    : getAntById(antOrId?.id);

  const endingMap = {
    black: 'aa_night_ending.png',
    blue: 'aa_blue_ending.png',
    pink: 'aa_pink_ending.png',
    white: 'aa_white_ending.png',
    yellow: 'aa_yellow_ending.png',
    red: 'aa_fire_ending.png',
    queen: 'aa_queen_ending.png',
  };

  return endingMap[ant.id] || endingMap.black;
}

function getAntById(id) {
  if (id === QUEEN_SNACKJACKET.id) return QUEEN_SNACKJACKET;
  return ANT_ROSTER.find((ant) => ant.id === id) || ANT_ROSTER[0];
}

function getAnyAntById(id) {
  return getAntById(id);
}

function getNormalAntIds() {
  return ANT_ROSTER.map((ant) => ant.id);
}

function getKnownAntIds() {
  return [...getNormalAntIds(), QUEEN_SNACKJACKET.id];
}

function isKnownAntId(antId) {
  return getKnownAntIds().includes(antId);
}

function getChooserRoster() {
  const save = readAntAttackSave();

  return isAntUnlockedInSave(save, QUEEN_SNACKJACKET.id)
    ? [...ANT_ROSTER, QUEEN_SNACKJACKET]
    : [...ANT_ROSTER];
}

function getStoryRouteForAnt(antId) {
  const id = getAntById(antId).id;
  const route = STORY_ROUTE_BY_ANT[id] || STORY_ROUTE_BY_ANT.black;

  return route.filter((rivalId) => {
    return isKnownAntId(rivalId) && rivalId !== id;
  });
}


function getFirstStoryRivalId(antId) {
  return getStoryRouteForAnt(antId)[0] || null;
}

function isStoryRivalValidForAnt(antId, rivalId) {
  return !!rivalId && getStoryRouteForAnt(antId).includes(rivalId);
}

function inferWinsFromNextRival(antId, nextRivalId) {
  const route = getStoryRouteForAnt(antId);
  const index = route.indexOf(nextRivalId);

  return index > 0 ? index : 0;
}

function clampWaveCharge(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;

  return Math.max(
    0,
    Math.min(WAVE_CHARGE_MAX, Math.floor(numeric))
  );
}

function createAntStoryState(antId, existing = {}) {
  const id = getAntById(antId).id;
  const route = getStoryRouteForAnt(id);
  const firstRivalId = route[0] || null;

  const existingNext = existing?.nextRivalId;
  const nextRivalId = isStoryRivalValidForAnt(id, existingNext)
    ? existingNext
    : firstRivalId;

  const inferredWins = inferWinsFromNextRival(id, nextRivalId);
  const wins = Number.isFinite(+existing?.wins)
    ? Math.max(0, +existing.wins)
    : inferredWins;

  const hasCompletedRoute = route.length > 0 && wins >= route.length;
  const complete = !!existing?.complete || hasCompletedRoute;

  return {
    started: !!existing?.started,
    prologueSeen: !!existing?.prologueSeen,
    missionSeen: !!existing?.missionSeen,
    complete,
    nextRivalId,
    wins,
    waveCharge: complete
      ? 0
      : clampWaveCharge(existing?.waveCharge),
  };
}

function normalizeStorySave(parsedStory = {}, fallbackStory = {}) {
  const parsed = parsedStory && typeof parsedStory === 'object' ? parsedStory : {};
  const sourceStories = {
    ...(fallbackStory?.storyByAnt || {}),
    ...(fallbackStory?.antStories || {}),
    ...(parsed?.storyByAnt || {}),
    ...(parsed?.antStories || {}),
  };

  // Migration from the older single global story path into Black Ant's story.
  if (parsed?.nextRivalId && !sourceStories.black) {
    sourceStories.black = {
      started: !!parsed.started,
      prologueSeen: !!parsed.prologueSeen,
      missionSeen: !!parsed.missionSeen,
      complete: !!parsed.complete,
      nextRivalId: parsed.nextRivalId,
      wins: inferWinsFromNextRival('black', parsed.nextRivalId),
    };
  }

  const storyByAnt = {};
  getKnownAntIds().forEach((antId) => {
    storyByAnt[antId] = createAntStoryState(antId, sourceStories[antId]);
  });

  return {
    nextRivalId: storyByAnt.black.nextRivalId,
    complete: !!storyByAnt.black.complete,
    antStories: storyByAnt,
    storyByAnt,
  };
}


function createReplayStoryState(antId, existing = {}) {
  const id = getAntById(antId).id;
  const route = getStoryRouteForAnt(id);
  const firstRivalId = route[0] || null;

  const nextCandidate = existing?.nextRivalId;
  const nextRivalId = isStoryRivalValidForAnt(id, nextCandidate)
    ? nextCandidate
    : firstRivalId;

  const wins = Number.isFinite(+existing?.wins)
    ? Math.max(0, +existing.wins)
    : 0;

  const active = !!existing?.active && !!nextRivalId;
  const complete = !!existing?.complete;

  return {
    active: complete ? false : active,
    complete,
    prologueSeen: !!existing?.prologueSeen,
    missionSeen: !!existing?.missionSeen,
    nextRivalId,
    wins,
    waveCharge: complete
      ? 0
      : clampWaveCharge(existing?.waveCharge),
  };
}

function ensureReplayStoryBucket(save) {
  if (!save.replayStoryByAnt || typeof save.replayStoryByAnt !== 'object') {
    save.replayStoryByAnt = {};
  }

  return save.replayStoryByAnt;
}

function getReplayStoryState(antId, save = readAntAttackSave()) {
  const id = getAntById(antId).id;
  const bucket = save?.replayStoryByAnt || {};

  return createReplayStoryState(id, bucket[id]);
}

function hasActiveReplayStory(antId, save = readAntAttackSave()) {
  const replay = getReplayStoryState(antId, save);
  return !!replay.active && !replay.complete;
}

function writeReplayStoryState(antId, nextState) {
  const id = getAntById(antId).id;
  const save = readAntAttackSave();
  const bucket = ensureReplayStoryBucket(save);

  bucket[id] = createReplayStoryState(id, nextState);
  writeAntAttackSave(save);
}

function startReplayStoryProgress(antId) {
  const id = getAntById(antId).id;

  writeReplayStoryState(id, {
    active: true,
    complete: false,
    prologueSeen: false,
    missionSeen: false,
    nextRivalId: getFirstStoryRivalId(id),
    wins: 0,
    waveCharge: 0,
  });
}

function clearReplayStoryProgress(antId, save = null) {
  const id = getAntById(antId).id;
  const targetSave = save || readAntAttackSave();
  const bucket = ensureReplayStoryBucket(targetSave);

  delete bucket[id];

  if (!save) {
    writeAntAttackSave(targetSave);
  }

  return targetSave;
}

function markReplayPrologueSeen(antId) {
  const id = getAntById(antId).id;
  const replay = getReplayStoryState(id);

  if (!replay.active) return;

  writeReplayStoryState(id, {
    ...replay,
    prologueSeen: true,
  });
}

function markReplayMissionSeen(antId) {
  const id = getAntById(antId).id;
  const replay = getReplayStoryState(id);

  if (!replay.active) return;

  writeReplayStoryState(id, {
    ...replay,
    missionSeen: true,
  });
}

function advanceReplayStoryProgressInSave(save, playerAntId, defeatedRivalId) {
  const playerId = getAntById(playerAntId).id;
  const rivalId = getAnyAntById(defeatedRivalId).id;
  const route = getStoryRouteForAnt(playerId);
  const currentIndex = route.indexOf(rivalId);

  if (currentIndex < 0) {
    return {
      advanced: false,
      replayComplete: false,
      nextRivalId: getFirstStoryRivalId(playerId),
      wins: 0,
    };
  }

  const nextRivalId = route[currentIndex + 1] || null;
  const replayComplete = !nextRivalId;
  const bucket = ensureReplayStoryBucket(save);
  const replayState = createReplayStoryState(playerId, bucket[playerId]);

  if (replayComplete) {
    delete bucket[playerId];

    return {
      advanced: true,
      replayComplete: true,
      nextRivalId: getFirstStoryRivalId(playerId),
      wins: route.length,
    };
  }

  bucket[playerId] = createReplayStoryState(playerId, {
    active: true,
    complete: false,
    prologueSeen: true,
    missionSeen: true,
    nextRivalId,
    wins: currentIndex + 1,
    waveCharge: replayState.waveCharge,
  });

  return {
    advanced: true,
    replayComplete: false,
    nextRivalId,
    wins: currentIndex + 1,
  };
}

function getAntStoryState(antId, save = readAntAttackSave()) {
  const id = getAntById(antId).id;
  return createAntStoryState(
    id,
    save?.story?.storyByAnt?.[id] || save?.story?.antStories?.[id]
  );
}

function writeAntStoryState(antId, nextState) {
  const id = getAntById(antId).id;
  const save = readAntAttackSave();

  save.story.storyByAnt[id] = createAntStoryState(id, nextState);
  save.story.antStories = { ...save.story.storyByAnt };

  if (id === 'black') {
    save.story.nextRivalId = save.story.storyByAnt.black.nextRivalId;
    save.story.complete = !!save.story.storyByAnt.black.complete;
  }

  writeAntAttackSave(save);
}

function startArcadeWaveRun(playerAntId) {
  arcadeWaveRun = {
    active: true,
    playerAntId: getAntById(playerAntId).id,
    charge: 0,
  };
}

function endArcadeWaveRun() {
  arcadeWaveRun = {
    active: false,
    playerAntId: null,
    charge: 0,
  };
}

function getCurrentWaveCharge() {
  const playerId = getAntById(currentPlayerAnt?.id).id;

  if (currentBattleMode === 'story') {
    if (currentStoryRunWasReplay) {
      return getReplayStoryState(playerId).waveCharge;
    }

    return getAntStoryState(playerId).waveCharge;
  }

  if (
    currentBattleMode === 'arcade' &&
    arcadeWaveRun.active &&
    arcadeWaveRun.playerAntId === playerId
  ) {
    return clampWaveCharge(arcadeWaveRun.charge);
  }

  return 0;
}

function setCurrentWaveCharge(nextCharge) {
  const playerId = getAntById(currentPlayerAnt?.id).id;
  const charge = clampWaveCharge(nextCharge);

  if (currentBattleMode === 'story') {
    if (currentStoryRunWasReplay) {
      const replay = getReplayStoryState(playerId);

      writeReplayStoryState(playerId, {
        ...replay,
        waveCharge: charge,
      });

      return charge;
    }

    const story = getAntStoryState(playerId);

    writeAntStoryState(playerId, {
      ...story,
      waveCharge: charge,
    });

    return charge;
  }

  if (
    currentBattleMode === 'arcade' &&
    arcadeWaveRun.active &&
    arcadeWaveRun.playerAntId === playerId
  ) {
    arcadeWaveRun.charge = charge;
  }

  return charge;
}

function updateWaveButton(container) {
  const button = container?.querySelector?.('#aa-wave-button');
  if (!button) return;

  const charge = getCurrentWaveCharge();
  const isReady = charge >= WAVE_CHARGE_MAX;

  const canFire =
    isReady &&
    roundInProgress &&
    !waveInProgress &&
    currentPhase === 'battle';

  button.dataset.waveCharge = String(charge);
  button.classList.toggle('is-empty', charge === 0);
  button.classList.toggle('is-charging', charge > 0 && !isReady);
  button.classList.toggle('is-ready', isReady);
  button.classList.toggle('is-firing', waveInProgress);

  button.style.setProperty(
    '--aa-wave-angle',
    `${charge * (360 / WAVE_CHARGE_MAX)}deg`
  );

  const count = button.querySelector('.aa-wave-count');

  if (count) {
    count.textContent = `${charge}/${WAVE_CHARGE_MAX}`;
  }

  button.setAttribute(
    'aria-label',
    waveInProgress
      ? `${currentPlayerAnt.waveName} active`
      : isReady
        ? `${currentPlayerAnt.waveName} ready`
        : `${currentPlayerAnt.waveName} charge ${charge} of ${WAVE_CHARGE_MAX}`
  );

  button.disabled = !canFire;
}

function flashWaveChargeButton(container, becameReady = false) {
  const button = container?.querySelector?.('#aa-wave-button');
  if (!button) return;

  button.classList.remove(
    'just-charged',
    'just-became-ready'
  );

  void button.offsetWidth;

  button.classList.add(
    becameReady
      ? 'just-became-ready'
      : 'just-charged'
  );

  setPhaseTimeout(() => {
    button.classList.remove(
      'just-charged',
      'just-became-ready'
    );
  }, becameReady ? 900 : 620);
}

function awardWaveChargeForRound(
  container,
  {
    result,
  } = {}
) {
  /*
    SCMF 1.6.0 — Rival Speed + Three-Win Wave v1

    Every ordinary snack win earns exactly one wedge.

    Save quality still controls:
    - ant recovery
    - Camping Score
    - Perfect / Great / Good feedback

    It no longer controls access to the Wave.

    Wave-assisted wins never call this function, so firing a
    Wave cannot immediately recharge itself.
  */
  if (result === 'win') {
    const before =
      getCurrentWaveCharge();

    const after =
      setCurrentWaveCharge(
        before + 1
      );

    updateWaveButton(container);

    if (after > before) {
      flashWaveChargeButton(
        container,
        before < WAVE_CHARGE_MAX &&
        after === WAVE_CHARGE_MAX
      );
    }

    return after > before;
  }

  return false;
}

function setWaveFiringState(container, firing) {
  waveInProgress = !!firing;

  container
    ?.querySelector?.('.aa-battle-wrapper')
    ?.classList?.toggle(
      'is-wave-firing',
      waveInProgress
    );

  updateAntCount(container);
  updateWaveButton(container);
}

function getAllDeployedAnts(container) {
  return Array.from(
    container
      ?.querySelectorAll?.('.kc-ant-zone .ant-sprite') || []
  );
}

function freezeCurrentTugForWave(container) {
  killFoodTween();

  const foodWrapper =
    container?.querySelector?.('.food-with-overlay');

  try {
    gsap.killTweensOf(foodWrapper);
  } catch {}

  const attachedAnts =
    getAllDeployedAnts(container);

  attachedAnts.forEach((ant) => {
    try {
      gsap.killTweensOf(ant);
    } catch {}

    stopCrawlWiggle(ant);
  });
}

function cleanupWaveRoundDom(container) {
  const deployedAnts =
    getAllDeployedAnts(container);

  deployedAnts.forEach((ant) => {
    try {
      gsap.killTweensOf(ant);
    } catch {}

    stopCrawlWiggle(ant);

    try {
      ant.remove();
    } catch {}
  });

  activeAnts.length = 0;
  playerAntsAttached = 0;
  aiAntsAttached = 0;

  const foodContainer =
    container?.querySelector?.('.food-container');

  if (foodContainer) {
    foodContainer.innerHTML = '';

    gsap.set(
      foodContainer,
      {
        opacity: 1,
      }
    );
  }
}

/*
  SCMF 1.6.0 — Wave Recovery Message v1

  Reuses the existing green Camping round-message presentation.
  This stays local to Ant Attack so other Camping games and their
  shared round-feedback helper remain untouched.
*/
function showWaveRecoveryMessage(
  container,
  antsRecovered
) {
  const zone =
    container?.querySelector?.(
      '.kc-ant-zone'
    );

  if (!zone) return;

  zone
    .querySelectorAll(
      '.aa-wave-recovery-message'
    )
    .forEach((existing) => {
      try {
        existing.remove();
      } catch {}
    });

  const message =
    document.createElement('div');

  message.className =
    'kc-round-msg aa-wave-recovery-message';

  message.setAttribute(
    'role',
    'status'
  );

  message.setAttribute(
    'aria-live',
    'polite'
  );

  const antName =
    currentPlayerAnt?.shortName ||
    currentPlayerAnt?.name ||
    'Ant';

  message.textContent =
    `${antName}\nWave\n+${antsRecovered}`;

  /*
    Existing .kc-round-msg supplies:
    - green color
    - center position
    - Orbitron font
    - scale/fade transition

    These inline values only make its three lines readable.
  */
  message.style.whiteSpace =
    'pre-line';

  message.style.textAlign =
    'center';

  // SCMF 1.6.0 — Wave Micro Polish v3
  // Push the Wave recovery confirmation a little larger so it
  // hangs with the size/energy of the other round update text.
  message.style.lineHeight =
    '0.9';

  message.style.fontSize =
    'clamp(1.62rem, 3.85svh, 2.7rem)';

  message.style.fontWeight =
    '900';

  message.style.letterSpacing =
    '0.04em';

  message.style.padding =
    '0.5em 0.78em';

  message.style.color =
    'var(--aa-player-accent)';

  message.style.textShadow =
    '0 0 10px var(--aa-player-glow), 0 2px 6px rgba(0, 0, 0, 0.9)';

  message.style.filter =
    'drop-shadow(0 0 10px var(--aa-player-glow))';

  message.style.pointerEvents =
    'none';

  zone.appendChild(message);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      message.classList.add(
        'visible'
      );
    });
  });

  setPhaseTimeout(() => {
    message.classList.remove(
      'visible'
    );

    setPhaseTimeout(() => {
      try {
        message.remove();
      } catch {}
    }, 320);
  }, 720);
}

function finishWaveRoundWin(
  container,
  {
    waveToken,
    antSession,
  }
) {
  if (
    waveToken !== waveAnimationToken ||
    antSession !== ANT.session ||
    !aliveGuard(container) ||
    currentPhase !== 'battle'
  ) {
    return;
  }

  roundInProgress = false;

  clearAllRedTimeouts();
  killFoodTween();

  playerScore += 1;

  // SCMF 1.6.0 — Wave Tier Recovery v1
  //
  // The Wave wins the current snack immediately, but all ants that
  // were already deployed remain spent. The selected character then
  // restores its own Wave tier:
  //
  // Night  +3
  // Water  +4
  // Flower +5
  // Cloud  +6
  // Sun    +7
  // Fire   +8
  // Queen  +9
  //
  // Recovery cannot raise the usable ant pool above 10.
  // SCMF 1.6.0 — SnowCone Wave Plus Ten and iPhone Nudge v1
  //
  // SnowCone always restores the full ten-ant amount,
  // including when the snack is captured with a Wave.
  //
  // Other foods continue using the selected ant's Wave tier.
  const isSnowConeWave =
    currentFood?.name === 'snowcone';

  const waveRecovery =
    isSnowConeWave
      ? TOTAL_ANT_POOL
      : Math.max(
          0,
          Number(currentPlayerAnt?.wavePower) || 0
        );

  const antPoolBeforeRecovery =
    playerAntPool;

  playerAntPool = Math.min(
    TOTAL_ANT_POOL,
    playerAntPool + waveRecovery
  );

  const antsActuallyRecovered =
    playerAntPool -
    antPoolBeforeRecovery;

  console.log(
    '[antAttack] Wave tier recovery awarded',
    {
      playerId:
        currentPlayerAnt?.id,
      waveName:
        currentPlayerAnt?.waveName,
      foodName:
        currentFood?.name || null,
      isSnowConeWave,
      waveRecovery,
      antsActuallyRecovered,
      antPoolBeforeRecovery,
      antPoolAfterRecovery:
        playerAntPool,
    }
  );

  logAntAttackRoundData({
    result: 'win',
    food:
      currentFood,
    antsUsed:
      playerAntsAttached,
    regen:
      waveRecovery,
    viaWave:
      true,
    actualRecovered:
      antsActuallyRecovered,
    saveQuality:
      isSnowConeWave
        ? 'SnowCone Wave'
        : 'Wave',
  });

  /*
    Wave is an emergency instant-win move:
    - one snack for the player
    - attached ants remain spent
    - character-specific ants are restored
    - no Perfect / SnowCone recharge from this snack
    - flat standard Camping reward
  */
  appState.incrementPopCount(100);
  updatePopUICallback?.();

  try {
    const margin =
      playerScore - aiScore;

    document.dispatchEvent(
      new CustomEvent(
        'kcAntRoundResult',
        {
          detail: {
            result: 'win',
            viaWave: true,
            foodName:
              currentFood?.name || null,
            isSnowConeWave,
            waveRecovery,
            antsActuallyRecovered,
            playerAntPool,
            playerWins: playerScore,
            aiWins: aiScore,
            margin,
          },
        }
      )
    );
  } catch {}

  cleanupWaveRoundDom(container);

  try {
    waveStageEl?.remove?.();
  } catch {}

  waveStageEl = null;
  waveTimeline = null;

  setWaveFiringState(
    container,
    false
  );

  restoreDeployPortrait(container);

  updateScores(container);
  updateAntCount(container);
  updateWaveButton(container);

  // SCMF 1.6.0 — Wave Grab Polish v4
  //
  // Display the character's advertised Wave tier, not merely
  // the amount that physically fit beneath the 10-ant cap.
  //
  // Example:
  // Night at 10/10 still announces +3,
  // while the actual pool correctly remains 10/10.
  showWaveRecoveryMessage(
    container,
    waveRecovery
  );

  const battleWinnerKind =
    getBattleWinnerKind();

  const delayMs =
    battleWinnerKind
      ? 950
      : 950;

  setPhaseTimeout(() => {
    if (
      antSession !== ANT.session ||
      !aliveGuard(container) ||
      currentPhase !== 'battle'
    ) {
      return;
    }

    if (battleWinnerKind) {
      renderResultsScreen(
        container,
        {
          winnerKind:
            battleWinnerKind,
        }
      );

      return;
    }

    startNewRound(container);
  }, delayMs);
}

function sweepWaveRoundOffscreen(
  container,
  {
    shell,
    foodWrapper,
    zoneHeight,
    waveHeight,
    waveToken,
    antSession,
  }
) {
  if (
    waveToken !== waveAnimationToken ||
    antSession !== ANT.session ||
    !aliveGuard(container) ||
    currentPhase !== 'battle' ||
    !waveInProgress
  ) {
    return;
  }

  /*
    Rival ants continue arriving while the Wave rises.
    When the crest reaches the snack, deployment stops and
    every ant currently visible gets swept away.
  */
  roundInProgress = false;

  clearAllRedTimeouts();
  killFoodTween();

  const deployedAnts =
    getAllDeployedAnts(container);

  deployedAnts.forEach((ant) => {
    try {
      gsap.killTweensOf(ant);
    } catch {}

    stopCrawlWiggle(ant);
  });

  try {
    gsap.killTweensOf(foodWrapper);
  } catch {}

  const currentWaveY =
    Number(
      gsap.getProperty(
        shell,
        'y'
      )
    ) || 0;

  const exitY =
    zoneHeight +
    waveHeight +
    56;

  const exitDistance =
    Math.max(
      zoneHeight * 0.70,
      exitY - currentWaveY
    );

  waveTimeline =
    gsap.timeline({
      onComplete: () => {
        finishWaveRoundWin(
          container,
          {
            waveToken,
            antSession,
          }
        );
      },
    });

  waveTimeline.to(
    shell,
    {
      y: exitY,
      duration: 1.70,
      ease: 'power1.in',
    },
    0
  );

  waveTimeline.to(
    foodWrapper,
    {
      y: `+=${exitDistance}`,
      duration: 1.70,
      ease: 'power1.in',
    },
    0
  );

  if (deployedAnts.length) {
    waveTimeline.to(
      deployedAnts,
      {
        top:
          `+=${exitDistance}`,
        duration: 1.70,
        ease: 'power1.in',
      },
      0
    );
  }
}

function beginWaveRise(
  container,
  {
    shell,
    waveArt,
    foodWrapper,
    waveToken,
    antSession,
  }
) {
  if (
    waveToken !== waveAnimationToken ||
    antSession !== ANT.session ||
    !aliveGuard(container) ||
    currentPhase !== 'battle' ||
    !waveInProgress
  ) {
    return;
  }

  const zone =
    container.querySelector(
      '.kc-ant-zone'
    );

  if (!zone) {
    killWaveAnimation(container);
    updateAntCount(container);
    updateWaveButton(container);
    return;
  }

  const zoneRect =
    zone.getBoundingClientRect();

  const foodRect =
    foodWrapper.getBoundingClientRect();

  const waveRect =
    waveArt.getBoundingClientRect();

  const zoneHeight =
    Math.max(
      1,
      zoneRect.height
    );

  const waveHeight =
    Math.max(
      zoneHeight * 0.42,
      waveRect.height || 0
    );

  const foodCenterY =
    foodRect.top -
    zoneRect.top +
    (foodRect.height / 2);

  const startY =
    zoneHeight + 28;

  /*
    The Wave begins fully below the blanket.
    The crest rolls upward until it reaches the snack.
  */
  // SCMF 1.6.0 — Wave Grab Polish v4
  //
  // Bring the widened Wave up by a meaningful amount.
  // Its visible crest should now reach and slightly underlap
  // the current snack before the entire cluster is swept down.
  const crestY =
    Math.max(
      -waveHeight * 0.12,
      foodCenterY -
      (waveHeight * 0.24)
    );

  gsap.set(
    shell,
    {
      xPercent: -50,
      y: startY,
      opacity: 1,
    }
  );

  waveTimeline =
    gsap.timeline({
      onComplete: () => {
        sweepWaveRoundOffscreen(
          container,
          {
            shell,
            foodWrapper,
            zoneHeight,
            waveHeight,
            waveToken,
            antSession,
          }
        );
      },
    });

  waveTimeline.to(
    shell,
    {
      y: crestY,
      duration: 1.65,
      ease: 'power1.out',
    },
    0
  );

  /*
    Tiny crest hold so the player can see the Wave catch
    the food before the downward sweep begins.
  */
  waveTimeline.to(
    {},
    {
      duration: 0.25,
    }
  );
}

function activatePlayerWave(container) {
  if (
    !aliveGuard(container) ||
    currentPhase !== 'battle' ||
    !roundInProgress ||
    waveInProgress ||
    getCurrentWaveCharge() <
      WAVE_CHARGE_MAX
  ) {
    return;
  }

  const zone =
    container.querySelector(
      '.kc-ant-zone'
    );

  const foodWrapper =
    container.querySelector(
      '.food-with-overlay'
    );

  if (
    !zone ||
    !foodWrapper
  ) {
    return;
  }

  killWaveAnimation(
    container,
    {
      restorePortrait: false,
    }
  );

  const antSession =
    ANT.session;

  const waveToken =
    waveAnimationToken;

  /*
    Spend the resource immediately.
    Story persistence is updated here too.
  */
  setCurrentWaveCharge(0);

  setWaveFiringState(
    container,
    true
  );

  showPoweredDeployPortrait(container);
  freezeCurrentTugForWave(container);

  const stage =
    document.createElement('div');

  stage.className =
    'aa-wave-stage';

  stage.setAttribute(
    'aria-hidden',
    'true'
  );

  const shell =
    document.createElement('div');

  shell.className =
    'aa-wave-shell';

  const waveArt =
    document.createElement('img');

  waveArt.className =
    `aa-wave-art aa-wave-art-${getAntElementKey(currentPlayerAnt)}`;

  waveArt.alt = '';
  waveArt.draggable = false;

  shell.appendChild(waveArt);
  stage.appendChild(shell);
  zone.appendChild(stage);

  /*
    Park the Wave below the visible blanket before its image
    finishes loading. This prevents a one-frame pop-in.
  */
  gsap.set(
    shell,
    {
      xPercent: -50,
      y:
        Math.max(
          1,
          zone
            .getBoundingClientRect()
            .height
        ) + 40,
      opacity: 1,
    }
  );

  waveStageEl = stage;

  let animationStarted = false;

  const startAnimation = () => {
    if (animationStarted) return;

    animationStarted = true;

    beginWaveRise(
      container,
      {
        shell,
        waveArt,
        foodWrapper,
        waveToken,
        antSession,
      }
    );
  };

  waveArt.addEventListener(
    'load',
    startAnimation,
    {
      once: true,
    }
  );

  waveArt.addEventListener(
    'error',
    () => {
      waveArt.removeAttribute('src');
      waveArt.classList.add('is-fallback');
      startAnimation();
    },
    {
      once: true,
    }
  );

  waveArt.src =
    assetUrl(
      currentPlayerAnt.wavePng ||
      'aa_wave_night.png'
    );

  requestAnimationFrame(() => {
    if (
      waveArt.complete &&
      waveArt.naturalWidth > 0
    ) {
      startAnimation();
    }
  });

  /*
    Protect native play from stalling if an asset becomes
    damaged or unexpectedly unavailable.
  */
  setPhaseTimeout(() => {
    if (animationStarted) return;

    if (
      !waveArt.complete ||
      waveArt.naturalWidth <= 0
    ) {
      waveArt.removeAttribute('src');
      waveArt.classList.add('is-fallback');
    }

    startAnimation();
  }, 420);
}

function isStoryFresh(antId, save = readAntAttackSave()) {
  const state = getAntStoryState(antId, save);
  const wins = Number(state.wins) || 0;

  // Fresh means the player has not actually WON a story battle yet.
  // Peeking at the prologue / royal mission / rival talk should not turn
  // Start Story into Continue Story.
  return !state.complete && wins === 0;
}


function getStoryUnlockTextForAnt(antId) {
  const id = getAntById(antId).id;
  if (id === 'black') return 'Starter ant';

  const index = STORY_UNLOCK_CHAIN.indexOf(id);
  const previousId = index > 0 ? STORY_UNLOCK_CHAIN[index - 1] : 'black';
  const previousAnt = getAntById(previousId);

  return `Complete ${previousAnt.name} Story`;
}

function isAntUnlockedInSave(save, antId) {
  return antId === 'black' || !!save?.unlockedAnts?.[antId];
}

function canPlayStory(antId) {
  const save = readAntAttackSave();
  return isAntUnlockedInSave(save, getAntById(antId).id);
}

function isAntStoryComplete(antId, save = readAntAttackSave()) {
  return !!getAntStoryState(antId, save).complete;
}

function canPlayArcade(antId) {
  const id = getAntById(antId).id;
  const save = readAntAttackSave();

  return isAntUnlockedInSave(save, id) && isAntStoryComplete(id, save);
}

function getStoryButtonText(antId = selectedAntId) {
  if (!canPlayStory(antId)) return 'Story Mode';

  const save = readAntAttackSave();
  const state = getAntStoryState(antId, save);

  if (state.complete) {
    return hasActiveReplayStory(antId, save) ? 'Continue Replay' : 'Replay Story';
  }

  if (isStoryFresh(antId, save)) return 'Start Story';

  return 'Continue Story';
}


function getStoryButtonSubtitle(antId = selectedAntId) {
  if (!canPlayStory(antId)) {
    return getStoryUnlockTextForAnt(antId);
  }

  const save = readAntAttackSave();
  const state = getAntStoryState(antId, save);

  if (state.complete) {
    const replay = getReplayStoryState(antId, save);

    if (replay.active && !replay.complete) {
      const nextReplayRival = getAnyAntById(replay.nextRivalId || getFirstStoryRivalId(antId));
      return `Replay Next: ${nextReplayRival.name}`;
    }

    return 'Story complete';
  }

  const nextRival = getNextStoryRival(antId);
  return nextRival ? `Next: ${nextRival.name}` : 'Final snack path';
}


function getArcadeButtonSubtitle(antId = selectedAntId) {
  const ant = getAntById(antId);

  if (!canPlayStory(ant.id)) {
    return getStoryUnlockTextForAnt(ant.id);
  }

  if (!canPlayArcade(ant.id)) {
    return `Complete ${ant.name} Story`;
  }

  return ant.id === 'queen' ? 'Royal rivals' : 'Random rival';
}

function getNextStoryRival(playerAntId = selectedAntId) {
  const playerId = getAntById(playerAntId).id;
  const state = getAntStoryState(playerId);
  const nextId = state.complete
    ? getFirstStoryRivalId(playerId)
    : state.nextRivalId;

  return getAnyAntById(nextId || getFirstStoryRivalId(playerId) || 'blue');
}

function getNextUnlockAntId(completedAntId) {
  const index = STORY_UNLOCK_CHAIN.indexOf(completedAntId);
  if (index < 0 || index >= STORY_UNLOCK_CHAIN.length - 1) return null;
  return STORY_UNLOCK_CHAIN[index + 1];
}

function markStoryPrologueSeen(antId) {
  const id = getAntById(antId).id;

  if (currentStoryRunWasReplay) {
    markReplayPrologueSeen(id);
    return;
  }

  const state = getAntStoryState(id);

  writeAntStoryState(id, {
    ...state,
    started: true,
    prologueSeen: true,
  });
}


function shouldShowStoryPrologue(antId) {
  if (currentStoryRunWasReplay) {
    const replay = getReplayStoryState(antId);
    return replay.active && !replay.prologueSeen;
  }

  return isStoryFresh(antId);
}




function markStoryMissionSeen(antId) {
  const id = getAntById(antId).id;

  if (currentStoryRunWasReplay) {
    markReplayMissionSeen(id);
    return;
  }

  const state = getAntStoryState(id);

  writeAntStoryState(id, {
    ...state,
    started: true,
    missionSeen: true,
  });
}


function markAntNewlyUnlocked(antId) {
  if (!isKnownAntId(antId) || antId === 'black') return;

  const save = readAntAttackSave();
  save.unlockedAnts[antId] = true;
  save.newAntIds[antId] = true;
  save.story.storyByAnt[antId] = createAntStoryState(
    antId,
    save.story.storyByAnt?.[antId]
  );
  save.story.antStories = { ...save.story.storyByAnt };

  writeAntAttackSave(save);
}

function applyStoryVictoryProgress(playerAntId, defeatedRivalId) {
  const playerId = getAntById(playerAntId).id;
  const rivalId = getAnyAntById(defeatedRivalId).id;

  const save = readAntAttackSave();
  const state = getAntStoryState(playerId, save);
  const route = getStoryRouteForAnt(playerId);
  const currentIndex = route.indexOf(rivalId);

  if (currentIndex < 0) {
    console.warn('[antAttack] story victory ignored; invalid rival for route', {
      playerId,
      rivalId,
      route,
    });

    return {
      advanced: false,
      storyComplete: !!state.complete,
      nextRivalId: state.nextRivalId,
      unlockedAntId: null,
      unlockedAntName: '',
      replay: currentStoryRunWasReplay,
    };
  }

  if (currentStoryRunWasReplay || state.complete) {
    const replayResult = advanceReplayStoryProgressInSave(save, playerId, rivalId);

    // Protect original story completion and Arcade access forever.
    save.story.storyByAnt[playerId] = createAntStoryState(playerId, {
      ...state,
      started: true,
      prologueSeen: true,
      missionSeen: true,
      complete: true,
      nextRivalId: getFirstStoryRivalId(playerId),
      wins: Math.max(Number(state.wins) || 0, route.length),
    });
    save.story.antStories = { ...save.story.storyByAnt };

    if (playerId === 'black') {
      save.story.nextRivalId = save.story.storyByAnt.black.nextRivalId;
      save.story.complete = true;
    }

    writeAntAttackSave(save);

    console.log('[antAttack] replay story victory saved', {
      playerId,
      defeatedRivalId: rivalId,
      replayComplete: replayResult.replayComplete,
      nextRivalId: replayResult.nextRivalId,
      wins: replayResult.wins,
    });

    return {
      advanced: true,
      storyComplete: replayResult.replayComplete,
      nextRivalId: replayResult.nextRivalId,
      unlockedAntId: null,
      unlockedAntName: '',
      replay: true,
    };
  }

  const nextRivalId = route[currentIndex + 1] || null;
  const storyComplete = !nextRivalId;
  const nextWins = Math.max(Number(state.wins) || 0, currentIndex + 1);

  save.story.storyByAnt[playerId] = createAntStoryState(playerId, {
    ...state,
    started: true,
    prologueSeen: true,
    missionSeen: true,
    complete: storyComplete,
    nextRivalId: storyComplete ? getFirstStoryRivalId(playerId) : nextRivalId,
    wins: nextWins,
    waveCharge: storyComplete ? 0 : state.waveCharge,
  });
  save.story.antStories = { ...save.story.storyByAnt };

  if (playerId === 'black') {
    save.story.nextRivalId = save.story.storyByAnt.black.nextRivalId;
    save.story.complete = !!save.story.storyByAnt.black.complete;
  }

  let unlockedAntId = null;
  let unlockedAntName = '';

  if (storyComplete) {
    unlockedAntId = getNextUnlockAntId(playerId);

    if (unlockedAntId && !save.unlockedAnts?.[unlockedAntId]) {
      save.unlockedAnts[unlockedAntId] = true;
      save.newAntIds[unlockedAntId] = true;
      save.story.storyByAnt[unlockedAntId] = createAntStoryState(
        unlockedAntId,
        save.story.storyByAnt?.[unlockedAntId]
      );
      save.story.antStories = { ...save.story.storyByAnt };
      unlockedAntName = getAntById(unlockedAntId).name;
    }
  }

  writeAntAttackSave(save);

  console.log('[antAttack] story victory saved', {
    playerId,
    defeatedRivalId: rivalId,
    nextRivalId,
    storyComplete,
    unlockedAntId,
    wins: nextWins,
  });

  return {
    advanced: true,
    storyComplete,
    nextRivalId,
    unlockedAntId,
    unlockedAntName,
    replay: false,
  };
}



function getBattleTargetScore(mode = currentBattleMode, rivalId = currentRivalAnt?.id) {
  return mode === 'story' && rivalId === 'queen'
    ? BOSS_BATTLE_TARGET_SCORE
    : BATTLE_TARGET_SCORE;
}

function getBattleWinnerKind() {
  const targetScore = getBattleTargetScore();

  if (playerScore >= targetScore) return 'player';
  if (aiScore >= targetScore) return 'rival';

  return null;
}

function getAntPortraitPng(ant, variant = 'base') {
  if (!ant) return 'aa_ant_black_base.png';

  if (variant === 'powered') return ant.poweredPng || ant.basePng || 'aa_ant_black_base.png';
  if (variant === 'royal') return ant.royalPng || ant.poweredPng || ant.basePng || 'aa_ant_black_base.png';

  return ant.basePng || 'aa_ant_black_base.png';
}

function getStoryBattleScript(playerAnt, rivalAnt) {
  const playerId = getAntById(playerAnt?.id || playerAnt).id;
  const rivalId = getAnyAntById(rivalAnt?.id || rivalAnt).id;
  const battle = ANT_STORY_SCRIPT?.battles?.[playerId]?.[rivalId];

  if (battle) return battle;

  console.warn('[antAttack] missing story script; fallback used', {
    playerId,
    rivalId,
  });

  return {
    mission: [`${getAnyAntById(rivalId).name} blocks the blanket road.`, 'Snacks wait beyond the challenge.', 'First to snacks wins.'],
    player: [`${getAntById(playerId).name} marches forward.`, 'Snack courage fills the tiny paws.', 'The colony waits.'],
    reply: ['The rival guards the picnic line.', 'No snack passes without a fight!'],
    result: ['Snack route secured.', 'The picnic path opens again.', 'The nest cheers loudly!'],
  };
}

function getStoryPrologueLines(playerAnt) {
  const id = getAntById(playerAnt?.id || playerAnt).id;
  return ANT_STORY_SCRIPT?.prologue?.[id] || [
    'The colony waits.',
    'Bring tasty snacks back home safe.',
    'The nest needs dinner!',
  ];
}

function getStoryMissionLines(playerAnt, rivalAnt) {
  return getStoryBattleScript(playerAnt, rivalAnt).mission;
}

function getStoryPlayerLines(playerAnt, rivalAnt) {
  return getStoryBattleScript(playerAnt, rivalAnt).player;
}

function getStoryRivalReplyLines(playerAnt, rivalAnt) {
  return getStoryBattleScript(playerAnt, rivalAnt).reply;
}

function getStoryResultLines(playerAnt, rivalAnt) {
  return getStoryBattleScript(playerAnt, rivalAnt).result;
}

function getStoryEndingLines(playerAnt) {
  const id = getAntById(playerAnt?.id || playerAnt).id;
  return ANT_STORY_SCRIPT?.ending?.[id] || [
    'Snacks fill the halls.',
    'The colony laughs and feasts.',
    'Victory tastes sweet!',
  ];
}

function getAntTextToneClass(antOrId) {
  return `aa-tone-${getAntElementKey(antOrId)}`;
}

function renderStoryPoem(lines, { className = '', speaker = '', antId = selectedAntId } = {}) {
  const safeLines = Array.isArray(lines) ? lines : [lines];
  const toneClass = getAntTextToneClass(antId);
  const speakerMarkup = speaker
    ? `<strong class="aa-script-speaker">${escapeHtml(speaker)}</strong>`
    : '';

  return `
    <div class="aa-script-poem ${className} ${toneClass}" data-aa-tone="${escapeHtml(getAntElementKey(antId))}">
      ${speakerMarkup}
      ${safeLines.map((line) => `<span class="aa-script-line">${escapeHtml(line)}</span>`).join('')}
    </div>
  `;
}

function getStoryIntroCopy(playerAnt, rivalAnt) {
  const battle = getStoryBattleScript(playerAnt, rivalAnt);

  return {
    royalLines: battle.mission,
    playerLines: battle.player,
    rivalReplyLines: battle.reply,
    missionLine: `First to ${getBattleTargetScore('story', rivalAnt?.id)} snacks wins.`,
  };
}


function getArcadeRival(playerId) {
  const player = getAntById(playerId);
  const save = readAntAttackSave();

  if (player.id === 'queen') {
    const queenPool = ANT_ROSTER.filter((ant) => ant.id !== player.id);
    return queenPool[Math.floor(Math.random() * queenPool.length)] || ANT_ROSTER[0];
  }

  const completedNormal = ANT_ROSTER.filter((ant) => {
    return ant.id !== player.id && isAntStoryComplete(ant.id, save);
  });

  if (completedNormal.length) {
    return completedNormal[Math.floor(Math.random() * completedNormal.length)];
  }

  const fallback = ANT_ROSTER.filter((ant) => ant.id !== player.id);
  return fallback[Math.floor(Math.random() * fallback.length)] || ANT_ROSTER[1];
}

function createDefaultAntAttackSave() {
  const storyByAnt = {};
  getKnownAntIds().forEach((antId) => {
    storyByAnt[antId] = createAntStoryState(antId);
  });

  return {
    selectedAntId: 'black',
    lastPlayedAntId: 'black',
    unlockedAnts: { black: true },
    newAntIds: {},

    story: {
      nextRivalId: storyByAnt.black.nextRivalId,
      complete: false,
      antStories: storyByAnt,
      storyByAnt,
    },
  };
}


function normalizeAntAttackSave(rawSave = {}) {
  const fallback = createDefaultAntAttackSave();
  const parsed = rawSave && typeof rawSave === 'object' ? rawSave : {};

  const unlockedAnts = {
    ...fallback.unlockedAnts,
    ...(parsed.unlockedAnts || {}),
  };
  unlockedAnts.black = true;

  const newAntIds = {
    ...(parsed.newAntIds || {}),
  };
  delete newAntIds.black;

  Object.keys(newAntIds).forEach((antId) => {
    if (!isKnownAntId(antId) || !isAntUnlockedInSave({ unlockedAnts }, antId)) {
      delete newAntIds[antId];
    }
  });

  const legacySelected = isKnownAntId(parsed.selectedAntId) ? parsed.selectedAntId : 'black';
  const lastPlayedCandidate = isKnownAntId(parsed.lastPlayedAntId)
    ? parsed.lastPlayedAntId
    : legacySelected;

  const lastPlayedAntId = isAntUnlockedInSave({ unlockedAnts }, lastPlayedCandidate)
    ? lastPlayedCandidate
    : 'black';

  const selectedCandidate = isKnownAntId(parsed.selectedAntId)
    ? parsed.selectedAntId
    : lastPlayedAntId;

  const story = normalizeStorySave(parsed.story, fallback.story);

  return {
    ...fallback,
    ...parsed,
    selectedAntId: selectedCandidate,
    lastPlayedAntId,
    unlockedAnts,
    newAntIds,
    story,
  };
}


function readAntAttackSave() {
  try {
    const raw = localStorage.getItem(ANT_ATTACK_SAVE_KEY);
    if (!raw) return createDefaultAntAttackSave();

    return normalizeAntAttackSave(JSON.parse(raw));
  } catch (err) {
    console.warn('[antAttack] failed to read save:', err);
    return createDefaultAntAttackSave();
  }
}

function writeAntAttackSave(nextSave) {
  try {
    localStorage.setItem(
      ANT_ATTACK_SAVE_KEY,
      JSON.stringify(normalizeAntAttackSave(nextSave || readAntAttackSave()))
    );
  } catch (err) {
    console.warn('[antAttack] failed to write save:', err);
  }
}

function isAntUnlocked(antId) {
  const save = readAntAttackSave();
  return isAntUnlockedInSave(save, antId);
}

function isAntNew(antId) {
  const save = readAntAttackSave();
  return isAntUnlockedInSave(save, antId) && !!save.newAntIds?.[antId];
}



function previewAntId(antId) {
  // Browsing the carousel is not the same as playing the ant.
  // This intentionally does NOT write to localStorage.
  selectedAntId = getAntById(antId).id;
}

function markAntPlayed(antId) {
  const id = getAntById(antId).id;
  selectedAntId = id;

  const save = readAntAttackSave();
  save.selectedAntId = id;
  save.lastPlayedAntId = id;

  if (save.newAntIds?.[id]) {
    delete save.newAntIds[id];
  }

  writeAntAttackSave(save);
}

function resolveInitialAntIdFromSave(save = readAntAttackSave()) {
  const candidate = isKnownAntId(save.lastPlayedAntId)
    ? save.lastPlayedAntId
    : save.selectedAntId;

  return isAntUnlockedInSave(save, candidate) ? candidate : 'black';
}

function getSelectedRosterIndex() {
  const roster = getChooserRoster();
  return Math.max(0, roster.findIndex((ant) => ant.id === selectedAntId));
}


// Dev/debug helper for later unlock testing from Safari/Xcode console.
// Example:
// window.__SCMF_unlockAntAttackAnt?.('blue')
globalThis.__SCMF_unlockAntAttackAnt = markAntNewlyUnlocked;

globalThis.__SCMF_getAntAttackStoryRoute = (antId = selectedAntId) => {
  const id = getAntById(antId).id;

  return getStoryRouteForAnt(id).map((rivalId) => {
    const ant = getAnyAntById(rivalId);
    return {
      id: ant.id,
      name: ant.name,
    };
  });
};
globalThis.__SCMF_readAntAttackSave = readAntAttackSave;
globalThis.__SCMF_resetAntAttackSave = () => {
  try {
    localStorage.removeItem(ANT_ATTACK_SAVE_KEY);
    console.log('[antAttack] save reset');
  } catch {}
};








function setImgSrcWithFallback(img, primaryName, fallbackName = null) {
  if (!img || !primaryName) return;

  const fallbackList = Array.isArray(fallbackName)
    ? fallbackName
    : [fallbackName];

  const sources = [primaryName, ...fallbackList]
    .filter(Boolean)
    .map((src) => resolveAssetUrl(src))
    .filter(Boolean);

  if (!sources.length) return;

  let sourceIndex = 0;

  img.onerror = () => {
    sourceIndex += 1;

    if (sourceIndex < sources.length) {
      img.src = sources[sourceIndex];
      return;
    }

    img.onerror = null;
  };

  img.src = sources[sourceIndex];
}


function clearAllRedTimeouts() {
  try { redAntTimeouts.forEach(clearTimeout); } catch {}
  redAntTimeouts = [];
}

function clearPhaseTimeouts() {
  try { phaseTimeouts.forEach(clearTimeout); } catch {}
  phaseTimeouts = [];
}

function setPhaseTimeout(fn, delayMs) {
  const timeoutId = setTimeout(() => {
    phaseTimeouts = phaseTimeouts.filter((id) => id !== timeoutId);
    fn();
  }, delayMs);

  phaseTimeouts.push(timeoutId);
  return timeoutId;
}

function killFoodTween() {
  try { foodTween?.kill?.(); } catch {}
  foodTween = null;
}

function getDeployPortrait(container = ANT.root) {
  return container?.querySelector?.(
    '#kc-ant-button .aa-deploy-portrait'
  ) || null;
}

function showPoweredDeployPortrait(container = ANT.root) {
  const image =
    getDeployPortrait(container);

  const button =
    container?.querySelector?.(
      '#kc-ant-button'
    );

  if (image) {
    setImgSrcWithFallback(
      image,
      currentPlayerAnt.poweredPng,
      currentPlayerAnt.basePng
    );

    image.alt =
      `${currentPlayerAnt.name} powered`;
  }

  button?.classList?.add(
    'is-powered'
  );
}

function restoreDeployPortrait(container = ANT.root) {
  const image =
    getDeployPortrait(container);

  const button =
    container?.querySelector?.(
      '#kc-ant-button'
    );

  if (image) {
    setImgSrcWithFallback(
      image,
      currentPlayerAnt.basePng
    );

    image.alt =
      `Deploy ${currentPlayerAnt.name}`;
  }

  button?.classList?.remove(
    'is-powered'
  );
}

function killWaveAnimation(
  container = ANT.root,
  {
    restorePortrait = true,
  } = {}
) {
  waveAnimationToken += 1;

  try {
    waveTimeline?.kill?.();
  } catch {}

  waveTimeline = null;

  try {
    gsap.killTweensOf(waveStageEl);
  } catch {}

  try {
    gsap.killTweensOf(
      waveStageEl
        ?.querySelectorAll?.('*') ||
      []
    );
  } catch {}

  try {
    waveStageEl?.remove?.();
  } catch {}

  waveStageEl = null;
  waveInProgress = false;

  container
    ?.querySelector?.(
      '.aa-battle-wrapper'
    )
    ?.classList?.remove(
      'is-wave-firing'
    );

  if (restorePortrait) {
    restoreDeployPortrait(container);
  }
}

function resetBattleRuntimeCounters() {
  clearPhaseTimeouts();

  playerAntPool = TOTAL_ANT_POOL;
  aiAntPool = Infinity;
  playerScore = 0;
  aiScore = 0;
  playerAntsAttached = 0;
  aiAntsAttached = 0;
  currentFood = null;
  previousFoodName = null;
  roundInProgress = false;
  currentDirection = null;
  killFoodTween();
  killWaveAnimation(ANT.root);
  clearAllRedTimeouts();
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach((ant) => {
    stopCrawlWiggle(ant);
    try { ant.remove(); } catch {}
  });
  activeAnts.length = 0;
}

// center of the food within THIS container
function getFoodCenterCoords(container) {
  const wrapper = container.querySelector('.food-with-overlay');
  const zone    = container.querySelector('.kc-ant-zone');
  if (!wrapper || !zone) return { centerX: 0, centerY: 0 };

  const wrapperRect = wrapper.getBoundingClientRect();
  const zoneRect    = zone.getBoundingClientRect();
  const centerX     = wrapperRect.left - zoneRect.left + wrapperRect.width  / 2;
  const centerY     = wrapperRect.top  - zoneRect.top  + wrapperRect.height / 2;
  return { centerX, centerY };
}

function getAntFormationMetrics(ant, index, team = 'player') {
  const antRect = ant?.getBoundingClientRect?.();
  const antSize = Math.max(24, antRect?.width || 32);
  const step = Math.max(24, antSize * 0.82);
  const row = Math.floor(index / 5);
  const col = index % 5;

  return {
    antSize,
    offsetX: (col - 2) * step,
    offsetY: (team === 'player' ? 1 : -1) * row * step,
  };
}

function positionAntAtFood(ant, centerX, centerY) {
  const antSize = Math.max(
    24,
    ant?.getBoundingClientRect?.().width || 32
  );

  const offsetX = parseFloat(ant?.dataset?.offsetX) || 0;
  const offsetY = parseFloat(ant?.dataset?.offsetY) || 0;

  gsap.set(ant, {
    left: centerX + offsetX - (antSize / 2),
    top: centerY + offsetY - (antSize / 2),
  });
}

// regen rules (win bonus refill)
function getPlayerRegenBonus(foodName, requiredAnts, usedAnts) {
  if (foodName === 'snowcone') return 10;
  if (usedAnts === requiredAnts) return 6;
  if (usedAnts === requiredAnts + 1) return 5;
  return 4;
}

/*
  SCMF 1.6.0 — Food Rotation + Round Telemetry v1

  One consistent log shape for ordinary wins, losses,
  SnowCone saves, and Wave-assisted captures.
*/
function logAntAttackRoundData({
  result,
  food = currentFood,
  antsUsed = playerAntsAttached,
  regen = 0,
  viaWave = false,
  actualRecovered = null,
  saveQuality = null,
} = {}) {
  const payload = {
    food:
      food?.name || null,

    weight:
      Number(food?.weight) || 0,

    result:
      result || 'unknown',

    antsUsed:
      Number(antsUsed) || 0,

    regen:
      Number(regen) || 0,

    viaWave:
      Boolean(viaWave),

    mode:
      currentBattleMode,

    playerId:
      currentPlayerAnt?.id || null,

    rivalId:
      currentRivalAnt?.id || null,

    playerScore,

    rivalScore:
      aiScore,

    waveCharge:
      getCurrentWaveCharge(),
  };

  if (
    Number.isFinite(
      actualRecovered
    )
  ) {
    payload.actualRecovered =
      actualRecovered;
  }

  if (saveQuality) {
    payload.saveQuality =
      saveQuality;
  }

  console.log(
    '[antAttack] round data',
    payload
  );
}

// wiggle helpers
function getAntBaseRotation(ant) {
  return ant?.dataset?.team === 'player' ? 180 : 0;
}

function startCrawlWiggle(ant, fromX, fromY, toX, toY) {
  const dx = toX - fromX, dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = -dy / len, uy = dx / len;
  const amplitude = 6, freq = 8, rotAmp = 5;
  const baseRot = getAntBaseRotation(ant);

  const wiggleFn = () => {
    const t = gsap.ticker.time * freq * Math.PI * 2;
    const s = Math.sin(t);
    const offX = ux * amplitude * s;
    const offY = uy * amplitude * s;
    ant.style.transform = `translate(${offX}px, ${offY}px) rotate(${baseRot + (s * rotAmp)}deg)`;
  };
  ant._wiggleFn = wiggleFn;
  gsap.ticker.add(wiggleFn);
}

function stopCrawlWiggle(ant) {
  if (ant?._wiggleFn) {
    gsap.ticker.remove(ant._wiggleFn);
    ant._wiggleFn = null;
  }

  if (ant) {
    const baseRot = getAntBaseRotation(ant);
    ant.style.transform = `translate(0px,0px) rotate(${baseRot}deg)`;
  }
}

// UI helpers (scoped to container)
function updateScores(container) {
  const p = container.querySelector('#playerScore');
  const a = container.querySelector('#aiScore');
  const playerLabel = container.querySelector('#aaPlayerScoreLabel');
  const rivalLabel = container.querySelector('#aaRivalScoreLabel');

  if (p) p.textContent = playerScore;
  if (a) a.textContent = aiScore;
  if (playerLabel) playerLabel.textContent = currentPlayerAnt?.shortName || 'Player';
  if (rivalLabel) rivalLabel.textContent = currentRivalAnt?.shortName || 'Rival';
}

function updateAntCount(container) {
  const el =
    container.querySelector('.ant-count');

  const btn =
    container.querySelector('#kc-ant-button');

  const unavailable =
    playerAntPool <= 0 ||
    !roundInProgress ||
    waveInProgress ||
    playerAntsAttached >=
      MAX_ANTS_PER_SIDE;

  if (el) {
    el.textContent =
      `${playerAntPool}/10`;
  }

  if (btn) {
    btn.disabled = unavailable;

    btn.classList.toggle(
      'disabled',
      unavailable
    );
  }
}

function renderSnackCostGrid() {
  return foodCatalog.map((food) => `
    <span class="aa-snack-cost">
      <span aria-hidden="true">${food.emoji}</span>
      <strong>${food.weight}</strong>
    </span>
  `).join('');
}

// ────────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────────
export function initAntAttackGame(container, updatePopUICallbackParam) {
  // prevent double init / cross-container confusion
  if (ANT.alive && ANT.root === container) return;
  if (ANT.alive && ANT.root && ANT.root !== container) {
    try { destroyAntAttackGame(ANT.root); } catch {}
  }

  ANT.session++;
  ANT.alive = true;
  ANT.root  = container;

  updatePopUICallback = updatePopUICallbackParam || null;

  markAntAttackShell(container);

  const save = readAntAttackSave();
  selectedAntId = resolveInitialAntIdFromSave(save);

  resetBattleRuntimeCounters();
  wireBackCapture(container);
  wireContainerDeathWatcher(container);

  renderChooseScreen(container);
}

export function destroyAntAttackGame(container) {
  unmarkAntAttackShell(container);
  clearPhaseTimeouts();
  // stop spawns / tweens
  roundInProgress = false;
  killFoodTween();
  killWaveAnimation(container);
  clearAllRedTimeouts();

  // kill GSAP + DOM ants
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach(a => { stopCrawlWiggle(a); try { a.remove(); } catch {} });
  activeAnts.length = 0;

  // observers
  if (_resizeObs) { try { _resizeObs.disconnect(); } catch {} _resizeObs = null; }
  if (_domObs)    { try { _domObs.disconnect(); } catch {} _domObs = null;   }

  // button / back capture
  const antButton =
    container?.querySelector?.(
      '#kc-ant-button'
    );

  const waveButton =
    container?.querySelector?.(
      '#aa-wave-button'
    );

  const bound =
    _boundHandlers.get(container);

  if (
    antButton &&
    bound?.onPointerDown
  ) {
    antButton.removeEventListener(
      'pointerdown',
      bound.onPointerDown
    );
  }

  if (
    waveButton &&
    bound?.onWavePointerDown
  ) {
    waveButton.removeEventListener(
      'pointerdown',
      bound.onWavePointerDown
    );
  }

  if (bound?.onBackCapture) {
    document.removeEventListener('click', bound.onBackCapture, true);
  }
  _boundHandlers.delete(container);

  // food UI
  const fc = container?.querySelector?.('.food-container');
  if (fc) fc.innerHTML = '';

  // reset counters
  playerAntPool = TOTAL_ANT_POOL;
  aiAntPool = Infinity;
  playerScore = aiScore = 0;
  playerAntsAttached = aiAntsAttached = 0;
  currentDirection = null;
  currentPhase = 'choose';
  currentStoryRunWasReplay = false;
  endArcadeWaveRun();
}

export function resetAntAttackGame(container) {
  if (!aliveGuard(container)) return;
  destroyAntAttackGame(container);
  initAntAttackGame(container, updatePopUICallback);
}

export function forceKillAntAttack() {
  // global hard stop (no container required)
  clearPhaseTimeouts();
  killFoodTween();
  killWaveAnimation();
  clearAllRedTimeouts();
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach(stopCrawlWiggle);
  activeAnts.length = 0;
  roundInProgress = false;
  currentPhase = 'choose';
  currentStoryRunWasReplay = false;
  endArcadeWaveRun();
  ANT.session++;   // invalidate any scheduled timeouts
  ANT.alive   = false;
  ANT.root    = null;

  if (_resizeObs) { try { _resizeObs.disconnect(); } catch {} _resizeObs = null; }
  if (_domObs)    { try { _domObs.disconnect(); } catch {} _domObs    = null; }
}

// ────────────────────────────────────────────────────────────────────────────────
// Choose screen
// ────────────────────────────────────────────────────────────────────────────────
function renderChooseScreen(container) {
  if (!aliveGuard(container)) return;

  currentPhase = 'choose';
  currentStoryRunWasReplay = false;
  endArcadeWaveRun();
  resetBattleRuntimeCounters();

  const selectedAnt = getAntById(selectedAntId);
  const unlocked = isAntUnlocked(selectedAnt.id);
  const isNew = unlocked && isAntNew(selectedAnt.id);
  const storyPlayable = canPlayStory(selectedAnt.id);
  const arcadePlayable = canPlayArcade(selectedAnt.id);
  const storyButtonText = getStoryButtonText(selectedAnt.id);
  const storyButtonSubtitle = getStoryButtonSubtitle(selectedAnt.id);
  const arcadeButtonSubtitle = getArcadeButtonSubtitle(selectedAnt.id);

  container.innerHTML = `
    <div class="aa-choose-screen">
      <section class="aa-choose-card ${unlocked ? '' : 'is-locked'} ${isNew ? 'has-new' : ''}" aria-label="Choose your Ant Attack character">
        <header class="aa-choose-header">
          <h2>Choose Your Ant</h2>
        </header>

        <div class="aa-ant-carousel">
          <button id="aaPrevAnt" class="aa-arrow-btn" type="button" aria-label="Previous ant">←</button>

          <div class="aa-ant-preview">
            ${unlocked && isNew ? '<span class="aa-new-badge" aria-label="New ant">NEW</span>' : ''}
            ${unlocked ? '' : '<span class="aa-lock-badge" aria-label="Locked">🔒</span>'}
            <img
              id="aaSelectedAntImg"
              class="aa-selected-ant-img"
              src="${assetUrl(selectedAnt.basePng)}"
              alt="${selectedAnt.name}"
              draggable="false"
            />
          </div>

          <button id="aaNextAnt" class="aa-arrow-btn" type="button" aria-label="Next ant">→</button>
        </div>

        <div class="aa-ant-meta">
          <h3>${selectedAnt.name}</h3>
          <p class="aa-wave-line">${selectedAnt.waveName}: +${selectedAnt.wavePower}</p>
          <p class="aa-lock-line ${unlocked ? 'unlocked' : 'locked'}">
            ${unlocked ? 'Unlocked' : `🔒 ${getStoryUnlockTextForAnt(selectedAnt.id)}`}
          </p>
        </div>

        <div class="aa-snack-panel" aria-label="Snack costs">
          <span class="aa-snack-title">Snack Cost</span>
          <div class="aa-snack-grid">
            ${renderSnackCostGrid()}
          </div>
        </div>

        <p class="aa-rule-line">First to 10 snacks wins.</p>

        <div class="aa-mode-buttons">
          <button
            id="aaStoryModeBtn"
            class="aa-mode-btn aa-story-btn"
            type="button"
            ${storyPlayable ? '' : 'disabled'}
          >
            ${storyButtonText}
            <small>${storyButtonSubtitle}</small>
          </button>

          <button
            id="aaArcadeModeBtn"
            class="aa-mode-btn aa-arcade-btn"
            type="button"
            ${arcadePlayable ? '' : 'disabled'}
          >
            Arcade Mode
            <small>${arcadeButtonSubtitle}</small>
          </button>
        </div>
      </section>
    </div>
  `;

  wireChooseScreen(container);
}


function wireChooseScreen(container) {
  const prev = container.querySelector('#aaPrevAnt');
  const next = container.querySelector('#aaNextAnt');
  const story = container.querySelector('#aaStoryModeBtn');
  const arcade = container.querySelector('#aaArcadeModeBtn');

  prev?.addEventListener('click', () => {
    const roster = getChooserRoster();
    const current = getSelectedRosterIndex();
    const nextIndex = (current - 1 + roster.length) % roster.length;
    previewAntId(roster[nextIndex].id);
    renderChooseScreen(container);
  });

  next?.addEventListener('click', () => {
    const roster = getChooserRoster();
    const current = getSelectedRosterIndex();
    const nextIndex = (current + 1) % roster.length;
    previewAntId(roster[nextIndex].id);
    renderChooseScreen(container);
  });

  story?.addEventListener('click', () => {
    const player = getAntById(selectedAntId);
    if (!canPlayStory(player.id)) return;

    markAntPlayed(player.id);

    const save = readAntAttackSave();
    const completedStory = isAntStoryComplete(player.id, save);

    currentStoryRunWasReplay = completedStory;

    if (completedStory) {
      const existingReplay = getReplayStoryState(player.id, save);

      if (!existingReplay.active || existingReplay.complete) {
        startReplayStoryProgress(player.id);
      }

      const replay = getReplayStoryState(player.id);
      const rival = getAnyAntById(replay.nextRivalId || getFirstStoryRivalId(player.id));

      if (shouldShowStoryPrologue(player.id)) {
        renderStoryPrologueScreen(container, {
          playerAntId: player.id,
          rivalAntId: rival.id,
        });
        return;
      }

      renderStoryMissionScreen(container, {
        playerAntId: player.id,
        rivalAntId: rival.id,
      });
      return;
    }

    const rival = getNextStoryRival(player.id);

    if (shouldShowStoryPrologue(player.id)) {
      renderStoryPrologueScreen(container, {
        playerAntId: player.id,
        rivalAntId: rival.id,
      });
      return;
    }

    renderStoryMissionScreen(container, {
      playerAntId: player.id,
      rivalAntId: rival.id,
    });
  });

  arcade?.addEventListener('click', () => {
    const player = getAntById(selectedAntId);
    currentStoryRunWasReplay = false;
    if (!canPlayArcade(player.id)) return;

    markAntPlayed(player.id);
    startArcadeWaveRun(player.id);

    renderVersusScreen(container, {
      mode: 'arcade',
      playerAntId: player.id,
      rivalAntId: getArcadeRival(player.id).id,
    });
  });
}



function renderStoryPrologueScreen(container, { playerAntId = selectedAntId, rivalAntId = getNextStoryRival(playerAntId).id } = {}) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'storyIntro';
  currentBattleMode = 'story';
  currentPlayerAnt = getAntById(playerAntId);
  currentRivalAnt = getAnyAntById(rivalAntId);

  resetBattleRuntimeCounters();

  const royalPng = getAntPortraitPng(currentPlayerAnt, 'royal');
  const basePng = getAntPortraitPng(currentPlayerAnt, 'base');
  const isQueenStory = currentPlayerAnt.id === 'queen';

  const prologueStageMarkup = isQueenStory
    ? `
      <div class="aa-prologue-stage aa-prologue-stage-queen">
        <figure class="aa-prologue-character aa-prologue-queen">
          <img
            src="${assetUrl(getAntPortraitPng(currentPlayerAnt, 'powered'))}"
            alt="${escapeHtml(currentPlayerAnt.name)}"
            draggable="false"
          />
          <figcaption>${escapeHtml(currentPlayerAnt.name)}</figcaption>
        </figure>
      </div>
    `
    : `
      <div class="aa-prologue-stage">
        <figure class="aa-prologue-character aa-prologue-royal">
          <img
            src="${assetUrl(royalPng)}"
            alt="${escapeHtml(getAntRoyalName(currentPlayerAnt))}"
            draggable="false"
          />
          <figcaption>${escapeHtml(getAntRoyalName(currentPlayerAnt))}</figcaption>
        </figure>

        <figure class="aa-prologue-character aa-prologue-player">
          <img
            src="${assetUrl(basePng)}"
            alt="${escapeHtml(currentPlayerAnt.name)}"
            draggable="false"
          />
          <figcaption>${escapeHtml(currentPlayerAnt.name)}</figcaption>
        </figure>
      </div>
    `;

  container.innerHTML = `
    <div class="aa-prologue-screen aa-cinematic-screen" data-aa-player="${escapeHtml(getAntElementKey(currentPlayerAnt))}">
      <section class="aa-cinematic-card aa-prologue-card" aria-label="Ant Attack story prologue">
        <header class="aa-cinematic-header">
          <span class="aa-cinematic-kicker">Story Mode</span>
          <h2>Royal Mission</h2>
        </header>

        ${prologueStageMarkup}

        <div class="aa-dialogue-box aa-script-dialogue aa-prologue-dialogue" aria-live="polite">
          ${renderStoryPoem(getStoryPrologueLines(currentPlayerAnt), {
            className: 'aa-prologue-poem',
            speaker: isQueenStory ? currentPlayerAnt.name : getAntRoyalName(currentPlayerAnt),
            antId: currentPlayerAnt.id,
          })}
        </div>

        <button id="aaPrologueContinueBtn" class="aa-cinematic-btn" type="button">
          Continue
        </button>
      </section>
    </div>
  `;

  container.querySelector('#aaPrologueContinueBtn')?.addEventListener('click', () => {
    markStoryPrologueSeen(currentPlayerAnt.id);

    renderStoryMissionScreen(container, {
      playerAntId: currentPlayerAnt.id,
      rivalAntId: currentRivalAnt.id,
    });
  });
}

function renderStoryMissionScreen(container, { playerAntId = selectedAntId, rivalAntId = getNextStoryRival(playerAntId).id } = {}) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'storyIntro';
  currentBattleMode = 'story';
  currentPlayerAnt = getAntById(playerAntId);
  currentRivalAnt = getAnyAntById(rivalAntId);

  resetBattleRuntimeCounters();

  const guideLabel = currentRivalAnt?.id === 'queen' ? currentRivalAnt.name : getAntRoyalName(currentRivalAnt);
  const guidePng = getAntPortraitPng(
    currentRivalAnt,
    currentRivalAnt?.id === 'queen' ? 'base' : 'royal'
  );

  container.innerHTML = `
    <div
      class="aa-mission-screen aa-cinematic-screen"
      data-aa-player="${escapeHtml(getAntElementKey(currentPlayerAnt))}"
      data-aa-rival="${escapeHtml(getAntElementKey(currentRivalAnt))}"
    >
      <section class="aa-cinematic-card aa-mission-card" aria-label="Ant Attack rival royal briefing">
        <header class="aa-cinematic-header">
          <span class="aa-cinematic-kicker">Story Mode</span>
          <h2>Royal Rival</h2>
        </header>

        <figure class="aa-mission-royal">
          <img
            src="${assetUrl(guidePng)}"
            alt="${escapeHtml(guideLabel)}"
            draggable="false"
          />
          <figcaption>${escapeHtml(guideLabel)}</figcaption>
        </figure>

        <div class="aa-dialogue-box aa-script-dialogue aa-mission-dialogue" aria-live="polite">
          ${renderStoryPoem(getStoryMissionLines(currentPlayerAnt, currentRivalAnt), {
            className: 'aa-mission-poem',
            speaker: guideLabel,
            antId: currentRivalAnt.id,
          })}
        </div>

        <button id="aaMissionContinueBtn" class="aa-cinematic-btn" type="button">
          Continue
        </button>
      </section>
    </div>
  `;

  container.querySelector('#aaMissionContinueBtn')?.addEventListener('click', () => {
    markStoryMissionSeen(currentPlayerAnt.id);

    renderStoryIntroScreen(container, {
      playerAntId: currentPlayerAnt.id,
      rivalAntId: currentRivalAnt.id,
    });
  });
}

function renderStoryIntroScreen(container, { playerAntId = selectedAntId, rivalAntId = getNextStoryRival(playerAntId).id } = {}) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'storyIntro';
  currentBattleMode = 'story';
  currentPlayerAnt = getAntById(playerAntId);
  currentRivalAnt = getAnyAntById(rivalAntId);

  resetBattleRuntimeCounters();

  const copy = getStoryIntroCopy(currentPlayerAnt, currentRivalAnt);
  const rivalPng = getAntPortraitPng(currentRivalAnt);

  container.innerHTML = `
    <div
      class="aa-story-screen aa-cinematic-screen"
      data-aa-player="${escapeHtml(getAntElementKey(currentPlayerAnt))}"
      data-aa-rival="${escapeHtml(getAntElementKey(currentRivalAnt))}"
    >
      <section class="aa-cinematic-card aa-story-card" aria-label="Ant Attack story battle">
        <header class="aa-cinematic-header">
          <span class="aa-cinematic-kicker">Story Mode</span>
          <h2>Snack Mission</h2>
        </header>

        <div class="aa-story-stage">
          <figure class="aa-story-character aa-story-rival">
            <img
              src="${assetUrl(rivalPng)}"
              alt="${escapeHtml(currentRivalAnt.name)}"
              draggable="false"
            />
            <figcaption>${escapeHtml(currentRivalAnt.name)}</figcaption>
          </figure>

          <figure class="aa-story-character aa-story-player">
            <img
              src="${assetUrl(getAntPortraitPng(currentPlayerAnt))}"
              alt="${escapeHtml(currentPlayerAnt.name)}"
              draggable="false"
            />
            <figcaption>${escapeHtml(currentPlayerAnt.name)}</figcaption>
          </figure>
        </div>

        <div class="aa-dialogue-box aa-script-dialogue aa-faceoff-dialogue" aria-live="polite">
          ${renderStoryPoem(copy.playerLines, {
            className: 'aa-player-poem',
            speaker: currentPlayerAnt.name,
            antId: currentPlayerAnt.id,
          })}

          ${renderStoryPoem(copy.rivalReplyLines, {
            className: 'aa-rival-reply-poem',
            speaker: currentRivalAnt.name,
            antId: currentRivalAnt.id,
          })}

          <small class="aa-script-mission-line">${escapeHtml(copy.missionLine)}</small>
        </div>

        <button id="aaStoryToVersusBtn" class="aa-cinematic-btn" type="button">
          Face ${escapeHtml(currentRivalAnt.name)}
        </button>
      </section>
    </div>
  `;

  container.querySelector('#aaStoryToVersusBtn')?.addEventListener('click', () => {
    renderVersusScreen(container, {
      mode: 'story',
      playerAntId: currentPlayerAnt.id,
      rivalAntId: currentRivalAnt.id,
    });
  });
}

function renderVersusScreen(container, { mode = 'story', playerAntId = selectedAntId, rivalAntId = getNextStoryRival(playerAntId).id } = {}) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'versus';
  currentBattleMode = mode;
  currentPlayerAnt = getAntById(playerAntId);
  currentRivalAnt = getAnyAntById(rivalAntId);

  resetBattleRuntimeCounters();

  const targetScore = getBattleTargetScore(mode, currentRivalAnt.id);

  container.innerHTML = `
    <div
      class="aa-versus-screen aa-cinematic-screen"
      data-aa-mode="${escapeHtml(mode)}"
      data-aa-player="${escapeHtml(getAntElementKey(currentPlayerAnt))}"
      data-aa-rival="${escapeHtml(getAntElementKey(currentRivalAnt))}"
    >
      <section class="aa-cinematic-card aa-versus-card" aria-label="Ant Attack versus screen">
        <div class="aa-versus-fighter aa-versus-rival">
          <img
            src="${assetUrl(getAntPortraitPng(currentRivalAnt))}"
            alt="${escapeHtml(currentRivalAnt.name)}"
            draggable="false"
          />
          <strong>${escapeHtml(currentRivalAnt.name)}</strong>
        </div>

        <div class="aa-versus-center">
          <span class="aa-versus-vs">VS</span>
        </div>

        <div class="aa-versus-fighter aa-versus-player">
          <img
            src="${assetUrl(getAntPortraitPng(currentPlayerAnt))}"
            alt="${escapeHtml(currentPlayerAnt.name)}"
            draggable="false"
          />
          <strong>${escapeHtml(currentPlayerAnt.name)}</strong>
        </div>

        <div class="aa-versus-bottom">
          <span class="aa-versus-rule">First to ${targetScore} Snacks Wins!</span>
          <button
            id="aaVersusStartBtn"
            class="aa-cinematic-btn aa-versus-battle-btn"
            type="button"
            aria-label="Start battle"
          >
            Battle
          </button>
        </div>
      </section>
    </div>
  `;

  const startBattleFromVersus = () => {
    if (!aliveGuard(container) || currentPhase !== 'versus') return;

    startBattle(container, {
      mode,
      playerAntId: currentPlayerAnt.id,
      rivalAntId: currentRivalAnt.id,
    });
  };

  container.querySelector('#aaVersusStartBtn')?.addEventListener('click', startBattleFromVersus);
}

function renderResultsScreen(container, { winnerKind = getBattleWinnerKind() } = {}) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'results';
  roundInProgress = false;
  killFoodTween();
  clearAllRedTimeouts();

  const playerWon = winnerKind === 'player';
  const storyResult = currentBattleMode === 'story' && playerWon
    ? applyStoryVictoryProgress(currentPlayerAnt.id, currentRivalAnt.id)
    : null;

  const winnerAnt = playerWon ? currentPlayerAnt : currentRivalAnt;
  const title = `${winnerAnt.name} Wins!`;

  const unlockLine = storyResult?.unlockedAntName
    ? `${storyResult.unlockedAntName} Unlocked!`
    : '';

  const storyCompleteLine = storyResult?.storyComplete
    ? `${currentPlayerAnt.name} Story Complete!`
    : '';

  const primaryLabel = currentBattleMode === 'arcade'
    ? 'Again'
    : playerWon
      ? (storyResult?.storyComplete ? 'Ending' : 'Continue')
      : 'Try Again';

  const storyResultMarkup = currentBattleMode === 'story' && playerWon
    ? renderStoryPoem(getStoryResultLines(currentPlayerAnt, currentRivalAnt), {
        className: 'aa-results-haiku',
        speaker: currentPlayerAnt.name,
        antId: currentPlayerAnt.id,
      })
    : `<span class="aa-results-plain">${playerWon ? 'Snack route secured. The picnic path opens.' : 'The rival held the snack line. Run it back.'}</span>`;

  const statusMarkup = unlockLine || storyCompleteLine
    ? `<strong class="aa-results-status">${escapeHtml(unlockLine || storyCompleteLine)}</strong>`
    : '';

  container.innerHTML = `
    <div
      class="aa-results-screen aa-cinematic-screen"
      data-aa-player="${escapeHtml(getAntElementKey(currentPlayerAnt))}"
      data-aa-rival="${escapeHtml(getAntElementKey(currentRivalAnt))}"
    >
      <section class="aa-cinematic-card aa-results-card" aria-label="Ant Attack results">
        <header class="aa-cinematic-header">
          <span class="aa-cinematic-kicker">${currentBattleMode === 'story' ? 'Story Result' : 'Arcade Result'}</span>
          <h2>${escapeHtml(title)}</h2>
        </header>

        <div class="aa-results-winner">
          <img
            src="${assetUrl(getAntPortraitPng(winnerAnt, playerWon ? 'powered' : 'base'))}"
            alt="${escapeHtml(winnerAnt.name)}"
            draggable="false"
          />
        </div>

        <div class="aa-results-scoreline">
          <span>${escapeHtml(currentPlayerAnt.shortName)}: <strong>${playerScore}</strong></span>
          <span>${escapeHtml(currentRivalAnt.shortName)}: <strong>${aiScore}</strong></span>
        </div>

        <div class="aa-results-copy aa-script-dialogue">
          ${storyResultMarkup}
        </div>

        <div class="aa-results-status-wrap ${statusMarkup ? '' : 'is-empty'}">
          ${statusMarkup}
        </div>

        <div class="aa-results-actions">
          <button id="aaResultsBackBtn" class="aa-cinematic-btn aa-secondary-btn" type="button">Back</button>
          <button id="aaResultsPrimaryBtn" class="aa-cinematic-btn" type="button">${primaryLabel}</button>
        </div>
      </section>
    </div>
  `;

  container.querySelector('#aaResultsBackBtn')?.addEventListener('click', () => {
    currentStoryRunWasReplay = false;
    renderChooseScreen(container);
  });

  container.querySelector('#aaResultsPrimaryBtn')?.addEventListener('click', () => {
    if (currentBattleMode === 'arcade') {
      renderVersusScreen(container, {
        mode: 'arcade',
        playerAntId: currentPlayerAnt.id,
        rivalAntId: getArcadeRival(currentPlayerAnt.id).id,
      });
      return;
    }

    if (!playerWon) {
      renderVersusScreen(container, {
        mode: 'story',
        playerAntId: currentPlayerAnt.id,
        rivalAntId: currentRivalAnt.id,
      });
      return;
    }

    if (storyResult?.storyComplete) {
      renderEndingScreen(container);
      return;
    }

    const nextRivalId = storyResult?.nextRivalId || getNextStoryRival(currentPlayerAnt.id).id;

    renderStoryMissionScreen(container, {
      playerAntId: currentPlayerAnt.id,
      rivalAntId: nextRivalId,
    });
  });
}

function renderEndingScreen(container) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'ending';

  const endingPng = getAntEndingPng(currentPlayerAnt);
  const endingAlt = `${currentPlayerAnt.name} ending celebration`;

  container.innerHTML = `
    <div
      class="aa-ending-screen aa-cinematic-screen"
      data-aa-ending="${escapeHtml(getAntElementKey(currentPlayerAnt))}"
      data-aa-player="${escapeHtml(getAntElementKey(currentPlayerAnt))}"
    >
      <section class="aa-cinematic-card aa-ending-card" aria-label="Ant Attack ending">
        <header class="aa-cinematic-header">
          <span class="aa-cinematic-kicker">Victory Snack</span>
          <h2>${escapeHtml(currentPlayerAnt.name)} Story Complete!</h2>
        </header>

        <div class="aa-ending-art">
          <img
            src="${assetUrl(endingPng)}"
            alt="${escapeHtml(endingAlt)}"
            draggable="false"
          />
        </div>

        <div class="aa-results-copy aa-script-dialogue aa-ending-copy">
          ${renderStoryPoem(getStoryEndingLines(currentPlayerAnt), {
            className: 'aa-ending-haiku',
            speaker: currentPlayerAnt.name,
            antId: currentPlayerAnt.id,
          })}
        </div>

        <button id="aaEndingBackBtn" class="aa-cinematic-btn" type="button">Back to Ants</button>
      </section>
    </div>
  `;

  container.querySelector('#aaEndingBackBtn')?.addEventListener('click', () => {
    currentStoryRunWasReplay = false;
    renderChooseScreen(container);
  });
}



function wireBackCapture(container) {
  const existing = _boundHandlers.get(container) || {};
  if (existing.onBackCapture) return;

  const onBackCapture = (ev) => {
    if (!aliveGuard(container)) return;

    const target = ev.target;
    const backBtn = target?.closest?.('#kcBack');
    if (!backBtn) return;

    // On Ant internal screens, Back returns to Ant Attack setup.
    // On choose screen, allow Kids Camping shell to handle Back to Camping setup.
    if (currentPhase !== 'choose') {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();

      renderChooseScreen(container);
    }
  };

  document.addEventListener('click', onBackCapture, true);
  _boundHandlers.set(container, { ...existing, onBackCapture });
}

function wireContainerDeathWatcher(container) {
  // If the container leaves the DOM, auto-kill.
  if (_domObs) { try { _domObs.disconnect(); } catch {} }

  _domObs = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      try { forceKillAntAttack(); } catch {}
    }
  });

  _domObs.observe(document.body, { childList: true, subtree: true });
}

// ────────────────────────────────────────────────────────────────────────────────
// Battle render / core loop
// ────────────────────────────────────────────────────────────────────────────────
const MAX_ANTS_PER_SIDE = 10;
const TOTAL_ANT_POOL = 10;

/*
  SCMF 1.6.0 — Rival Speed + Three-Win Wave v1

  Rival difficulty is expressed through release timing.

  The first rival ant still deploys immediately. Each later
  rival ant waits for the previous crawl to finish, then waits
  this interval before beginning its own crawl.
*/
const RIVAL_RELEASE_INTERVAL_MS = Object.freeze({
  black: 1100,
  blue: 1000,
  pink: 900,
  white: 800,
  yellow: 700,
  red: 600,
  queen: 500,
});

function getRivalReleaseIntervalMs(
  rivalAnt = currentRivalAnt
) {
  const rivalId =
    getAnyAntById(
      rivalAnt?.id || rivalAnt
    ).id;

  return (
    RIVAL_RELEASE_INTERVAL_MS[rivalId] ||
    1000
  );
}

function startBattle(container, { mode = 'story', playerAntId = 'black', rivalAntId = 'blue' } = {}) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'battle';
  currentBattleMode = mode;
  currentPlayerAnt = getAntById(playerAntId);
  currentRivalAnt =
    rivalAntId === 'queen'
      ? QUEEN_SNACKJACKET
      : getAntById(rivalAntId);

  console.log(
    '[antAttack] rival release timing',
    {
      rivalId:
        currentRivalAnt.id,
      rivalName:
        currentRivalAnt.name,
      releaseIntervalMs:
        getRivalReleaseIntervalMs(
          currentRivalAnt
        ),
    }
  );

  resetBattleRuntimeCounters();

  renderBattleScreen(container);
  startNewRound(container);
}

function renderBattleScreen(container) {
  container.innerHTML = `
    <div
      class="ant-attack-wrapper aa-battle-wrapper"
      data-aa-mode="${currentBattleMode}"
      data-aa-player="${currentPlayerAnt.id}"
      data-aa-rival="${currentRivalAnt.id}"
    >
      <div class="kc-ant-zone">
        <div class="aa-snack-score aa-snack-score-rival" data-ant="${currentRivalAnt.id}" aria-label="${currentRivalAnt.shortName} snack score">
          <span id="aaRivalScoreLabel" class="aa-snack-score-name">${currentRivalAnt.shortName}</span>
          <strong class="aa-snack-score-value"><span id="aiScore">0</span><span aria-hidden="true">/</span><span>${getBattleTargetScore()}</span></strong>
          <small>SNACKS</small>
        </div>

        <div class="aa-snack-score aa-snack-score-player" data-ant="${currentPlayerAnt.id}" aria-label="${currentPlayerAnt.shortName} snack score">
          <span id="aaPlayerScoreLabel" class="aa-snack-score-name">${currentPlayerAnt.shortName}</span>
          <strong class="aa-snack-score-value"><span id="playerScore">0</span><span aria-hidden="true">/</span><span>${getBattleTargetScore()}</span></strong>
          <small>SNACKS</small>
        </div>

        <div class="ant-base red">
          <img class="ant-hill-img" src="${assetUrl('aa_antBase.png')}" alt="${currentRivalAnt.name} base"/>
          <img class="ant2-img" src="${assetUrl(currentRivalAnt.basePng)}" alt="${currentRivalAnt.name}"/>
        </div>

        <div class="food-zone"><div class="food-container"></div></div>

        <div class="ant-base black">
          <img class="ant-hill-img" src="${assetUrl('aa_antBase.png')}" alt="${currentPlayerAnt.name} base"/>
        </div>

        <div class="aa-player-control-stack" aria-label="${currentPlayerAnt.name} battle controls">
          <button
            id="aa-wave-button"
            class="aa-wave-btn is-empty"
            type="button"
            disabled
            aria-label="${currentPlayerAnt.waveName} charge 0 of ${WAVE_CHARGE_MAX}"
          >
            <span class="aa-wave-label">WAVE</span>
            <span class="aa-wave-count">0/${WAVE_CHARGE_MAX}</span>
          </button>

          <button id="kc-ant-button" class="ant-btn aa-send-ant-btn" type="button" aria-label="Send ant">
            <img
              class="aa-deploy-portrait"
              src="${assetUrl(currentPlayerAnt.basePng)}"
              alt="Deploy ${currentPlayerAnt.name}"
            />
            <span class="ant-count">10/10</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // background with fallback
  const zone = container.querySelector('.kc-ant-zone');
  const picnic = assetUrl('aa_picnicBlanket.png');
  const fallbackPicnic = assetUrl('picnicBlanket.png');
  const img = new Image();

  img.onload = () => {
    zone?.style.setProperty('--kc-ant-bg', `url(${picnic})`);
  };
  img.onerror = () => {
    zone?.style.setProperty('--kc-ant-bg', `url(${fallbackPicnic})`);
  };
  img.src = picnic;

  // Button handlers use pointerdown for native iOS snappiness.
  const antButton =
    container.querySelector(
      '#kc-ant-button'
    );

  const waveButton =
    container.querySelector(
      '#aa-wave-button'
    );

  const onPointerDown = (event) => {
    event.preventDefault();
    deployPlayerAnt(container);
  };

  const onWavePointerDown = (event) => {
    event.preventDefault();
    activatePlayerWave(container);
  };

  antButton?.addEventListener(
    'pointerdown',
    onPointerDown
  );

  waveButton?.addEventListener(
    'pointerdown',
    onWavePointerDown
  );

  const existing =
    _boundHandlers.get(container) || {};

  if (
    existing.onPointerDown &&
    existing.onPointerDown !==
      onPointerDown
  ) {
    try {
      antButton?.removeEventListener(
        'pointerdown',
        existing.onPointerDown
      );
    } catch {}
  }

  if (
    existing.onWavePointerDown &&
    existing.onWavePointerDown !==
      onWavePointerDown
  ) {
    try {
      waveButton?.removeEventListener(
        'pointerdown',
        existing.onWavePointerDown
      );
    } catch {}
  }

  _boundHandlers.set(
    container,
    {
      ...existing,
      onPointerDown,
      onWavePointerDown,
    }
  );

  // Element glows are controlled by battle-wrapper data attributes.

  // initial UI
  updateScores(container);
  updateAntCount(container);
  updateWaveButton(container);

  // Resize observer keeps ants anchored to food on layout change
  if (_resizeObs) { try { _resizeObs.disconnect(); } catch {} }
  _resizeObs = new ResizeObserver(() => {
    if (!aliveGuard(container) || currentPhase !== 'battle') return;

    const { centerX, centerY } = getFoodCenterCoords(container);
    activeAnts.forEach((ant) => {
      positionAntAtFood(ant, centerX, centerY);
    });
  });
  _resizeObs.observe(document.body);
}

function startNewRound(container) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;

  killWaveAnimation(container);
  waveInProgress = false;

  // wipe ants
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach(a => { stopCrawlWiggle(a); try { a.remove(); } catch {} });
  activeAnts.length = 0;

  if (playerAntPool <= 0) playerAntPool = TOTAL_ANT_POOL;
  playerAntsAttached = aiAntsAttached = 0;
  roundInProgress = true;
  currentDirection = null;

  updateAntCount(container);
  updateWaveButton(container);

  const foodContainer = container.querySelector('.food-container');
  if (!foodContainer) return;
  foodContainer.innerHTML = '';

  currentFood =
    selectNextFoodForRound();

  const foodEl = document.createElement('img');
  foodEl.className = 'food-plate-img';
  foodEl.id = 'antFood';
  foodEl.alt = currentFood.label;
  setImgSrcWithFallback(foodEl, getFoodPrimarySrc(currentFood), getFoodFallbackSrc(currentFood));

  if (currentFood.name === 'snowcone') foodEl.classList.add('big-snowcone');

  const overlay = document.createElement('div');
  overlay.className = 'food-weight-overlay';
  overlay.textContent = currentFood.weight;

  const wrapper = document.createElement('div');
  wrapper.className = 'food-with-overlay';
  wrapper.dataset.food = currentFood.name;
  wrapper.appendChild(foodEl);
  wrapper.appendChild(overlay);
  foodContainer.appendChild(wrapper);

  gsap.set(wrapper, { y: 0 });

  spawnRedAntLoop(container, currentFood.weight);
}

function deployPlayerAnt(container) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;
  if (
    playerAntPool <= 0 ||
    !roundInProgress ||
    waveInProgress ||
    playerAntsAttached >=
      MAX_ANTS_PER_SIDE
  ) {
    return;
  }

  const zone = container.querySelector('.kc-ant-zone');
  const { centerX, centerY } = getFoodCenterCoords(container);
  const spawnFrom = zone.querySelector('.ant-base.black');
  const baseRect = spawnFrom.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  const spawnX = baseRect.left - zoneRect.left + baseRect.width / 2;
  const spawnY = baseRect.top  - zoneRect.top  + baseRect.height / 2;

  const ant = document.createElement('img');
  ant.src = assetUrl(currentPlayerAnt.soldierPng);
  ant.className = `ant-sprite player-ant-soldier ${currentPlayerAnt.id}-ant`;
  ant.dataset.team = 'player';
  zone.appendChild(ant);

  const i = playerAntsAttached;
  const {
    antSize,
    offsetX,
    offsetY,
  } = getAntFormationMetrics(ant, i, 'player');

  ant.dataset.offsetX = offsetX;
  ant.dataset.offsetY = offsetY;

  gsap.set(ant, { left: spawnX, top: spawnY });
  stopCrawlWiggle(ant);

  activeAnts.push(ant);
  playerAntsAttached++;
  playerAntPool--;
  updateAntCount(container);

  // 🔔 milestone: full team attached
  if (playerAntsAttached >= MAX_ANTS_PER_SIDE) {
    container?.dispatchEvent(new CustomEvent('kcAntsFull', { bubbles: true }));
  }

  const targetX = centerX + offsetX - (antSize / 2);
  const targetY = centerY + offsetY - (antSize / 2);
  startCrawlWiggle(ant, spawnX, spawnY, targetX, targetY);

  gsap.to(ant, {
    left: targetX,
    top: targetY,
    duration: 0.5,
    ease: 'power2.out',
    onComplete: () => {
      stopCrawlWiggle(ant);
      triggerFoodMotion(container.querySelector('#antFood'), container);
      if (!foodTween) checkEndOfPlayWinner(container);
    },
    onInterrupt: () => stopCrawlWiggle(ant)
  });
}

function spawnRedAntLoop(container, requiredWeight) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;
  const session = ANT.session;
  const zone = container.querySelector('.kc-ant-zone');
  const { centerX, centerY } = getFoodCenterCoords(container);
  const spawnFrom = zone.querySelector('.ant-base.red');
  const baseRect = spawnFrom.getBoundingClientRect();
  const zoneRect  = zone.getBoundingClientRect();
  const spawnX = baseRect.left - zoneRect.left + baseRect.width / 2;
  const spawnY = baseRect.top  - zoneRect.top  + baseRect.height / 2;

  let i = 0;

  const maxRedAnts =
    Math.min(
      requiredWeight +
      Math.floor(Math.random() * 3) +
      1,
      MAX_ANTS_PER_SIDE
    );

  const releaseIntervalMs =
    getRivalReleaseIntervalMs(
      currentRivalAnt
    );

  function scheduleNext() {
    if (!aliveGuard(container) || session !== ANT.session || !roundInProgress || currentPhase !== 'battle' || i >= maxRedAnts) return;
    const tid =
      setTimeout(
        deployOneRedAnt,
        releaseIntervalMs
      );
    redAntTimeouts.push(tid);
  }

  function deployOneRedAnt() {
    if (!aliveGuard(container) || session !== ANT.session || !roundInProgress || currentPhase !== 'battle' || i >= maxRedAnts) return;

    const ant = document.createElement('img');
    const primarySoldier = currentRivalAnt.soldierPng || 'aa_redAnt.png';
    const fallbackSoldier = currentRivalAnt.fallbackSoldierPng || 'aa_redAnt.png';
    ant.className = `ant-sprite rival-ant-soldier ${currentRivalAnt.id}-ant`;
    ant.dataset.team = 'rival';
    ant.style.position = 'absolute';
    ant.style.zIndex = '10';
    setImgSrcWithFallback(ant, primarySoldier, fallbackSoldier);
    zone.appendChild(ant);

    const {
      antSize,
      offsetX,
      offsetY,
    } = getAntFormationMetrics(ant, i, 'rival');

    ant.dataset.offsetX = offsetX;
    ant.dataset.offsetY = offsetY;

    gsap.set(ant, { left: spawnX, top: spawnY });

    const targetX = centerX + offsetX - (antSize / 2);
    const targetY = centerY + offsetY - (antSize / 2);

    startCrawlWiggle(ant, spawnX, spawnY, targetX, targetY);

    gsap.to(ant, {
      left: targetX,
      top: targetY,
      duration: 0.5,
      ease: 'power2.out',
      rotation: (Math.random() * 10) - 5,
      onComplete: () => {
        stopCrawlWiggle(ant);
        activeAnts.push(ant);
        aiAntsAttached++;
        triggerFoodMotion(container.querySelector('#antFood'), container);
        i++;
        if (roundInProgress && i < maxRedAnts) scheduleNext();
      },
      onInterrupt: () => stopCrawlWiggle(ant)
    });
  }

  // First rival ant starts immediately.
  // Later ants use the selected rival's release interval.
  deployOneRedAnt();
}

function triggerFoodMotion(foodEl, container, forcedDirection = null) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;
  if (waveInProgress) return;
  const foodWrapper = foodEl?.parentElement;
  if (!foodEl || !foodWrapper || !roundInProgress) return;

  const playerAnts = playerAntsAttached;
  const aiAnts     = aiAntsAttached;

  let direction = forcedDirection;
  if (!direction) {
    if (playerAnts > aiAnts) direction = 'player';
    else if (aiAnts > playerAnts) direction = 'ai';
    else direction = 'player'; // ties → player
  }

  // weight gate
  if (direction === 'player' && playerAnts < currentFood.weight) return;
  if (direction === 'ai'     && aiAnts     < currentFood.weight) return;

  if (currentDirection === direction && foodTween && foodTween.isActive()) return;
  currentDirection = direction;

  const zone = container.querySelector('.kc-ant-zone');
  const zoneHeight = zone.getBoundingClientRect().height;
  const targetY = zoneHeight * 0.5 * (direction === 'player' ? 1 : -1);
  const totalDistance = Math.abs(targetY - 0);
  const currentY = gsap.getProperty(foodWrapper, 'y') || 0;
  const remaining = Math.abs(targetY - currentY);

  let duration = (remaining / totalDistance) * currentFood.weight;
  duration = Math.max(duration, 0.15);

  activeAnts.forEach(stopCrawlWiggle);
  gsap.killTweensOf(foodWrapper);

  foodTween = gsap.to(foodWrapper, {
    y: targetY,
    duration,
    ease: 'linear',
    onComplete: () => endRound(container, direction === 'player' ? 'win' : 'loss', foodWrapper)
  });

  const sign = (direction === 'player') ? 1 : -1;
  const moveBy = sign * remaining;
  gsap.killTweensOf(activeAnts);
  gsap.to(activeAnts, { top: `+=${moveBy}`, duration, ease: 'linear' });
}

function checkEndOfPlayWinner(container) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;
  if (waveInProgress) return;
  const foodEl = container.querySelector('#antFood');
  if (!foodEl || !roundInProgress || foodTween) return;

  const playerOut = playerAntPool <= 0;
  const aiOut     = aiAntsAttached >= MAX_ANTS_PER_SIDE;
  if (!(playerOut && aiOut)) return;

  let direction = 'player';
  if (aiAntsAttached > playerAntsAttached) direction = 'ai';
  triggerFoodMotion(foodEl, container, direction);
}

/*
  SCMF 1.6.0 — Ant Attack Stacked Round Results v1

  Keep each save result on three intentional lines instead
  of letting WKWebView/browser width choose the wrapping:

  Perfect  / Save / +6
  Great    / Save / +5
  Good     / Save / +4
  SnowCone / Save / +10
*/
function showAntSaveResultMessage(
  container,
  resultLabel,
  regenAmount
) {
  const zone =
    container?.querySelector?.(
      '.kc-ant-zone'
    );

  if (!zone) return;

  zone
    .querySelectorAll(
      '.aa-round-stack-message'
    )
    .forEach((existing) => {
      try {
        existing.remove();
      } catch {}
    });

  const message =
    document.createElement('div');

  message.className =
    'kc-round-msg aa-round-stack-message';

  message.setAttribute(
    'role',
    'status'
  );

  message.setAttribute(
    'aria-live',
    'polite'
  );

  message.setAttribute(
    'aria-label',
    `${resultLabel} Save plus ${regenAmount} ants`
  );

  [
    resultLabel,
    'Save',
    `+${regenAmount}`,
  ].forEach((lineText) => {
    const line =
      document.createElement('span');

    line.className =
      'aa-round-stack-line';

    line.textContent =
      lineText;

    message.appendChild(line);
  });

  zone.appendChild(message);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      message.classList.add(
        'visible'
      );
    });
  });

  setPhaseTimeout(() => {
    message.classList.remove(
      'visible'
    );

    setPhaseTimeout(() => {
      try {
        message.remove();
      } catch {}
    }, 320);
  }, 900);
}

function endRound(container, result, foodWrapper) {
  if (
    !aliveGuard(container) ||
    currentPhase !== 'battle'
  ) {
    return;
  }

  roundInProgress = false;
  killFoodTween();
  clearAllRedTimeouts();

  const playerAnts =
    playerAntsAttached;

  const required =
    currentFood.weight;

  if (result === 'win') {
    playerScore += 1;

    let scoreBonus = 0;
    let resultLabel = 'Good';

    if (currentFood.name === 'snowcone') {
      resultLabel = 'SnowCone';

      scoreBonus =
        playerAnts === required
          ? 300
          : playerAnts === required + 1
            ? 200
            : 100;
    } else if (playerAnts === required) {
      resultLabel = 'Perfect';
      scoreBonus = 300;
    } else if (
      playerAnts === required + 1
    ) {
      resultLabel = 'Great';
      scoreBonus = 200;
    } else {
      resultLabel = 'Good';
      scoreBonus = 100;
    }

    awardWaveChargeForRound(
      container,
      {
        result,
      }
    );

    const regen =
      getPlayerRegenBonus(
        currentFood.name,
        required,
        playerAnts
      );

    const antPoolBeforeRecovery =
      playerAntPool;

    playerAntPool = Math.min(
      playerAntPool + regen,
      TOTAL_ANT_POOL
    );

    const antsActuallyRecovered =
      playerAntPool -
      antPoolBeforeRecovery;

    logAntAttackRoundData({
      result: 'win',
      food:
        currentFood,
      antsUsed:
        playerAnts,
      regen,
      viaWave:
        false,
      actualRecovered:
        antsActuallyRecovered,
      saveQuality:
        resultLabel,
    });

    /*
      Show the full earned tier even when the pool cap means
      fewer ants physically fit beneath 10/10.
    */
    showAntSaveResultMessage(
      container,
      resultLabel,
      regen
    );

    appState.incrementPopCount(
      scoreBonus
    );

    updatePopUICallback?.();
  } else {
    aiScore += 1;

    const lossRegen = 3;

    const antPoolBeforeRecovery =
      playerAntPool;

    playerAntPool = Math.min(
      playerAntPool + lossRegen,
      TOTAL_ANT_POOL
    );

    const antsActuallyRecovered =
      playerAntPool -
      antPoolBeforeRecovery;

    logAntAttackRoundData({
      result: 'loss',
      food:
        currentFood,
      antsUsed:
        playerAnts,
      regen:
        lossRegen,
      viaWave:
        false,
      actualRecovered:
        antsActuallyRecovered,
      saveQuality:
        'Loss',
    });

    // Preserve the existing loss message system.
    showRoundMessage('loss');
  }

  // 🔔 Broadcast round result & running margin.
  try {
    const margin =
      playerScore - aiScore;

    document.dispatchEvent(
      new CustomEvent(
        'kcAntRoundResult',
        {
          detail: {
            result,
            playerWins:
              playerScore,
            aiWins:
              aiScore,
            margin,
          },
        }
      )
    );
  } catch {}

  updateScores(container);
  updateAntCount(container);
  updateWaveButton(container);

  const battleWinnerKind =
    getBattleWinnerKind();

  if (battleWinnerKind) {
    clearAllRedTimeouts();
    killFoodTween();
  }

  gsap.to(activeAnts, {
    opacity: 0,
    duration: 0.5,

    onComplete: () => {
      activeAnts.forEach((ant) => {
        stopCrawlWiggle(ant);

        try {
          ant.remove();
        } catch {}
      });

      activeAnts.length = 0;
    },
  });

  gsap.to(foodWrapper, {
    opacity: 0,
    duration: 0.5,

    onComplete: () => {
      const foodContainer =
        container.querySelector(
          '.food-container'
        );

      if (foodContainer) {
        foodContainer.innerHTML = '';

        gsap.set(
          foodContainer,
          {
            opacity: 1,
          }
        );
      }

      const session =
        ANT.session;

      setTimeout(() => {
        if (
          session !== ANT.session ||
          !aliveGuard(container) ||
          currentPhase !== 'battle'
        ) {
          return;
        }

        if (battleWinnerKind) {
          renderResultsScreen(
            container,
            {
              winnerKind:
                battleWinnerKind,
            }
          );

          return;
        }

        if (!roundInProgress) {
          startNewRound(container);
        }
      }, battleWinnerKind ? 700 : 1000);
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// HMR safety
// ────────────────────────────────────────────────────────────────────────────────
if (import.meta?.hot) {
  import.meta.hot.dispose(() => {
    try { forceKillAntAttack(); } catch {}
  });
}
