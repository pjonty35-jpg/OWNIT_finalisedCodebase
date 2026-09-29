import { execSync } from "node:child_process";

console.log("\nOWNIT production performance audit");
console.log("---------------------------------");
console.log("Building production bundle...");
execSync("npm run build", { stdio: "inherit" });
console.log("\nStart with: npm start");
console.log("Then audit /, /shop, /create and a product page in Chrome Lighthouse.");
console.log("Test mobile with CPU throttling + Fast 4G and inspect:");
console.log("- LCP / INP / CLS");
console.log("- transferred JS");
console.log("- long tasks");
console.log("- JS heap / detached nodes");
console.log("- image transfer sizes");
