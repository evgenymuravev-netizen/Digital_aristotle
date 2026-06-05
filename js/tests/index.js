/* Registry of all tests, in the order they run during a full assessment.
   Each module exports `meta` and an async `run(stage, { signal })`. */
import * as reaction from "./reaction.js";
import * as nback from "./nback.js";
import * as digitspan from "./digitspan.js";
import * as stroop from "./stroop.js";
import * as mentalmath from "./mentalmath.js";
import * as sequences from "./sequences.js";

export const TESTS = [reaction, nback, digitspan, stroop, mentalmath, sequences];
export const META = TESTS.map((t) => t.meta);
export const byId = Object.fromEntries(TESTS.map((t) => [t.meta.id, t]));
