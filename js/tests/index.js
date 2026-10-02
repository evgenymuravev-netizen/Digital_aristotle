/* Registry of all tests, in the order they run during a full assessment.
   Each module exports `meta` and an async `run(stage, { signal })`.
   The order interleaves modalities (speed / memory / attention / reasoning)
   to spread fatigue evenly across domains. */
import * as reaction from "./reaction.js";
import * as coding from "./coding.js";
import * as nback from "./nback.js";
import * as corsi from "./corsi.js";
import * as critical from "./critical.js";
import * as stroop from "./stroop.js";
import * as gonogo from "./gonogo.js";
import * as digitspan from "./digitspan.js";
import * as switching from "./switching.js";
import * as mentalmath from "./mentalmath.js";
import * as sequences from "./sequences.js";

export const TESTS = [reaction, coding, nback, corsi, critical, stroop, gonogo, digitspan, switching, mentalmath, sequences];
export const META = TESTS.map((t) => t.meta);
export const byId = Object.fromEntries(TESTS.map((t) => [t.meta.id, t]));

/* Recently added tests get a "NEW" badge on the home grid.
   v2 (June 2026): coding, corsi, gonogo, switching · v3 (Sept 2026): critical. */
export const NEW_IDS = ["critical"];
