import { trains } from "./trains.js";

const t = trains[0];
console.log("COUNT:", trains.length);
console.log("FIRST KEYS:", Object.keys(t));
console.log("FIRST SAMPLE:", JSON.stringify(t, null, 2).slice(0, 1200));
