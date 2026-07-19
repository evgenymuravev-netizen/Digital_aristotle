/* ============================================================
   MMAT — deeper "why your answer falls short" explanations.

   Optional, per-question, keyed by the exact prompt text. Where a
   question isn't listed here, the engine composes a topic-aware
   explanation instead, so every wrong answer still gets a deeper
   "why". Extend this file freely — add more entries any time.

   Shape:
     "<exact prompt>": {
       principle: "the core relationship / rule in one line",
       best:      "why the correct option fits best",
       traps: { "<option text>": "why this tempting choice falls short" }
     }
   ============================================================ */
window.MMAT_DEEP = {
  /* ---------- analogies (premium, hand-written) ---------- */
  "Drizzle is to Downpour as Breeze is to ___": {
    principle: "Same thing, turned up: a mild version pairs with its intense version.",
    best: "A gale is simply an intense breeze, exactly as a downpour is an intense drizzle.",
    traps: {
      "Calm": "Calm is the absence of wind — that's an opposite, not a stronger version of a breeze.",
      "Storm": "A storm is a whole weather system; the pair here is only about the intensity of one thing — wind.",
      "Cloud": "A cloud isn't a stronger breeze at all — it's a different category entirely.",
    },
  },
  "Whisper is to Shout as Drizzle is to ___": {
    principle: "A quiet, mild version pairs with its loud, intense version of the same thing.",
    best: "A downpour is intense rain just as a shout is intense speech — same thing, greater intensity.",
    traps: {
      "Cloud": "A cloud may bring rain, but it isn't a more intense form of drizzle.",
      "Storm": "A storm is a whole event; this pair is purely about how intense the rain is.",
      "Wet": "'Wet' is a result of rain, not a stronger version of drizzle.",
    },
  },
  "Cartographer is to Map as Lexicographer is to ___": {
    principle: "A specialist pairs with the reference work they create.",
    best: "A lexicographer compiles dictionaries, exactly as a cartographer makes maps.",
    traps: {
      "Word": "Words are the raw material a lexicographer works with, not the finished work they produce.",
      "Library": "A library stores many works; it isn't what a lexicographer makes.",
      "Novel": "A lexicographer makes reference books, not novels.",
    },
  },
  "Oasis is to Desert as Island is to ___": {
    principle: "A small patch of one thing, surrounded by its opposite environment.",
    best: "An island is land surrounded by ocean, just as an oasis is fertile land surrounded by desert.",
    traps: {
      "Beach": "A beach is the edge between land and sea, not what surrounds an island.",
      "Sand": "Sand describes a desert, not what an island sits in.",
      "Tree": "A tree might grow on an island, but it isn't what surrounds it.",
    },
  },
  "Sculptor is to Clay as Blacksmith is to ___": {
    principle: "A craftsperson pairs with the raw material they shape.",
    best: "A blacksmith shapes iron, just as a sculptor shapes clay.",
    traps: {
      "Hammer": "A hammer is the blacksmith's tool, not the material being shaped.",
      "Anvil": "An anvil is the surface they work on, not the material.",
      "Fire": "Fire heats the metal but isn't the material being formed.",
    },
  },
  "Library is to Books as Arboretum is to ___": {
    principle: "A place pairs with the collection it is dedicated to.",
    best: "An arboretum is a curated collection of trees, as a library is of books.",
    traps: {
      "Animals": "A collection of animals is a zoo, not an arboretum.",
      "Stars": "Stars belong to an observatory, not an arboretum.",
      "Art": "Art belongs in a gallery.",
    },
  },
  "Novice is to Expert as Seed is to ___": {
    principle: "Earliest stage pairs with the final, lasting mature form.",
    best: "A seed is the very start of the organism and a tree is its complete, stable adult form — a total transformation, exactly like a novice becoming an expert.",
    traps: {
      "Flower": "Seeds do grow into flowering plants, so it feels right — but a flower is a temporary part the plant produces, not the mature organism itself, so it misses the 'final, lasting state' the analogy needs. A seed becomes a whole plant, just as a novice becomes a whole expert.",
      "Soil": "Soil is where a seed grows, not what it becomes — it's the setting, not the mature form.",
      "Root": "A root is one part of the plant, not the whole grown organism the seed turns into.",
    },
  },
  "Doctor is to Disease as Detective is to ___": {
    principle: "A professional pairs with the problem they fight.",
    best: "A detective works against crime, as a doctor works against disease.",
    traps: {
      "Clue": "A clue is a tool the detective uses, not the thing they combat.",
      "Police": "The police are colleagues, not the problem being fought.",
      "Court": "A court is where cases end up, not what a detective fights.",
    },
  },
  "Aviary is to Birds as Apiary is to ___": {
    principle: "An enclosure pairs with the creature it houses.",
    best: "An apiary houses bees, as an aviary houses birds.",
    traps: {
      "Snakes": "Snakes aren't kept in an apiary — that word is specific to bees.",
      "Fish": "Fish live in an aquarium.",
      "Horses": "Horses live in a stable.",
    },
  },
  "Sponge is to Absorb as Sieve is to ___": {
    principle: "An object pairs with the action it is designed to perform.",
    best: "A sieve's job is to strain, as a sponge's is to absorb.",
    traps: {
      "Soak": "Soaking is what a sponge does, not a sieve.",
      "Hold": "A sieve is designed to let things through, not hold them.",
      "Fill": "Filling isn't a sieve's function.",
    },
  },
  "Hammer is to Nail as Screwdriver is to ___": {
    principle: "A tool pairs with the fastener it drives.",
    best: "A screwdriver drives screws, as a hammer drives nails.",
    traps: {
      "Drill": "A drill is another tool, not the fastener a screwdriver drives.",
      "Wood": "Wood is the material, not the fastener.",
      "Tool": "'Tool' names the category, not the specific thing being driven.",
    },
  },
  "Mountain is to Peak as Wave is to ___": {
    principle: "A form pairs with its highest point.",
    best: "The top of a wave is its crest, as the top of a mountain is its peak.",
    traps: {
      "Foam": "Foam appears on a wave but isn't its highest point.",
      "Tide": "A tide is the sea's slow rise and fall, not the top of a single wave.",
      "Ocean": "The ocean is the whole body of water, not the wave's summit.",
    },
  },
  "Author is to Manuscript as Architect is to ___": {
    principle: "A creator pairs with the plan they produce — before the built result.",
    best: "An architect produces a blueprint, as an author produces a manuscript: the plan, not the finished thing.",
    traps: {
      "Building": "A building is the finished result; the manuscript parallels the plan, not the product.",
      "Bricks": "Bricks are materials, not the architect's document.",
      "City": "A city is far bigger than what one architect drafts.",
    },
  },
  "Glove is to Hand as Holster is to ___": {
    principle: "A fitted covering pairs with the thing it's shaped to hold.",
    best: "A holster is shaped to hold a gun, as a glove is shaped to fit a hand.",
    traps: {
      "Belt": "A holster may attach to a belt, but what it holds is a gun.",
      "Leather": "Leather is what a holster is made of, not what it holds.",
      "Pocket": "A pocket is a general pouch, not a fitted holder for one specific item.",
    },
  },
  "Calf is to Cow as Cygnet is to ___": {
    principle: "A young animal pairs with its adult of the same species.",
    best: "A cygnet grows into a swan, as a calf grows into a cow.",
    traps: {
      "Goose": "A young goose is a gosling — a cygnet is specifically a young swan.",
      "Duck": "A young duck is a duckling.",
      "Eagle": "A young eagle is an eaglet.",
    },
  },
  "Thermometer is to Temperature as Barometer is to ___": {
    principle: "An instrument pairs with the quantity it measures.",
    best: "A barometer measures atmospheric pressure, as a thermometer measures temperature.",
    traps: {
      "Rain": "A barometer can help predict rain, but what it measures is pressure.",
      "Wind": "Wind is measured by an anemometer.",
      "Heat": "Heat is measured by a thermometer, not a barometer.",
    },
  },
  "Pen is to Poet as Chisel is to ___": {
    principle: "A tool pairs with the artist who wields it.",
    best: "A chisel is the sculptor's tool, as a pen is the poet's.",
    traps: {
      "Stone": "Stone is the material a chisel works, not the artist.",
      "Statue": "A statue is the result, not the person using the tool.",
      "Hammer": "A hammer is another tool, not the artist.",
    },
  },
  "Drought is to Rain as Famine is to ___": {
    principle: "A crisis pairs with the essential thing it is a shortage of.",
    best: "A famine is a severe shortage of food, as a drought is of rain.",
    traps: {
      "Hunger": "Hunger is the effect of a famine, not the thing in short supply.",
      "Crops": "Failed crops cause famine, but the shortage itself is of food.",
      "Land": "Land isn't what a famine lacks.",
    },
  },
  "Kitten is to Cat as Joey is to ___": {
    principle: "A young animal pairs with its adult species.",
    best: "A joey is a young kangaroo, as a kitten is a young cat.",
    traps: {
      "Bear": "A young bear is a cub.",
      "Dog": "A young dog is a puppy.",
      "Horse": "A young horse is a foal.",
    },
  },
  "Caterpillar is to Butterfly as Tadpole is to ___": {
    principle: "An immature form pairs with the adult it metamorphoses into.",
    best: "A tadpole develops into a frog, as a caterpillar does into a butterfly.",
    traps: {
      "Newt": "A tadpole is the young of a frog or toad, not specifically a newt.",
      "Fish": "A tadpole isn't a fish, despite the resemblance.",
      "Snake": "Snakes don't have a tadpole stage.",
    },
  },
  "Editor is to Magazine as Director is to ___": {
    principle: "The person in overall charge pairs with the work they lead.",
    best: "A director leads the making of a film, as an editor leads a magazine.",
    traps: {
      "Actor": "An actor is directed by the director, not the work being led.",
      "Camera": "A camera is a tool used on set.",
      "Script": "A script is the starting material, not the finished work led.",
    },
  },
  "Pride is to Lions as Pack is to ___": {
    principle: "A collective noun pairs with the animal it groups.",
    best: "A group of wolves is a pack, as a group of lions is a pride.",
    traps: {
      "Sheep": "A group of sheep is a flock, not a pack.",
      "Fish": "A group of fish is a school.",
      "Birds": "A group of birds is a flock.",
    },
  },
  "Ship is to Fleet as Wolf is to ___": {
    principle: "One member pairs with the collective it forms.",
    best: "Many wolves make a pack, as many ships make a fleet.",
    traps: {
      "Herd": "A herd is for cattle and large grazers, not wolves.",
      "Flock": "A flock is for sheep or birds.",
      "School": "A school is for fish.",
    },
  },
  "Page is to Book as Scene is to ___": {
    principle: "A small unit pairs with the larger work it's part of.",
    best: "A scene is a unit of a play, as a page is a unit of a book.",
    traps: {
      "Story": "A story is content in general, not the structured work a scene belongs to.",
      "Actor": "An actor performs in a scene but isn't the whole work.",
      "Stage": "A stage is where a play is performed, not the work itself.",
    },
  },
  "Astronomer is to Telescope as Biologist is to ___": {
    principle: "A scientist pairs with the instrument central to their field.",
    best: "A biologist relies on a microscope, as an astronomer relies on a telescope.",
    traps: {
      "Cell": "A cell is what a biologist studies, not the instrument.",
      "Lab": "A lab is the place, not the instrument.",
      "Plant": "A plant is a subject of study, not the tool.",
    },
  },
  "Watch is to Wrist as Ring is to ___": {
    principle: "An accessory pairs with the body part it's worn on.",
    best: "A ring is worn on a finger, as a watch is worn on a wrist.",
    traps: {
      "Hand": "A ring sits specifically on a finger, not the hand in general.",
      "Gold": "Gold is what a ring may be made of, not where it's worn.",
      "Jewel": "A jewel is a decoration on a ring, not a body part.",
    },
  },
  "Piglet is to Pig as Gosling is to ___": {
    principle: "A young animal pairs with its adult species.",
    best: "A gosling grows into a goose, as a piglet grows into a pig.",
    traps: {
      "Duck": "A young duck is a duckling.",
      "Swan": "A young swan is a cygnet.",
      "Hen": "A young hen is a chick.",
    },
  },
  "Scalpel is to Surgeon as Gavel is to ___": {
    principle: "A signature tool pairs with the professional who uses it.",
    best: "A gavel is the judge's tool, as a scalpel is the surgeon's.",
    traps: {
      "Lawyer": "A lawyer argues in court but doesn't wield the gavel.",
      "Jury": "The jury decides the facts; the gavel belongs to the judge.",
      "Court": "A court is the place, not the person using the gavel.",
    },
  },
  "Penury is to Wealth as Malady is to ___": {
    principle: "A word pairs with the very thing it is the absence of (an opposite pairing).",
    best: "A malady is the absence of health, exactly as penury is the absence of wealth.",
    traps: {
      "Sickness": "Sickness is a synonym for a malady, not its opposite — but the pair needs the opposite.",
      "Cure": "A cure restores health but isn't the state a malady lacks.",
      "Doctor": "A doctor treats a malady but isn't what it's the absence of.",
    },
  },
  "Filly is to Mare as Colt is to ___": {
    principle: "Young pairs with adult, matched by sex: young female → adult female, young male → adult male.",
    best: "A colt is a young male horse and a stallion is the adult male, mirroring filly (young female) → mare (adult female).",
    traps: {
      "Horse": "'Horse' is the general species, not the adult male that matches the sex pattern.",
      "Foal": "A foal is a baby horse of either sex — too early a stage.",
      "Pony": "A pony is a small breed, not the grown-up stage of a colt.",
    },
  },
  "Cobbler is to Shoes as Cooper is to ___": {
    principle: "A traditional craftsperson pairs with the thing they make.",
    best: "A cooper makes barrels, as a cobbler makes and mends shoes.",
    traps: {
      "Wood": "Wood is the material a cooper uses, not the product.",
      "Cups": "A cooper makes barrels and casks, not cups.",
      "Chickens": "A cooper has nothing to do with chickens — you may be thinking of a chicken 'coop'.",
    },
  },
};
