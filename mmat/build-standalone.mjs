/* Bundle the MMAT app into a single self-contained HTML file.
   Run with:  node mmat/build-standalone.mjs
   Inlines styles.css + config.js + questions.js + app.js into index.html so
   the whole test works by double-clicking (no server, no modules, no CORS).

   Outputs:
     mmat/standalone.html          — full document (repo / file://), links intact
     <scratchpad>/mmat-artifact.html — body-only build for the Artifact renderer
                                       (cross-page links stripped; confirm() shim) */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, f), "utf8");

const css = read("styles.css");
const config = read("config.js");
const questions = read("questions.js");
const deep = read("deep.js");
const app = read("app.js");
let html = read("index.html");

// inline external assets
html = html.replace('<link rel="stylesheet" href="./styles.css" />', "<style>\n" + css + "\n</style>");
html = html.replace('<script src="./config.js"></script>', "<script>\n" + config + "\n</script>");
html = html.replace('<script src="./questions.js"></script>', "<script>\n" + questions + "\n</script>");
html = html.replace('<script src="./deep.js"></script>', "<script>\n" + deep + "\n</script>");
html = html.replace('<script src="./app.js"></script>', "<script>\n" + app + "\n</script>");

writeFileSync(join(here, "standalone.html"), html);

// ---- artifact variant: body content only, no cross-page links ----
let body = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"));
body = body.replace(/<nav class="topnav"[\s\S]*?<\/nav>/, "");                 // drop guide / Digital Aristotle links
body = body.replace(/<a class="btn btn-lg" href="\.\/guide\.html">[\s\S]*?<\/a>/, ""); // drop guide CTA
// sandboxed iframes may block window.confirm() modals; make submit/flows work anyway
body = body.replace("<script>\n" + config, "<script>\nwindow.confirm = function () { return true; };\n" + config);
const artifact = "<style>\n" + css + "\n</style>\n" + body;

const scratch = "/tmp/claude-0/-home-user-Digital-aristotle/15c086bf-8bd9-5ba9-933e-2a40ce60b935/scratchpad/mmat-artifact.html";
writeFileSync(scratch, artifact);

// ---- report ----
const strayFull = (html.match(/(href|src)="\.\//g) || []).length;
const strayArt = (artifact.match(/(href|src)="(\.\/|\.\.\/)/g) || []).length;
console.log("standalone.html  : " + (html.length / 1024).toFixed(0) + " KB, stray local refs: " + strayFull);
console.log("mmat-artifact.html: " + (artifact.length / 1024).toFixed(0) + " KB, stray local refs: " + strayArt);
console.log(strayArt === 0 ? "✓ artifact fully self-contained" : "✗ artifact still references local files");
