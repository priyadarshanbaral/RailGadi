const fs = require("fs");
const path = require("path");

const root = "c:/Users/swaga/OneDrive/Desktop/REALGADI";

function grep(file, pattern) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  const re = new RegExp(pattern);
  return lines
    .map((l, i) => ({ l, n: i + 1 }))
    .filter((x) => re.test(x.l))
    .map((x) => `${x.n}: ${x.l.trim()}`);
}

console.log("=== stationsRoutes.js routes ===");
console.log(grep(path.join(root, "server/routes/stationsRoutes.js"), "router\\.(get|post)|trains").join("\n"));

console.log("\n=== StationSearch in Home.jsx ===");
try {
  console.log(grep(path.join(root, "client/src/pages/Home.jsx"), "StationSearch").join("\n"));
} catch (e) {
  console.log("not found / error", e.message);
}

console.log("\n=== StationSearch references across client/src ===");
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith(".jsx") || ent.name.endsWith(".js")) {
      const hits = grep(p, "StationSearch");
      if (hits.length) {
        console.log(p);
        hits.forEach((h) => console.log("   " + h));
      }
    }
  }
}
walk(path.join(root, "client/src"));

console.log("\n=== StationSearch component file exists? ===");
const comp = path.join(root, "client/src/components/StationSearch.jsx");
console.log(fs.existsSync(comp));
if (fs.existsSync(comp)) {
  console.log("--- first 60 lines ---");
  console.log(fs.readFileSync(comp, "utf8").split("\n").slice(0, 60).join("\n"));
}
